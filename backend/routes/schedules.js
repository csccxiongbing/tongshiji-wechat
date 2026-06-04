const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');

router.get('/family/:familyId', async (req, res) => {
  try {
    const schedules = await Schedule.find({ familyId: req.params.familyId });
    // 将 _id 转换为 id 供前端使用
    const formattedSchedules = schedules.map(s => ({
      ...s.toObject(),
      id: s._id.toString()
    }));
    res.json({ success: true, schedules: formattedSchedules });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { familyId, ...scheduleData } = req.body;
    
    const schedule = new Schedule({
      familyId,
      ...scheduleData,
    });
    
    await schedule.save();
    
    // 返回时添加 id 字段
    const formattedSchedule = {
      ...schedule.toObject(),
      id: schedule._id.toString()
    };
    res.json({ success: true, schedule: formattedSchedule });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.json({ success: false, message: '日程不存在' });
    }
    // 返回时添加 id 字段
    const formattedSchedule = {
      ...schedule.toObject(),
      id: schedule._id.toString()
    };
    res.json({ success: true, schedule: formattedSchedule });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!schedule) {
      return res.json({ success: false, message: '日程不存在' });
    }
    
    // 返回时添加 id 字段
    const formattedSchedule = {
      ...schedule.toObject(),
      id: schedule._id.toString()
    };
    res.json({ success: true, schedule: formattedSchedule });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    
    if (!schedule) {
      return res.json({ success: false, message: '日程不存在' });
    }
    
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.put('/:id/complete', async (req, res) => {
  try {
    const { memberName } = req.body;
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.json({ success: false, message: '日程不存在' });
    }
    
    if (!schedule.completedBy.includes(memberName)) {
      schedule.completedBy.push(memberName);
    }
    
    schedule.completed = schedule.scheduleMembers.length === schedule.completedBy.length;
    
    await schedule.save();
    
    // 返回时添加 id 字段
    const formattedSchedule = {
      ...schedule.toObject(),
      id: schedule._id.toString()
    };
    res.json({ success: true, schedule: formattedSchedule });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// 取消完成日程
router.put('/:id/uncomplete', async (req, res) => {
  try {
    const { memberName } = req.body;
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.json({ success: false, message: '日程不存在' });
    }
    
    // 从 completedBy 中移除该成员
    schedule.completedBy = schedule.completedBy.filter(name => name !== memberName);
    
    // 重新计算是否全部完成
    schedule.completed = schedule.scheduleMembers.length > 0 && 
                         schedule.scheduleMembers.length === schedule.completedBy.length;
    
    await schedule.save();
    
    // 返回时添加 id 字段
    const formattedSchedule = {
      ...schedule.toObject(),
      id: schedule._id.toString()
    };
    res.json({ success: true, schedule: formattedSchedule });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
