const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const DailyCompletion = require('../models/DailyCompletion');
const { addTaskPoints, subtractTaskPoints } = require('../services/rewards');
const { isValidObjectId, hasDollarKeys } = require('../middleware/validation');

async function findScheduleById(id) {
  if (!isValidObjectId(id)) return null;
  return await Schedule.findById(id);
}

router.get('/family/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    if (!isValidObjectId(familyId)) {
      return res.status(400).json({ success: false, message: '无效的家庭ID格式' });
    }
    const schedules = await Schedule.find({ familyId });
    const formattedSchedules = schedules.map(s => ({
      ...s.toObject(),
      id: s._id.toString()
    }));
    res.json({ success: true, schedules: formattedSchedules });
  } catch (error) {
    console.error('获取日程列表错误:', error);
    res.status(500).json({ success: false, message: '获取日程列表失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      familyId,
      title,
      time,
      startTime,
      endTime,
      icon,
      color,
      note,
      points,
      repeatRule,
      repeatDays,
      repeatRuleText,
      startDate,
      endRepeat,
      endRepeatDate,
      remindEnabled,
      remindMembers,
      remindMembersText,
      remindTime,
      scheduleMembers
    } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ success: false, message: '标题为必填项' });
    }
    if (familyId !== undefined && !isValidObjectId(familyId)) {
      return res.status(400).json({ success: false, message: '无效的家庭ID格式' });
    }
    if (hasDollarKeys(req.body)) {
      return res.status(400).json({ success: false, message: '请求数据格式无效' });
    }

    const schedule = new Schedule({
      familyId: familyId || null,
      title,
      time: time || '',
      startTime: startTime || '',
      endTime: endTime || '',
      icon: icon || '📋',
      color: color || '#FFFFFF',
      note: note || '',
      points: typeof points === 'number' ? points : 0,
      repeatRule: repeatRule || 'never',
      repeatDays: repeatDays || [],
      repeatRuleText: repeatRuleText || '',
      startDate: startDate || '',
      endRepeat: endRepeat || 'never',
      endRepeatDate: endRepeatDate || '',
      remindEnabled: !!remindEnabled,
      remindMembers: remindMembers || [],
      remindMembersText: remindMembersText || '',
      remindTime: typeof remindTime === 'number' ? remindTime : 0,
      scheduleMembers: scheduleMembers || [],
      completed: false,
      completedBy: []
    });

    await schedule.save();

    const formattedSchedule = {
      ...schedule.toObject(),
      id: schedule._id.toString()
    };
    res.json({ success: true, schedule: formattedSchedule });
  } catch (error) {
    console.error('创建日程错误:', error);
    res.status(500).json({ success: false, message: '创建日程失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: '无效的日程ID格式' });
    }
    const schedule = await findScheduleById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: '日程不存在' });
    }
    const formattedSchedule = {
      ...schedule.toObject(),
      id: schedule._id.toString()
    };
    res.json({ success: true, schedule: formattedSchedule });
  } catch (error) {
    console.error('获取日程错误:', error);
    res.status(500).json({ success: false, message: '获取日程失败' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: '无效的日程ID格式' });
    }
    if (hasDollarKeys(req.body)) {
      return res.status(400).json({ success: false, message: '请求数据格式无效' });
    }

    const {
      familyId,
      title,
      time,
      startTime,
      endTime,
      icon,
      color,
      note,
      points,
      repeatRule,
      repeatDays,
      repeatRuleText,
      startDate,
      endRepeat,
      endRepeatDate,
      remindEnabled,
      remindMembers,
      remindMembersText,
      remindTime,
      scheduleMembers
    } = req.body;

    const updateData = {};
    if (familyId !== undefined) {
      if (!isValidObjectId(familyId)) {
        return res.status(400).json({ success: false, message: '无效的家庭ID格式' });
      }
      updateData.familyId = familyId;
    }
    if (title !== undefined) updateData.title = title;
    if (time !== undefined) updateData.time = time;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (icon !== undefined) updateData.icon = icon;
    if (color !== undefined) updateData.color = color;
    if (note !== undefined) updateData.note = note;
    if (points !== undefined) updateData.points = typeof points === 'number' ? points : 0;
    if (repeatRule !== undefined) updateData.repeatRule = repeatRule;
    if (repeatDays !== undefined) updateData.repeatDays = repeatDays;
    if (repeatRuleText !== undefined) updateData.repeatRuleText = repeatRuleText;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endRepeat !== undefined) updateData.endRepeat = endRepeat;
    if (endRepeatDate !== undefined) updateData.endRepeatDate = endRepeatDate;
    if (remindEnabled !== undefined) updateData.remindEnabled = !!remindEnabled;
    if (remindMembers !== undefined) updateData.remindMembers = remindMembers;
    if (remindMembersText !== undefined) updateData.remindMembersText = remindMembersText;
    if (remindTime !== undefined) updateData.remindTime = typeof remindTime === 'number' ? remindTime : 0;
    if (scheduleMembers !== undefined) updateData.scheduleMembers = scheduleMembers;

    const schedule = await Schedule.findByIdAndUpdate(id, updateData, { new: true });
    if (!schedule) {
      return res.status(404).json({ success: false, message: '日程不存在' });
    }

    const formattedSchedule = {
      ...schedule.toObject(),
      id: schedule._id.toString()
    };
    res.json({ success: true, schedule: formattedSchedule });
  } catch (error) {
    console.error('更新日程错误:', error);
    res.status(500).json({ success: false, message: '更新日程失败' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: '无效的日程ID格式' });
    }
    const schedule = await Schedule.findByIdAndDelete(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: '日程不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除日程错误:', error);
    res.status(500).json({ success: false, message: '删除日程失败' });
  }
});

