const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Family = require('../models/Family');
const Schedule = require('../models/Schedule');
const PointsHistory = require('../models/PointsHistory');
const PomodoroHistory = require('../models/PomodoroHistory');

router.post('/clear-all', async (req, res) => {
  try {
    await User.deleteMany({});
    await Family.deleteMany({});
    await Schedule.deleteMany({});
    await PointsHistory.deleteMany({});
    await PomodoroHistory.deleteMany({});
    
    console.log('数据库已清空');
    res.json({ success: true, message: '数据库已清空' });
  } catch (error) {
    console.error('清空数据库错误:', error);
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
