const CheckIn = require('../models/CheckIn');
const Rule = require('../models/Rule');
const Family = require('../models/Family');
const PointsHistory = require('../models/PointsHistory');

/**
 * 处理打卡并发放奖励
 * @param {Object} params - 参数
 * @param {string} params.familyId - 家庭ID
 * @param {string} params.userId - 用户ID
 * @param {string} params.memberName - 成员姓名
 * @param {string} params.checkInType - 打卡类型 (task/pomodoro)
 * @param {string} params.referenceId - 关联ID
 * @returns {Promise<Object>} 奖励结果
 */
async function processCheckInAndRewards({ familyId, userId, memberName, checkInType, referenceId }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    let awardedPoints = 0;
    let rewards = [];
    
    console.log('=== 开始处理打卡奖励 ===');
    console.log('familyId:', familyId);
    console.log('userId:', userId);
    console.log('memberName:', memberName);
    console.log('checkInType:', checkInType);
    console.log('referenceId:', referenceId);

    // 1. 获取所有积分规则
    const pointsRules = await Rule.find({
      ruleType: 'points',
      isActive: true
    }).sort({ order: 1 });
    
    console.log('=== 积分规则 ===');
    console.log('规则数量:', pointsRules.length);
    
    // 2. 查找各类规则
    let taskRule = null;
    let pomodoroRule = null;
    let dailyRule = null;
    let consecutiveRules = [];
    
    for (const rule of pointsRules) {
      const ruleType = rule.conditions?.type;
      if (ruleType === 'pomodoro') {
        pomodoroRule = rule;
      } else if (ruleType === 'task') {
        taskRule = rule;
      } else if (ruleType === 'daily') {
        dailyRule = rule;
      } else if (ruleType === 'consecutive') {
        consecutiveRules.push(rule);
      }
    }
    consecutiveRules.sort((a, b) => (a.conditions?.days || 0) - (b.conditions?.days || 0));

    // 3. 添加对应类型的积分（每次完成都给）
    console.log('=== 添加基础积分（每次完成都给）===');
    let basePoints = 0;
    let baseRewards = [];
    
    if (checkInType === 'pomodoro') {
      console.log('处理番茄钟打卡');
      if (pomodoroRule && pomodoroRule.points > 0) {
        basePoints += pomodoroRule.points;
        baseRewards.push({
          ruleKey: pomodoroRule.ruleKey,
          ruleName: pomodoroRule.ruleName,
          icon: pomodoroRule.icon,
          points: pomodoroRule.points
        });
        console.log('添加番茄钟积分:', pomodoroRule.points);
      }
    } else if (checkInType === 'task') {
      console.log('处理任务打卡');
      if (taskRule && taskRule.points > 0) {
        basePoints += taskRule.points;
        baseRewards.push({
          ruleKey: taskRule.ruleKey,
          ruleName: taskRule.ruleName,
          icon: taskRule.icon,
          points: taskRule.points
        });
        console.log('添加任务基础积分:', taskRule.points);
      }
    }

    // 4. 检查今天是否已经打过卡（用于判断每日打卡和连续打卡奖励）
    const hasDailyCheckedInToday = await CheckIn.findOne({
      familyId,
      userId,
      date: today
    });
    console.log('今天是否已打卡:', !!hasDailyCheckedInToday);

    // 5. 如果今天还没打过卡，添加每日打卡奖励和连续打卡奖励
    let checkInRewards = [];
    let checkInPoints = 0;
    
    if (!hasDailyCheckedInToday) {
      // 添加每日打卡奖励
      if (dailyRule && dailyRule.points > 0) {
        checkInPoints += dailyRule.points;
        checkInRewards.push({
          ruleKey: dailyRule.ruleKey,
          ruleName: dailyRule.ruleName,
          icon: dailyRule.icon,
          points: dailyRule.points
        });
        console.log('添加每日打卡积分:', dailyRule.points);
      }

      // 计算连续打卡天数并添加奖励
      const { consecutiveDays, maxDays } = await calculateCheckInStats(familyId, userId);
      console.log('连续打卡天数:', consecutiveDays);
      
      let lastEligibleConsecutiveRule = null;
      for (const rule of consecutiveRules) {
        const requiredDays = rule.conditions?.days || 0;
        if (consecutiveDays >= requiredDays && rule.points > 0) {
          lastEligibleConsecutiveRule = rule;
        }
      }

      if (lastEligibleConsecutiveRule) {
        checkInPoints += lastEligibleConsecutiveRule.points;
        checkInRewards.push({
          ruleKey: lastEligibleConsecutiveRule.ruleKey,
          ruleName: lastEligibleConsecutiveRule.ruleName,
          icon: lastEligibleConsecutiveRule.icon,
          points: lastEligibleConsecutiveRule.points
        });
        console.log('添加连续打卡积分:', lastEligibleConsecutiveRule.points);
      }

      // 创建打卡记录（只有第一次打卡时创建）
      const checkInRecord = new CheckIn({
        familyId,
        userId,
        memberName,
        date: today,
        checkInType: 'daily',
        referenceId: referenceId
      });
      await checkInRecord.save();
      console.log('打卡记录已创建');
    } else {
      console.log('今天已经打过卡，跳过每日打卡和连续打卡奖励');
    }

    // 6. 合并所有奖励
    awardedPoints = basePoints + checkInPoints;
    rewards = [...baseRewards, ...checkInRewards];

    // 7. 更新积分
    console.log('=== 更新积分 ===');
    console.log('总积分:', awardedPoints);
    console.log('rewards:', JSON.stringify(rewards));
    
    if (awardedPoints > 0) {
      const { consecutiveDays, maxDays } = await calculateCheckInStats(familyId, userId);
      await updateMemberPoints(familyId, memberName, userId, awardedPoints, rewards, consecutiveDays, maxDays);
      console.log('积分已更新');
    }

    console.log('=== 返回结果 ===');
    console.log('awardedPoints:', awardedPoints);
    console.log('rewards:', rewards);

    return {
      success: true,
      alreadyCheckedIn: !!hasDailyCheckedInToday,
      checkInType: checkInType,
      awardedPoints,
      rewards
    };

  } catch (error) {
    console.error('处理打卡奖励错误:', error);
    console.error('错误堆栈:', error.stack);
    throw error;
  }
}