router.put('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { memberName, userId } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: '无效的日程ID格式' });
    }
    if (!memberName || typeof memberName !== 'string') {
      return res.status(400).json({ success: false, message: '成员名称为必填项' });
    }
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: '无效的用户ID格式' });
    }

    const schedule = await findScheduleById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: '日程不存在' });
    }

    const result = await Schedule.findByIdAndUpdate(
      id,
      { $addToSet: { completedBy: memberName } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ success: false, message: '日程不存在' });
    }

    const prevCompletedByLength = schedule.completedBy.length;
    const newCompletedByLength = result.completedBy.length;
    const isFirstComplete = newCompletedByLength > prevCompletedByLength;

    const scheduleAfterSave = await Schedule.findByIdAndUpdate(
      id,
      { completed: result.scheduleMembers.length === result.completedBy.length },
      { new: true }
    );

    let taskPointsResult = null;

    if (schedule.familyId && userId && memberName && isFirstComplete) {
      if (schedule.points && schedule.points > 0) {
        try {
          taskPointsResult = await addTaskPoints({
            familyId: schedule.familyId,
            userId,
            memberName,
            taskPoints: schedule.points,
            taskTitle: schedule.title
          });
        } catch (taskPointsError) {
          console.error('发放任务积分失败:', taskPointsError);
        }
      }
    }

    const formattedSchedule = {
      ...scheduleAfterSave.toObject(),
      id: scheduleAfterSave._id.toString()
    };
    res.json({
      success: true,
      schedule: formattedSchedule,
      rewards: taskPointsResult ? {
        awardedPoints: taskPointsResult.awardedPoints,
        rewards: [{
          ruleKey: 'task_points',
          ruleName: `任务：${schedule.title}`,
          icon: '✅',
          points: taskPointsResult.awardedPoints
        }]
      } : { awardedPoints: 0, rewards: [] }
    });
  } catch (error) {
    console.error('完成任务时发生错误:', error);
    res.status(500).json({ success: false, message: '完成任务失败' });
  }
});

router.put('/:id/uncomplete', async (req, res) => {
  try {
    const { id } = req.params;
    const { memberName, userId } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: '无效的日程ID格式' });
    }
    if (!memberName || typeof memberName !== 'string') {
      return res.status(400).json({ success: false, message: '成员名称为必填项' });
    }
    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: '无效的用户ID格式' });
    }

    const schedule = await findScheduleById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: '日程不存在' });
    }

    const index = schedule.completedBy.indexOf(memberName);
    if (index > -1) {
      schedule.completedBy.splice(index, 1);
    }
    schedule.completed = schedule.scheduleMembers.length === schedule.completedBy.length;
    await schedule.save();

    let deductedPoints = 0;
    if (schedule.familyId && memberName && schedule.points && schedule.points > 0) {
      try {
        const deductResult = await subtractTaskPoints({
          familyId: schedule.familyId,
          userId,
          memberName,
          taskPoints: schedule.points,
          taskTitle: schedule.title
        });
        deductedPoints = deductResult.deductedPoints || 0;
      } catch (deductError) {
        console.error('扣除任务积分失败:', deductError);
      }
    }

    const formattedSchedule = {
      ...schedule.toObject(),
      id: schedule._id.toString()
    };
    res.json({
      success: true,
      schedule: formattedSchedule,
      deductedPoints: deductedPoints
    });
  } catch (error) {
    console.error('取消完成日程错误:', error);
    res.status(500).json({ success: false, message: '取消完成日程失败' });
  }
});

