const mongoose = require('mongoose');
const Rule = require('../models/Rule');

const restoreRules = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/fasttime');
    console.log('连接数据库成功');

    await Rule.deleteMany({});
    console.log('已清空现有规则');

    const rules = [
      // 积分规则
      {
        ruleType: 'points',
        ruleKey: 'daily_checkin',
        ruleName: '每日签到',
        description: '每日签到奖励',
        icon: '📅',
        points: 1,
        order: 1,
        conditions: { type: 'daily' },
        isActive: true
      },
      {
        ruleType: 'points',
        ruleKey: 'consecutive_checkin_3',
        ruleName: '连续签到3天',
        description: '连续签到3天额外奖励',
        icon: '🔥',
        points: 2,
        order: 2,
        conditions: { type: 'consecutive', days: 3 },
        isActive: true
      },
      {
        ruleType: 'points',
        ruleKey: 'consecutive_checkin_7',
        ruleName: '连续签到7天',
        description: '连续签到7天额外奖励',
        icon: '🌟',
        points: 5,
        order: 3,
        conditions: { type: 'consecutive', days: 7 },
        isActive: true
      },
      {
        ruleType: 'points',
        ruleKey: 'consecutive_checkin_15',
        ruleName: '连续签到15天',
        description: '连续签到15天额外奖励',
        icon: '⭐',
        points: 10,
        order: 4,
        conditions: { type: 'consecutive', days: 15 },
        isActive: true
      },
      {
        ruleType: 'points',
        ruleKey: 'consecutive_checkin_30',
        ruleName: '连续签到30天',
        description: '连续签到30天额外奖励',
        icon: '🏆',
        points: 20,
        order: 5,
        conditions: { type: 'consecutive', days: 30 },
        isActive: true
      },
      {
        ruleType: 'points',
        ruleKey: 'consecutive_checkin_60',
        ruleName: '连续签到60天',
        description: '连续签到60天额外奖励',
        icon: '🎯',
        points: 40,
        order: 6,
        conditions: { type: 'consecutive', days: 60 },
        isActive: true
      },
      {
        ruleType: 'points',
        ruleKey: 'consecutive_checkin_90',
        ruleName: '连续签到90天',
        description: '连续签到90天额外奖励',
        icon: '💪',
        points: 70,
        order: 7,
        conditions: { type: 'consecutive', days: 90 },
        isActive: true
      },
      {
        ruleType: 'points',
        ruleKey: 'consecutive_checkin_120',
        ruleName: '连续签到120天',
        description: '连续签到120天额外奖励',
        icon: '👑',
        points: 100,
        order: 8,
        conditions: { type: 'consecutive', days: 120 },
        isActive: true
      },
      {
        ruleType: 'points',
        ruleKey: 'complete_pomodoro',
        ruleName: '完成番茄钟',
        description: '完成一个番茄钟奖励',
        icon: '🍅',
        points: 2,
        order: 9,
        conditions: { type: 'pomodoro' },
        isActive: true
      },
      {
        ruleType: 'points',
        ruleKey: 'complete_task',
        ruleName: '完成任务',
        description: '完成一个任务奖励',
        icon: '✅',
        points: 0,
        order: 10,
        conditions: { type: 'task', variablePoints: true },
        isActive: true
      },
      // 徽章规则
      {
        ruleType: 'badge',
        ruleKey: 'badge_beginner',
        ruleName: '时间小萌新',
        description: '注册成功即可获得',
        icon: '⭐',
        order: 1,
        conditions: { type: 'register' },
        isActive: true
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_consecutive_3',
        ruleName: '连续3天',
        description: '连续签到3天',
        icon: '🔥',
        order: 2,
        conditions: { type: 'consecutive', days: 3 },
        isActive: true
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_consecutive_7',
        ruleName: '连续7天',
        description: '连续签到7天',
        icon: '🌟',
        order: 3,
        conditions: { type: 'consecutive', days: 7 },
        isActive: true
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_consecutive_15',
        ruleName: '连续15天',
        description: '连续签到15天',
        icon: '⭐',
        order: 4,
        conditions: { type: 'consecutive', days: 15 },
        isActive: true
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_reader',
        ruleName: '阅读达人',
        description: '累计获得100积分',
        icon: '📚',
        order: 5,
        conditions: { type: 'points', minPoints: 100 },
        isActive: true
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_efficient',
        ruleName: '效率之星',
        description: '累计获得200积分',
        icon: '⚡',
        order: 6,
        conditions: { type: 'points', minPoints: 200 },
        isActive: true
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_consecutive_30',
        ruleName: '连续30天',
        description: '连续签到30天',
        icon: '🏆',
        order: 7,
        conditions: { type: 'consecutive', days: 30 },
        isActive: true
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_master',
        ruleName: '时间大师',
        description: '累计获得500积分',
        icon: '⏰',
        order: 8,
        conditions: { type: 'points', minPoints: 500 },
        isActive: true
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_consecutive_60',
        ruleName: '坚持不懈',
        description: '连续签到60天',
        icon: '🎯',
        order: 9,
        conditions: { type: 'consecutive', days: 60 },
        isActive: true
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_consecutive_90',
        ruleName: '超级坚持',
        description: '连续签到90天',
        icon: '💪',
        order: 10,
        conditions: { type: 'consecutive', days: 90 },
        isActive: true
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_consecutive_120',
        ruleName: '时间传奇',
        description: '连续签到120天',
        icon: '👑',
        order: 11,
        conditions: { type: 'consecutive', days: 120 },
        isActive: true
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_super',
        ruleName: '超级学霸',
        description: '累计获得1000积分',
        icon: '🚀',
        order: 12,
        conditions: { type: 'points', minPoints: 1000 },
        isActive: true
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_pomodoro_master',
        ruleName: '番茄达人',
        description: '完成50个番茄钟',
        icon: '🍅',
        order: 13,
        conditions: { type: 'pomodoro_count', count: 50 },
        isActive: true
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_points_king',
        ruleName: '积分王者',
        description: '累计获得800积分',
        icon: '💎',
        order: 14,
        conditions: { type: 'points', minPoints: 800 },
        isActive: true
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_max_level',
        ruleName: '满级玩家',
        description: '达到10级',
        icon: '👑',
        order: 15,
        conditions: { type: 'level', level: 10 },
        isActive: true
      },
      // 等级规则
      {
        ruleType: 'level',
        ruleKey: 'level_1',
        ruleName: '时间小萌新',
        description: 'Lv.1',
        icon: '🌱',
        order: 1,
        conditions: { minPoints: 0, maxPoints: 99 },
        isActive: true
      },
      {
        ruleType: 'level',
        ruleKey: 'level_2',
        ruleName: '时间小达人',
        description: 'Lv.2',
        icon: '🌿',
        order: 2,
        conditions: { minPoints: 100, maxPoints: 199 },
        isActive: true
      },
      {
        ruleType: 'level',
        ruleKey: 'level_3',
        ruleName: '时间小标兵',
        description: 'Lv.3',
        icon: '🌳',
        order: 3,
        conditions: { minPoints: 200, maxPoints: 299 },
        isActive: true
      },
      {
        ruleType: 'level',
        ruleKey: 'level_4',
        ruleName: '时间管理师',
        description: 'Lv.4',
        icon: '🌲',
        order: 4,
        conditions: { minPoints: 300, maxPoints: 499 },
        isActive: true
      },
      {
        ruleType: 'level',
        ruleKey: 'level_5',
        ruleName: '时间大师',
        description: 'Lv.5',
        icon: '🌴',
        order: 5,
        conditions: { minPoints: 500, maxPoints: 799 },
        isActive: true
      },
      {
        ruleType: 'level',
        ruleKey: 'level_6',
        ruleName: '时间王者',
        description: 'Lv.6',
        icon: '🎋',
        order: 6,
        conditions: { minPoints: 800, maxPoints: 999 },
        isActive: true
      },
      {
        ruleType: 'level',
        ruleKey: 'level_7',
        ruleName: '时间传说',
        description: 'Lv.7',
        icon: '⭐',
        order: 7,
        conditions: { minPoints: 1000, maxPoints: 1499 },
        isActive: true
      },
      {
        ruleType: 'level',
        ruleKey: 'level_8',
        ruleName: '时间神话',
        description: 'Lv.8',
        icon: '✨',
        order: 8,
        conditions: { minPoints: 1500, maxPoints: 1999 },
        isActive: true
      },
      {
        ruleType: 'level',
        ruleKey: 'level_9',
        ruleName: '时间主宰',
        description: 'Lv.9',
        icon: '🌟',
        order: 9,
        conditions: { minPoints: 2000, maxPoints: 2999 },
        isActive: true
      },
      {
        ruleType: 'level',
        ruleKey: 'level_10',
        ruleName: '时间之神',
        description: 'Lv.10',
        icon: '🏆',
        order: 10,
        conditions: { minPoints: 3000, maxPoints: Infinity },
        isActive: true
      }
    ];

    await Rule.insertMany(rules);
    console.log(`已恢复规则: ${rules.length} 条`);
    console.log('  - 积分规则: 10 条');
    console.log('  - 徽章规则: 16 条');
    console.log('  - 等级规则: 9 条');

    mongoose.disconnect();
  } catch (error) {
    console.error('恢复规则失败:', error);
    process.exit(1);
  }
};

restoreRules();