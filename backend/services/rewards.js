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

    // 1. 检查是否已经有相同的打卡记录（防止重复提交）
    let checkInRecord = await CheckIn.findOne({
      familyId,
      userId,
      date: today,
      checkInType: checkInType,
      referenceId: referenceId
    });

    if (checkInRecord) {
      // 这条记录已经打过卡了
      return {
        success: true,
        alreadyCheckedIn: true,
        checkInType: checkInType,
        awardedPoints: 0,
        rewards: []
      };
    }

    // 2. 检查今天是否已经打过卡（用于判断是否给每日打卡奖励）
    const hasDailyCheckedInToday = await CheckIn.findOne({
      familyId,
      userId,
      date: today
    });

    // 3. 获取积分规则
    const pointsRules = await Rule.find({
      ruleType: 'points',
      isActive: true
    }).sort({ order: 1 });
    
    console.log('=== 积分规则 ===');
    console.log('打卡类型:', checkInType);
    console.log('规则数量:', pointsRules.length);
    
    // 详细打印每个规则
    pointsRules.forEach((rule, index) => {
      const conditions = rule.conditions;
      console.log(`规则${index + 1}: ${rule.ruleName}`);
      console.log(`  conditions类型: ${typeof conditions}`);
      console.log(`  conditions内容:`, JSON.stringify(conditions));
      if (typeof conditions === 'object') {
        console.log(`  conditions.type:`, conditions?.type);
      }
    });

    // 4. 根据打卡类型计算对应的奖励
    let taskRule = null;
    let pomodoroRule = null;
    
    for (const rule of pointsRules) {
      if (rule.conditions?.type === 'pomodoro') {
        pomodoroRule = rule;
        console.log('找到番茄钟规则:', rule.ruleName, '积分:', rule.points);
      } else if (rule.conditions?.type === 'task') {
        taskRule = rule;
        console.log('找到任务规则:', rule.ruleName, '积分:', rule.points);
      }
    }
    
    if (checkInType === 'pomodoro') {
      if (pomodoroRule && pomodoroRule.points > 0) {
        awardedPoints += pomodoroRule.points;
        rewards.push({
          ruleKey: pomodoroRule.ruleKey,
          ruleName: pomodoroRule.ruleName,
          icon: pomodoroRule.icon,
          points: pomodoroRule.points
        });
        console.log('添加番茄钟积分:', pomodoroRule.points);
      }
    } else if (checkInType === 'task') {
      if (taskRule && taskRule.points > 0) {
        awardedPoints += taskRule.points;
        rewards.push({
          ruleKey: taskRule.ruleKey,
          ruleName: taskRule.ruleName,
          icon: taskRule.icon,
          points: taskRule.points
        });
        console.log('添加任务积分:', taskRule.points);
      }
    }

    // 5. 计算每日打卡奖励（只有今天第一次打卡才给）
    const dailyRule = pointsRules.find(r => r.conditions?.type === 'daily');
    if (!hasDailyCheckedInToday && dailyRule && dailyRule.points > 0) {
      awardedPoints += dailyRule.points;
      rewards.push({
        ruleKey: dailyRule.ruleKey,
        ruleName: dailyRule.ruleName,
        icon: dailyRule.icon,
        points: dailyRule.points
      });
    }

    // 6. 创建新的打卡记录（放在每日打卡奖励检查之后）
    checkInRecord = new CheckIn({
      familyId,
      userId,
      memberName,
      date: today,
      checkInType,
      referenceId
    });
    await checkInRecord.save();

    // 7. 计算连续打卡奖励（基于总打卡天数，而不是按类型）
    const { consecutiveDays, maxDays } = await calculateCheckInStats(familyId, userId);
    const consecutiveRules = pointsRules
      .filter(r => r.conditions?.type === 'consecutive')
      .sort((a, b) => (a.conditions?.days || 0) - (b.conditions?.days || 0));

    let lastEligibleConsecutiveRule = null;
    for (const rule of consecutiveRules) {
      const requiredDays = rule.conditions?.days || 0;
      if (consecutiveDays >= requiredDays && rule.points > 0) {
        lastEligibleConsecutiveRule = rule;
      }
    }

    if (lastEligibleConsecutiveRule) {
      awardedPoints += lastEligibleConsecutiveRule.points;
      rewards.push({
        ruleKey: lastEligibleConsecutiveRule.ruleKey,
        ruleName: lastEligibleConsecutiveRule.ruleName,
        icon: lastEligibleConsecutiveRule.icon,
        points: lastEligibleConsecutiveRule.points
      });
    }

    // 8. 更新积分和打卡统计
    if (awardedPoints > 0) {
      await updateMemberPoints(familyId, memberName, userId, awardedPoints, rewards, consecutiveDays, maxDays);
      console.log('更新积分成功:', awardedPoints, 'rewards:', rewards);
    } else {
      // 即使没有积分奖励，也要更新打卡统计
      await updateMemberCheckInStats(familyId, memberName, consecutiveDays, maxDays);
      console.log('无积分奖励，仅更新打卡统计');
    }

    console.log('=== 返回结果 ===');
    console.log('consecutiveDays:', consecutiveDays);
    console.log('maxDays:', maxDays);
    console.log('awardedPoints:', awardedPoints);
    console.log('rewards:', rewards);

    return {
      success: true,
      alreadyCheckedIn: false,
      checkInType: checkInType,
      consecutiveDays,
      maxDays,
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

    // 更新积分
    family.members[memberIndex].points = (family.members[memberIndex].points || 0) + taskPoints;
    family.totalPoints = family.members.reduce((sum, m) => sum + (m.points || 0), 0);
    await family.save();

    // 记录积分历史
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
        // 第一次打卡
        currentStreak = 1;
        maxDays = 1;
      } else {
        const dateDiff = (checkInDate - previousDate) / (1000 * 60 * 60 * 24);
        
        if (dateDiff === 1) {
          // 连续打卡
          currentStreak++;
          if (currentStreak > maxDays) {
            maxDays = currentStreak;
          }
        } else if (dateDiff > 1) {
          // 不连续，重置
          currentStreak = 1;
        }
        // dateDiff === 0 同一天打卡，忽略（不同类型的打卡同一天只算一天）
      }

      previousDate = checkInDate;
    }

    // 计算当前连续打卡天数（从今天往前数）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    consecutiveDays = 0;
    let expectedDate = new Date(today);

    // 从后往前遍历计算当前连续天数
    const sortedCheckIns = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const checkIn of sortedCheckIns) {
      const checkInDate = new Date(checkIn.date);
      checkInDate.setHours(0, 0, 0, 0);

      const dateDiff = (expectedDate - checkInDate) / (1000 * 60 * 60 * 24);

      if (dateDiff === 0) {
        // 今天打卡
        consecutiveDays++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (dateDiff === 1) {
        // 昨天打卡
        consecutiveDays++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        // 不连续
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

/**
 * 仅更新成员打卡统计（不更新积分）
 * @param {string} familyId - 家庭ID
 * @param {string} memberName - 成员姓名
 * @param {number} consecutiveDays - 当前连续打卡天数
 * @param {number} maxDays - 历史最长连续打卡天数
 */
async function updateMemberCheckInStats(familyId, memberName, consecutiveDays, maxDays) {
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

  family.members[memberIndex].consecutiveCheckInDays = consecutiveDays;
  family.members[memberIndex].lastCheckInDate = today;
  if (maxDays > (family.members[memberIndex].maxCheckInDays || 0)) {
    family.members[memberIndex].maxCheckInDays = maxDays;
  }
  await family.save();
}

module.exports = {
  processCheckInAndRewards,
  calculateCheckInStats,
  addTaskPoints
};