router.get('/today/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    if (!isValidObjectId(familyId)) {
      return res.status(400).json({ success: false, message: '无效的家庭ID格式' });
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();

    const schedules = await Schedule.find({ familyId });
    
    const todaySchedules = schedules.filter(schedule => {
      if (schedule.startDate && todayStr < schedule.startDate) {
        return false;
      }

      if (schedule.endRepeat === 'date' && schedule.endRepeatDate && todayStr > schedule.endRepeatDate) {
        return false;
      }

      switch (schedule.repeatRule) {
        case 'daily':
          return true;
        case 'weekday':
          return dayOfWeek >= 1 && dayOfWeek <= 5;
        case 'weekly':
          if (!schedule.repeatDays || schedule.repeatDays.length === 0) return false;
          return schedule.repeatDays.includes(dayOfWeek);
        case 'monthly':
          if (!schedule.repeatDays || schedule.repeatDays.length === 0) return false;
          return schedule.repeatDays.includes(dayOfMonth);
        case 'never':
          if (!schedule.startDate) return false;
          return schedule.startDate === todayStr;
        default:
          return false;
      }
    });

    const formattedSchedules = todaySchedules.map(s => ({
      ...s.toObject(),
      id: s._id.toString()
    }));

    res.json({ success: true, schedules: formattedSchedules });
  } catch (error) {
    console.error('获取今日日程错误:', error);
    res.status(500).json({ success: false, message: '获取今日日程失败' });
  }
});

router.get('/completions/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    const { date, scheduleId } = req.query;

    if (!isValidObjectId(familyId)) {
      return res.status(400).json({ success: false, message: '无效的家庭ID格式' });
    }

    let query = {};
    if (scheduleId) {
      if (!isValidObjectId(scheduleId)) {
        return res.status(400).json({ success: false, message: '无效的日程ID格式' });
      }
      query.scheduleId = scheduleId;
    }
    if (date) {
      query.date = date;
    }

    const completions = await DailyCompletion.find(query)
      .populate('scheduleId')
      .exec();

    const formattedCompletions = completions.map(c => ({
      ...c.toObject(),
      id: c._id.toString(),
      scheduleId: c.scheduleId._id.toString(),
      scheduleTitle: c.scheduleId.title
    }));

    res.json({ success: true, completions: formattedCompletions });
  } catch (error) {
    console.error('获取完成记录错误:', error);
    res.status(500).json({ success: false, message: '获取完成记录失败' });
  }
});

router.get('/:id/completions/:date', async (req, res) => {
  try {
    const { id, date } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: '无效的日程ID格式' });
    }

    const completion = await DailyCompletion.findOne({ scheduleId: id, date });
    if (!completion) {
      return res.json({ success: true, completion: null });
    }

    const formattedCompletion = {
      ...completion.toObject(),
      id: completion._id.toString()
    };

    res.json({ success: true, completion: formattedCompletion });
  } catch (error) {
    console.error('获取日程完成记录错误:', error);
    res.status(500).json({ success: false, message: '获取完成记录失败' });
  }
});

