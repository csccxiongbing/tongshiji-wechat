const express = require('express');
const router = express.Router();
const Wish = require('../models/Wish');
const WishExchangeHistory = require('../models/WishExchangeHistory');
const Family = require('../models/Family');
const PointsHistory = require('../models/PointsHistory');

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

router.get('/family/:familyId', async (req, res) => {
  try {
    const wishes = await Wish.find({ familyId: req.params.familyId });
    const formattedWishes = wishes.map(w => ({
      ...w.toObject(),
      id: w._id.toString()
    }));
    res.json({ success: true, wishes: formattedWishes });
  } catch (error) {
    console.error('加载心愿错误:', error);
    res.json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { familyId, ...wishData } = req.body;
    
    // 确保background字段有值
    if (!wishData.background) {
      wishData.background = 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)';
    }
    
    const wish = new Wish({
      familyId,
      ...wishData,
    });
    
    await wish.save();
    
    const formattedWish = {
      ...wish.toObject(),
      id: wish._id.toString()
    };
    res.json({ success: true, wish: formattedWish });
  } catch (error) {
    console.error('添加心愿错误:', error);
    res.json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const wish = await Wish.findById(req.params.id);
    
    if (!wish) {
      return res.json({ success: false, message: '心愿不存在' });
    }
    
    const formattedWish = {
      ...wish.toObject(),
      id: wish._id.toString()
    };
    res.json({ success: true, wish: formattedWish });
  } catch (error) {
    console.error('获取心愿错误:', error);
    res.json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const wish = await Wish.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    if (!wish) {
      return res.json({ success: false, message: '心愿不存在' });
    }
    
    const formattedWish = {
      ...wish.toObject(),
      id: wish._id.toString()
    };
    res.json({ success: true, wish: formattedWish });
  } catch (error) {
    console.error('更新心愿错误:', error);
    res.json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const wish = await Wish.findByIdAndDelete(req.params.id);
    
    if (!wish) {
      return res.json({ success: false, message: '心愿不存在' });
    }
    
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除心愿错误:', error);
    res.json({ success: false, message: error.message });
  }
});

router.post('/exchange', async (req, res) => {
  try {
    const { familyId, userId, wishId, memberName } = req.body;
    
    const wish = await Wish.findById(wishId);
    if (!wish) {
      return res.json({ success: false, message: '心愿不存在' });
    }
    
    if (wish.assignedTo.length > 0 && !wish.assignedTo.includes(memberName)) {
      return res.json({ success: false, message: '该心愿未分配给此成员' });
    }
    
    const family = await Family.findById(familyId);
    if (!family) {
      return res.json({ success: false, message: '家庭不存在' });
    }
    
    const memberIndex = family.members.findIndex(m => m.name === memberName);
    if (memberIndex === -1) {
      return res.json({ success: false, message: '成员不存在' });
    }
    
    const memberPoints = family.members[memberIndex].points || 0;
    if (memberPoints < wish.points) {
      return res.json({ success: false, message: '积分不足' });
    }
    
    if (wish.weeklyLimitEnabled && wish.weeklyLimitCount > 0) {
      const now = new Date();
      const weekNumber = getWeekNumber(now);
      const year = now.getFullYear();
      
      const weekExchangeCount = await WishExchangeHistory.countDocuments({
        familyId,
        wishId,
        memberName,
        weekNumber,
        year
      });
      
      if (weekExchangeCount >= wish.weeklyLimitCount) {
        return res.json({ success: false, message: '本周已达到兑换上限' });
      }
    }
    
    const newBalance = Math.max(0, memberPoints - wish.points);
    family.members[memberIndex].points = newBalance;
    family.totalPoints = family.members.reduce((sum, m) => sum + (m.points || 0), 0);
    await family.save();
    
    const now = new Date();
    const exchangeHistory = new WishExchangeHistory({
      familyId,
      userId,
      wishId,
      wishName: wish.name,
      memberName,
      points: wish.points,
      exchangeTime: now,
      weekNumber: getWeekNumber(now),
      year: now.getFullYear()
    });
    await exchangeHistory.save();
    
    const pointsHistory = new PointsHistory({
      familyId,
      userId,
      memberName,
      amount: -wish.points,
      reason: `兑换心愿：${wish.name}`,
      time: new Date().toLocaleString(),
      balance: newBalance,
    });
    await pointsHistory.save();
    
    const memberPointsData = {};
    family.members.forEach(m => {
      memberPointsData[m.name] = m.points || 0;
    });
    
    res.json({ success: true, message: '兑换成功', memberPoints: memberPointsData, memberPointsValue: newBalance });
  } catch (error) {
    console.error('兑换心愿错误:', error);
    res.json({ success: false, message: error.message });
  }
});

router.get('/history/family/:familyId', async (req, res) => {
  try {
    const history = await WishExchangeHistory.find({ familyId: req.params.familyId }).sort({ exchangeTime: -1 });
    res.json({ success: true, history });
  } catch (error) {
    console.error('加载兑换历史错误:', error);
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