/**
 * 专门添加任务积分的函数
 * @param {Object} params - 参数
 * @param {string} params.familyId - 家庭ID
 * @param {string} params.userId - 用户ID
 * @param {string} params.memberName - 成员姓名
 * @param {number} params.taskPoints - 任务积分
 * @param {string} params.taskTitle - 任务标题
 * @returns {Promise<Object>} 结果
 */
async function addTaskPoints({ familyId, userId, memberName, taskPoints, taskTitle }) {
  try {
    console.log('=== 添加任务积分 ===');
    console.log('familyId:', familyId);
    console.log('userId:', userId);
    console.log('memberName:', memberName);
    console.log('taskPoints:', taskPoints);
    console.log('taskTitle:', taskTitle);

    if (!taskPoints || taskPoints <= 0) {
      console.log('任务积分无效，跳过');
      return { success: true, awardedPoints: 0 };
    }

    const family = await Family.findById(familyId);
    if (!family) {
      throw new Error('家庭不存在');
    }

    const memberIndex = family.members.findIndex(m => m.name === memberName);
    if (memberIndex === -1) {
      throw new Error('成员不存在');
    }

    family.members[memberIndex].points = (family.members[memberIndex].points || 0) + taskPoints;
    family.totalPoints = family.members.reduce((sum, m) => sum + (m.points || 0), 0);
    await family.save();

    const reason = `完成任务：${taskTitle}`;
    const history = new PointsHistory({
      familyId,
      userId,
      memberName,
      amount: taskPoints,
      reason,
      time: new Date().toLocaleString(),
      balance: family.members[memberIndex].points,
    });
    await history.save();

    console.log('任务积分添加成功:', taskPoints);
    return { success: true, awardedPoints: taskPoints };

  } catch (error) {
    console.error('添加任务积分错误:', error);
    console.error('错误堆栈:', error.stack);
    throw error;
  }
}

/**
 * 计算连续打卡天数和最长连续打卡天数
 * @param {string} familyId - 家庭ID
 * @param {string} userId - 用户ID
 * @returns {Promise<{consecutiveDays: number, maxDays: number}>} 连续打卡天数和最长连续打卡天数
 */
async function calculateCheckInStats(familyId, userId) {
  try {
    const checkIns = await CheckIn.find({
      familyId,
      userId
    }).sort({ date: 1 });

    if (checkIns.length === 0) {
      return { consecutiveDays: 0, maxDays: 0 };
    }

    let consecutiveDays = 0;
    let maxDays = 0;
    let currentStreak = 0;
    let previousDate = null;

    for (const checkIn of checkIns) {
      const checkInDate = new Date(checkIn.date);
      checkInDate.setHours(0, 0, 0, 0);

      if (previousDate === null) {
        currentStreak = 1;
        maxDays = 1;
      } else {
        const dateDiff = (checkInDate - previousDate) / (1000 * 60 * 60 * 24);
        
        if (dateDiff === 1) {
          currentStreak++;
          if (currentStreak > maxDays) {
            maxDays = currentStreak;
          }
        } else if (dateDiff > 1) {
          currentStreak = 1;
        }
      }

      previousDate = checkInDate;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    consecutiveDays = 0;
    let expectedDate = new Date(today);

    const sortedCheckIns = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const checkIn of sortedCheckIns) {
      const checkInDate = new Date(checkIn.date);
      checkInDate.setHours(0, 0, 0, 0);

      const dateDiff = (expectedDate - checkInDate) / (1000 * 60 * 60 * 24);

      if (dateDiff === 0 || dateDiff === 1) {
        consecutiveDays++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { consecutiveDays, maxDays };
  } catch (error) {
    console.error('计算打卡统计错误:', error);
    return { consecutiveDays: 0, maxDays: 0 };
  }
}

/**
 * 更新成员积分和打卡统计
 * @param {string} familyId - 家庭ID
 * @param {string} memberName - 成员姓名
 * @param {string} userId - 用户ID
 * @param {number} amount - 积分数量
 * @param {Array} rewards - 奖励详情
 * @param {number} consecutiveDays - 当前连续打卡天数
 * @param {number} maxDays - 历史最长连续打卡天数
 */
async function updateMemberPoints(familyId, memberName, userId, amount, rewards, consecutiveDays, maxDays) {
  const family = await Family.findById(familyId);
  if (!family) {
    throw new Error('家庭不存在');
  }

  const memberIndex = family.members.findIndex(m => m.name === memberName);
  if (memberIndex === -1) {
    throw new Error('成员不存在');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  family.members[memberIndex].points = (family.members[memberIndex].points || 0) + amount;
  family.members[memberIndex].consecutiveCheckInDays = consecutiveDays;
  family.members[memberIndex].lastCheckInDate = today;
  if (maxDays > (family.members[memberIndex].maxCheckInDays || 0)) {
    family.members[memberIndex].maxCheckInDays = maxDays;
  }
  family.totalPoints = family.members.reduce((sum, m) => sum + (m.points || 0), 0);
  await family.save();

  const reason = rewards.map(r => `${r.ruleName} +${r.points}分`).join(', ');
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
}

module.exports = {
  processCheckInAndRewards,
  calculateCheckInStats,
  addTaskPoints
};