router.post('/:id/completions/:date', async (req, res) => {
  try {
    const { id, date } = req.params;
    const { memberName, completed, userId } = req.body;

    console.log(`=== 更新完成记录 ===`);
    console.log(`scheduleId: ${id}`);
    console.log(`date: ${date}`);
    console.log(`memberName: ${memberName}`);
    console.log(`completed: ${completed}`);
    console.log(`userId: ${userId}`);

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: '无效的日程ID格式' });
    }
    if (!memberName) {
      return res.status(400).json({ success: false, message: '成员名称不能为空' });
    }

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: '日程不存在' });
    }

    console.log(`找到日程: ${schedule.title}`);
    console.log(`查询条件: { scheduleId: ${id}, date: ${date} }`);
    
    let dailyCompletion = await DailyCompletion.findOne({ scheduleId: id, date });
    console.log(`找到每日完成记录: ${dailyCompletion ? '是' : '否'}`);

    if (completed) {
      if (!dailyCompletion) {
        dailyCompletion = new DailyCompletion({
          scheduleId: id,
          date,
          completions: []
        });
      }

      const existingIndex = dailyCompletion.completions.findIndex(c => c.memberName === memberName);
      if (existingIndex >= 0) {
        dailyCompletion.completions[existingIndex] = {
          memberName,
          completedAt: new Date(),
          completedBy: userId || null,
          pointsEarned: schedule.points,
          pointsDeducted: false
        };
      } else {
        dailyCompletion.completions.push({
          memberName,
          completedAt: new Date(),
          completedBy: userId || null,
          pointsEarned: schedule.points,
          pointsDeducted: false
        });
      }

      if (schedule.familyId && userId && schedule.points > 0) {
        await addTaskPoints({
          familyId: schedule.familyId.toString(),
          userId,
          memberName,
          taskPoints: schedule.points,
          taskTitle: schedule.title
        });
      }
    } else {
      if (dailyCompletion) {
        const existingIndex = dailyCompletion.completions.findIndex(c => c.memberName === memberName);
        if (existingIndex >= 0) {
          const pointsEarned = dailyCompletion.completions[existingIndex].pointsEarned;
          dailyCompletion.completions.splice(existingIndex, 1);

          if (schedule.familyId && userId && pointsEarned > 0) {
            await subtractTaskPoints({
              familyId: schedule.familyId.toString(),
              userId,
              memberName,
              taskPoints: pointsEarned,
              taskTitle: schedule.title
            });
          }
        }
      }
    }

    dailyCompletion.updatedAt = new Date();
    await dailyCompletion.save();

    const formattedCompletion = {
      ...dailyCompletion.toObject(),
      id: dailyCompletion._id.toString()
    };

    res.json({ success: true, completion: formattedCompletion });
  } catch (error) {
    console.error('更新完成记录错误:', error);
    res.status(500).json({ success: false, message: '更新完成记录失败' });
  }
});

router.get('/stats/completed/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    const { memberName } = req.query;

    console.log(`=== 统计完成任务数 ===`);
    console.log(`familyId: ${familyId}`);
    console.log(`memberName: ${memberName}`);

    if (!isValidObjectId(familyId)) {
      return res.status(400).json({ success: false, message: '无效的家庭ID格式' });
    }

    const schedules = await Schedule.find({ 
      familyId, 
      deleted: { $ne: true } 
    });

    const scheduleIds = schedules.map(s => s._id);
    console.log(`找到日程数量: ${schedules.length}`);
    console.log(`日程ID列表:`, scheduleIds);

    let query = { scheduleId: { $in: scheduleIds } };
    
    // 获取所有每日完成记录
    const completions = await DailyCompletion.find(query).populate('scheduleId');
    
    // 构建日程ID到成员列表的映射
    const scheduleMembersMap = {};
    schedules.forEach(s => {
      const members = s.scheduleMembers || [];
      scheduleMembersMap[s._id.toString()] = members;
    });
    
    console.log(`日程成员映射:`, scheduleMembersMap);

    // 按成员统计真正完成的任务数（所有成员都完成才算完成）
    const memberCompletedCount = {};
    
    // 按日期统计每天完成的任务数
    const dateCompletedCount = {};
    
    completions.forEach(completion => {
      const scheduleId = completion.scheduleId ? completion.scheduleId._id.toString() : completion.scheduleId.toString();
      const date = completion.date;
      const completedMembers = completion.completions.map(c => c.memberName);
      const allMembers = scheduleMembersMap[scheduleId] || [];
      
      // 检查是否所有成员都完成了
      const allCompleted = allMembers.length > 0 && allMembers.every(m => completedMembers.includes(m));
      
      if (allCompleted) {
        // 统计每个成员的完成次数
        completedMembers.forEach(member => {
          if (!memberCompletedCount[member]) {
            memberCompletedCount[member] = 0;
          }
          memberCompletedCount[member]++;
        });
        
        // 统计每天完成的任务数
        if (!dateCompletedCount[date]) {
          dateCompletedCount[date] = 0;
        }
        dateCompletedCount[date]++;
      }
    });

    console.log(`成员完成次数统计:`, memberCompletedCount);
    console.log(`每天完成任务数:`, dateCompletedCount);

    if (memberName) {
      // 返回特定成员的完成数
      const total = memberCompletedCount[memberName] || 0;
      res.json({ success: true, total });
    } else {
      // 返回所有成员的完成数
      res.json({ success: true, stats: memberCompletedCount, dateStats: dateCompletedCount });
    }
  } catch (error) {
    console.error('统计完成任务数错误:', error);
    res.status(500).json({ success: false, message: '统计失败' });
  }
});

module.exports = router;
