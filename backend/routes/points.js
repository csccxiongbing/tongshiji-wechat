const express = require('express');
const router = express.Router();
const PointsHistory = require('../models/PointsHistory');
const Family = require('../models/Family');

router.post('/add', async (req, res) => {
  try {
    const { familyId, userId, memberName, amount, reason } = req.body;
    
    const family = await Family.findById(familyId);
    if (!family) {
      return res.json({ success: false, message: '家庭不存在' });
    }
    
    const memberIndex = family.members.findIndex(m => m.name === memberName);
    if (memberIndex === -1) {
      return res.json({ success: false, message: '成员不存在' });
    }
    
    family.members[memberIndex].points = (family.members[memberIndex].points || 0) + amount;
    family.totalPoints = family.members.reduce((sum, m) => sum + (m.points || 0), 0);
    await family.save();
    
    const history = new PointsHistory({
      familyId,
      userId,
      memberName,
      amount,
      reason,
      time: new Date().toLocaleString(),
      balance: family.members[memberIndex].points,
    });
    
    await history.save();
    
    const memberPoints = {};
    family.members.forEach(m => {
      memberPoints[m.name] = m.points || 0;
    });
    
    res.json({ success: true, history, memberPoints, totalPoints: family.totalPoints });
  } catch (error) {
    console.error('添加积分错误:', error);
    res.json({ success: false, message: error.message });
  }
});

router.get('/history/:familyId', async (req, res) => {
  try {
    const history = await PointsHistory.find({ familyId: req.params.familyId }).sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (error) {
    console.error('获取积分历史错误:', error);
    res.json({ success: false, message: error.message });
  }
});

router.post('/subtract', async (req, res) => {
  try {
    const { familyId, userId, memberName, amount, reason } = req.body;
    
    const family = await Family.findById(familyId);
    if (!family) {
      return res.json({ success: false, message: '家庭不存在' });
    }
    
    const memberIndex = family.members.findIndex(m => m.name === memberName);
    if (memberIndex === -1) {
      return res.json({ success: false, message: '成员不存在' });
    }
    
    const newBalance = Math.max(0, (family.members[memberIndex].points || 0) - amount);
    family.members[memberIndex].points = newBalance;
    family.totalPoints = family.members.reduce((sum, m) => sum + (m.points || 0), 0);
    await family.save();
    
    const history = new PointsHistory({
      familyId,
      userId,
      memberName,
      amount: -amount,
      reason,
      time: new Date().toLocaleString(),
      balance: newBalance,
    });
    
    await history.save();
    
    const memberPoints = {};
    family.members.forEach(m => {
      memberPoints[m.name] = m.points || 0;
    });
    
    res.json({ success: true, history, memberPoints, totalPoints: family.totalPoints });
  } catch (error) {
    console.error('扣除积分错误:', error);
    res.json({ success: false, message: error.message });
  }
});

router.get('/family/:familyId', async (req, res) => {
  try {
    const family = await Family.findById(req.params.familyId);
    if (!family) {
      return res.json({ success: false, message: '家庭不存在' });
    }
    
    const memberPoints = {};
    family.members.forEach(m => {
      memberPoints[m.name] = m.points || 0;
    });
    
    res.json({ success: true, totalPoints: family.totalPoints, memberPoints });
  } catch (error) {
    console.error('获取积分错误:', error);
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
