const express = require('express');
const router = express.Router();
const PointsHistory = require('../models/PointsHistory');
const User = require('../models/User');

router.post('/add', async (req, res) => {
  try {
    const { familyId, userId, memberName, amount, reason, balance } = req.body;
    
    const history = new PointsHistory({
      familyId,
      userId,
      memberName,
      amount,
      reason,
      time: new Date().toLocaleString(),
      balance,
    });
    
    await history.save();
    
    const user = await User.findById(userId);
    if (user) {
      user.points = balance;
      if (memberName) {
        user.memberPoints[memberName] = (user.memberPoints[memberName] || 0) + amount;
      }
      await user.save();
    }
    
    res.json({ success: true, history });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/history/:familyId', async (req, res) => {
  try {
    const history = await PointsHistory.find({ familyId: req.params.familyId }).sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/subtract', async (req, res) => {
  try {
    const { familyId, userId, memberName, amount, reason, balance } = req.body;
    
    const history = new PointsHistory({
      familyId,
      userId,
      memberName,
      amount: -amount,
      reason,
      time: new Date().toLocaleString(),
      balance,
    });
    
    await history.save();
    
    const user = await User.findById(userId);
    if (user) {
      user.points = balance;
      if (memberName) {
        user.memberPoints[memberName] = Math.max(0, (user.memberPoints[memberName] || 0) - amount);
      }
      await user.save();
    }
    
    res.json({ success: true, history });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, points: user.points, memberPoints: user.memberPoints });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
