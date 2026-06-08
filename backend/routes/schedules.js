const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const { processCheckInAndRewards, addTaskPoints } = require('../services/rewards');

console.log('=== schedules.js 已被加载 ===');

// 辅助函数：根据 id 查找日程（支持多种格式）
async function findScheduleById(id) {
  console.log('findScheduleById 被调用, id:', id);
  let schedule = null;
  
  // 检查是否是有效的 ObjectId（24个十六进制字符）
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  console.log('是否是有效的 ObjectId:', isValidObjectId);
  
  // 如果是有效的 ObjectId，尝试用 _id 查询
  if (isValidObjectId) {
    try {
      schedule = await Schedule.findById(id);
      console.log('通过 findById 查询结果:', schedule ? '找到' : '未找到');
    } catch (e) {
      console.log('findById 查询出错:', e.message);
    }
  }
  
  // 如果 _id 查询失败，尝试用 mongoose.Types.ObjectId 创建新的 ObjectId 查询
  if (!schedule && id.length > 0) {
    try {
      const objectId = new mongoose.Types.ObjectId(id);
      schedule = await Schedule.findById(objectId);
      console.log('通过 new ObjectId 查询结果:', schedule ? '找到' : '未找到');
    } catch (e) {
      console.log('new ObjectId 查询出错:', e.message);
    }
  }
  
  return schedule;
}

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
    const schedule = await findScheduleById(req.params.id);
    
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
    let schedule = null;
    const id = req.params.id;
    
    // 检查是否是有效的 ObjectId（24个十六进制字符）
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    // 如果是有效的 ObjectId，尝试用 _id 查询和更新
    if (isValidObjectId) {
      try {
        schedule = await Schedule.findByIdAndUpdate(id, req.body, { new: true });
      } catch (e) {
        // ObjectId 格式错误
      }
    }
    
    // 如果还是没找到，尝试用 mongoose.Types.ObjectId 创建新的 ObjectId
    if (!schedule && id.length > 0) {
      try {
        const objectId = new mongoose.Types.ObjectId(id);
        schedule = await Schedule.findByIdAndUpdate(objectId, req.body, { new: true });
      } catch (e) {
        // 查询错误
      }
    }
    
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
    let schedule = null;
    const id = req.params.id;
    
    // 检查是否是有效的 ObjectId（24个十六进制字符）
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    // 如果是有效的 ObjectId，尝试用 _id 查询和删除
    if (isValidObjectId) {
      try {
        schedule = await Schedule.findByIdAndDelete(id);
      } catch (e) {
        // ObjectId 格式错误
      }
    }
    
    // 如果还是没找到，尝试用 mongoose.Types.ObjectId 创建新的 ObjectId
    if (!schedule && id.length > 0) {
      try {
        const objectId = new mongoose.Types.ObjectId(id);
        schedule = await Schedule.findByIdAndDelete(objectId);
      } catch (e) {
        // 查询错误
      }
    }
    
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
    const { memberName, userId } = req.body;
    console.log('complete 路由被调用, id:', req.params.id, 'memberName:', memberName);
    
    const schedule = await findScheduleById(req.params.id);
    console.log('找到的 schedule:', schedule ? schedule.title : 'null');
    
    if (!schedule) {
      return res.json({ success: false, message: '日程不存在' });
    }
    
    const isFirstComplete = !schedule.completedBy.includes(memberName);
    
    if (isFirstComplete) {
      schedule.completedBy.push(memberName);
    }
    
    schedule.completed = schedule.scheduleMembers.length === schedule.completedBy.length;
    
    await schedule.save();

    let rewardsResult = null;
    let taskPointsResult = null;
    
    if (isFirstComplete && schedule.familyId && userId && memberName) {
      console.log('=== 开始处理任务完成 ===');
      
      // 1. 先调用 processCheckInAndRewards 获取打卡奖励
      try {
        rewardsResult = await processCheckInAndRewards({
          familyId: schedule.familyId,
          userId,
          memberName,
          checkInType: 'task',
          referenceId: schedule._id
        });
        console.log('打卡奖励获取成功:', rewardsResult);
      } catch (rewardError) {
        console.error('发放打卡奖励失败:', rewardError);
        console.error('错误堆栈:', rewardError.stack);
      }
      
      // 2. 如果任务有积分，单独调用 addTaskPoints 发放任务积分
      if (schedule.points && schedule.points > 0) {
        try {
          taskPointsResult = await addTaskPoints({
            familyId: schedule.familyId,
            userId,
            memberName,
            taskPoints: schedule.points,
            taskTitle: schedule.title
          });
          console.log('任务积分添加成功:', taskPointsResult);
        } catch (taskPointsError) {
          console.error('发放任务积分失败:', taskPointsError);
          console.error('错误堆栈:', taskPointsError.stack);
        }
      }
    } else {
      console.log('=== 不调用打卡奖励 ===');
      console.log('isFirstComplete:', isFirstComplete);
      console.log('schedule.familyId:', schedule.familyId);
      console.log('userId:', userId);
      console.log('memberName:', memberName);
    }
    
    // 计算总奖励积分
    let totalAwardedPoints = 0;
    if (rewardsResult && rewardsResult.awardedPoints) {
      totalAwardedPoints += rewardsResult.awardedPoints;
    }
    if (taskPointsResult && taskPointsResult.awardedPoints) {
      totalAwardedPoints += taskPointsResult.awardedPoints;
    }
    
    // 合并奖励列表
    let combinedRewards = [];
    if (rewardsResult && rewardsResult.rewards) {
      combinedRewards = [...rewardsResult.rewards];
    }
    if (taskPointsResult && taskPointsResult.awardedPoints > 0) {
      combinedRewards.push({
        ruleKey: 'task_points',
        ruleName: `任务：${schedule.title}`,
        icon: '✅',
        points: taskPointsResult.awardedPoints
      });
    }
    
    // 返回时添加 id 字段
    const formattedSchedule = {
      ...schedule.toObject(),
      id: schedule._id.toString()
    };
    res.json({ 
      success: true, 
      schedule: formattedSchedule,
      rewards: {
        ...rewardsResult,
        awardedPoints: totalAwardedPoints,
        rewards: combinedRewards
      }
    });
  } catch (error) {
    console.error('完成任务时发生错误:', error);
    console.error('错误堆栈:', error.stack);
    res.json({ success: false, message: error.message });
  }
});

// 取消完成日程
router.put('/:id/uncomplete', async (req, res) => {
  try {
    const { memberName } = req.body;
    console.log('uncomplete 路由被调用, id:', req.params.id, 'memberName:', memberName);
    
    const schedule = await findScheduleById(req.params.id);
    console.log('找到的 schedule:', schedule ? schedule.title : 'null');
    
    if (!schedule) {
      return res.json({ success: false, message: '日程不存在' });
    }
    
    // 从 completedBy 中移除该成员
    const index = schedule.completedBy.indexOf(memberName);
    if (index > -1) {
      schedule.completedBy.splice(index, 1);
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

module.exports = router;
