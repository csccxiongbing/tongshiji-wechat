const express = require('express');
const router = express.Router();
const PomodoroHistory = require('../models/PomodoroHistory');

router.post('/', async (req, res) => {
  try {
    const { familyId, userId, scheduleId, taskName, duration, completed, points, startTime, endTime } = req.body;
    
    const history = new PomodoroHistory({
      familyId,
      userId,
      scheduleId,
      taskName,
      duration,
      completed,
      points,
      startTime,
      endTime,
    });
    
    await history.save();
    
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
