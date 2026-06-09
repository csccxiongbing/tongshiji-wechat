const express = require('express');
const router = express.Router();
const PomodoroHistory = require('../models/PomodoroHistory');
const { processCheckInAndRewards } = require('../services/rewards');

router.post('/', async (req, res) => {
  try {
    const { familyId, userId, memberName, scheduleId, taskName, duration, completed, type, points, startTime, endTime } = req.body;
    
    // 先计算奖励（如果需要）
    let rewardsResult = null;
    let pomodoroBasePoints = 0;  // 番茄钟本身的基础积分
    if (completed && familyId && userId && memberName) {
      try {
        rewardsResult = await processCheckInAndRewards({
          familyId,
          userId,
          memberName,
          checkInType: 'pomodoro',
          referenceId: null
        });
        // 只取番茄钟基础积分（rewards数组第一项是番茄钟基础积分）
        pomodoroBasePoints = rewardsResult?.rewards?.[0]?.points || 0;
      } catch (rewardError) {
        console.error('发放打卡奖励失败:', rewardError);
      }
    }
    
    // 创建番茄钟历史，points 字段只记录番茄钟本身的基础积分
    const history = new PomodoroHistory({
      familyId,
      userId,
      scheduleId,
      taskName,
      duration,
      completed,
      type: type || 'pomodoro',
      points: pomodoroBasePoints,  // 只记录番茄钟基础积分
      memberName: memberName || '',
      startTime,
      endTime,
    });
    
    await history.save();
    
    res.json({ 
      success: true, 
      history,
      rewards: rewardsResult 
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/user/:userId/family/:familyId', async (req, res) => {
  try {
    const history = await PomodoroHistory.find({ 
      userId: req.params.userId,
      familyId: req.params.familyId 
    }).sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const history = await PomodoroHistory.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/family/:familyId', async (req, res) => {
  try {
    const history = await PomodoroHistory.find({ familyId: req.params.familyId }).sort({ createdAt: -1 });
    res.json({ success: true, history });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
