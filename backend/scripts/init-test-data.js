const mongoose = require('mongoose');
const User = require('../models/User');
const Family = require('../models/Family');
const Schedule = require('../models/Schedule');
const Rule = require('../models/Rule');

mongoose.connect('mongodb://localhost:27017/fasttime')
  .then(async () => {
    console.log('连接数据库成功');
    
    // 清空现有数据
    await User.deleteMany({});
    await Family.deleteMany({});
    await Schedule.deleteMany({});
    await Rule.deleteMany({});
    console.log('清空现有数据');
    
    // 1. 创建用户
    const user = new User({
      phone: '13800138000',
      nickname: '测试用户'
    });
    await user.save();
    console.log('创建用户:', user._id);
    
    // 2. 创建积分规则
    const rules = [
      {
        ruleName: '完成任务',
        ruleKey: 'complete_task',
        ruleType: 'points',
        conditions: { type: 'task' },
        points: 5,
        icon: '✅',
        isActive: true,
        order: 1
      },
      {
        ruleName: '番茄钟',
        ruleKey: 'pomodoro',
        ruleType: 'points',
        conditions: { type: 'pomodoro' },
        points: 10,
        icon: '🍅',
        isActive: true,
        order: 2
      },
      {
        ruleName: '每日打卡',
        ruleKey: 'daily_checkin',
        ruleType: 'points',
        conditions: { type: 'daily' },
        points: 3,
        icon: '📅',
        isActive: true,
        order: 3
      },
      {
        ruleName: '连续打卡 3 天',
        ruleKey: 'consecutive_3',
        ruleType: 'points',
        conditions: { type: 'consecutive', days: 3 },
        points: 10,
        icon: '🔥',
        isActive: true,
        order: 4
      }
    ];
    
    await Rule.insertMany(rules);
    console.log('创建积分规则:', rules.length, '条');
    
    // 3. 创建家庭
    const family = new Family({
      name: '测试家庭',
      inviteCode: 'TEST123',
      members: [
        { name: '朵朵', role: 'child', points: 0, avatar: '' },
        { name: '爸爸', role: 'parent', points: 0, avatar: '' },
        { name: '妈妈', role: 'parent', points: 0, avatar: '' }
      ],
      totalPoints: 0
    });
    await family.save();
    console.log('创建家庭:', family._id);
    
    // 4. 更新用户，关联家庭
    user.familyId = family._id;
    await user.save();
    
    // 5. 创建任务
    const schedules = [
      {
        familyId: family._id,
        title: '阅读 30 分钟',
        description: '每天阅读课外书',
        scheduleMembers: ['朵朵'],
        completedBy: [],
        completed: false,
        repeat: 'daily'
      },
      {
        familyId: family._id,
        title: '完成数学作业',
        description: '今天的数学练习',
        scheduleMembers: ['朵朵'],
        completedBy: [],
        completed: false,
        repeat: 'none'
      },
      {
        familyId: family._id,
        title: '整理房间',
        description: '保持房间整洁',
        scheduleMembers: ['爸爸', '妈妈', '朵朵'],
        completedBy: [],
        completed: false,
        repeat: 'weekly'
      }
    ];
    
    const createdSchedules = await Schedule.insertMany(schedules);
    console.log('创建任务:', createdSchedules.length, '个');
    
    console.log('\n========== 测试数据创建成功 ==========');
    console.log('用户 ID:', user._id);
    console.log('用户手机号:', user.phone);
    console.log('家庭 ID:', family._id);
    console.log('邀请码:', family.inviteCode);
    console.log('任务 ID:');
    createdSchedules.forEach(s => console.log(`  - ${s._id}: ${s.title}`));
    console.log('\n现在可以用手机号 13800138000 登录测试');
    
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('错误:', error);
    process.exit(1);
  });