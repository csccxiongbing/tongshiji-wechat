const mongoose = require('mongoose');
const User = require('../models/User');
const Family = require('../models/Family');
const Schedule = require('../models/Schedule');
const Wish = require('../models/Wish');

const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const initData = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/time', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const existingFamily = await Family.findOne({ name: '测试家庭' });
    if (existingFamily) {
      console.log('数据已初始化，跳过');
      process.exit(0);
    }

    const family = new Family({
      name: '测试家庭',
      inviteCode: generateInviteCode(),
      members: [
        { name: '爸爸', role: 'parent', phone: '13800138001', isCurrentUser: false },
        { name: '妈妈', role: 'parent', phone: '13800138002', isCurrentUser: false },
        { name: '小明', role: 'child', phone: '13800138003', isCurrentUser: false },
      ],
    });

    await family.save();
    console.log('家庭数据已创建:', family.name);

    const parentUser = new User({
      phone: '13800138001',
      nickname: '爸爸',
      role: 'parent',
      familyId: family._id,
      points: 0,
      memberPoints: { '爸爸': 0, '妈妈': 0, '小明': 0 },
    });

    await parentUser.save();
    console.log('家长用户已创建:', parentUser.phone);

    const childUser = new User({
      phone: '13800138003',
      nickname: '小明',
      role: 'child',
      familyId: family._id,
      points: 0,
      memberPoints: { '小明': 0 },
    });

    await childUser.save();
    console.log('孩子用户已创建:', childUser.phone);

    const schedules = [
      {
        familyId: family._id,
        title: '早餐时间',
        time: '07:30',
        startTime: '2026-06-04 07:30',
        endTime: '2026-06-04 08:00',
        icon: '🍞',
        color: '#FFE4B5',
        completed: false,
        scheduleMembers: ['爸爸', '妈妈', '小明'],
        completedBy: [],
        points: 10,
        repeatRule: 'daily',
        repeatRuleText: '每天',
        remindEnabled: true,
        remindMembers: ['妈妈'],
        remindMembersText: '妈妈',
        note: '记得吃蔬菜哦！',
      },
      {
        familyId: family._id,
        title: '上学',
        time: '08:30',
        startTime: '2026-06-04 08:30',
        endTime: '2026-06-04 16:00',
        icon: '🎒',
        color: '#B5E3FF',
        completed: false,
        scheduleMembers: ['小明'],
        completedBy: [],
        points: 20,
        repeatRule: 'weekday',
        repeatRuleText: '工作日',
        remindEnabled: true,
        remindMembers: ['妈妈'],
        remindMembersText: '妈妈',
        note: '带好课本和作业',
      },
      {
        familyId: family._id,
        title: '午餐',
        time: '12:00',
        startTime: '2026-06-04 12:00',
        endTime: '2026-06-04 12:30',
        icon: '🍱',
        color: '#FFB5B5',
        completed: false,
        scheduleMembers: ['爸爸', '妈妈', '小明'],
        completedBy: [],
        points: 10,
        repeatRule: 'daily',
        repeatRuleText: '每天',
        remindEnabled: false,
        remindMembers: [],
        remindMembersText: '',
        note: '',
      },
      {
        familyId: family._id,
        title: '做作业',
        time: '15:30',
        startTime: '2026-06-04 15:30',
        endTime: '2026-06-04 17:00',
        icon: '📝',
        color: '#D4B5FF',
        completed: false,
        scheduleMembers: ['小明'],
        completedBy: [],
        points: 30,
        repeatRule: 'weekly',
        repeatRuleText: '每周',
        remindEnabled: true,
        remindMembers: ['爸爸', '妈妈'],
        remindMembersText: '爸妈',
        note: '数学和语文作业',
      },
      {
        familyId: family._id,
        title: '晚餐',
        time: '18:00',
        startTime: '2026-06-04 18:00',
        endTime: '2026-06-04 18:30',
        icon: '🍲',
        color: '#B5FFD9',
        completed: false,
        scheduleMembers: ['爸爸', '妈妈', '小明'],
        completedBy: [],
        points: 10,
        repeatRule: 'daily',
        repeatRuleText: '每天',
        remindEnabled: true,
        remindMembers: ['小明'],
        remindMembersText: '小明',
        note: '',
      },
      {
        familyId: family._id,
        title: '睡前故事',
        time: '20:30',
        startTime: '2026-06-04 20:30',
        endTime: '2026-06-04 21:00',
        icon: '📚',
        color: '#FFE4FF',
        completed: false,
        scheduleMembers: ['妈妈', '小明'],
        completedBy: [],
        points: 15,
        repeatRule: 'never',
        repeatRuleText: '',
        remindEnabled: true,
        remindMembers: ['妈妈'],
        remindMembersText: '妈妈',
        note: '今天讲白雪公主',
      },
    ];

    await Schedule.insertMany(schedules);
    console.log('日程数据已创建:', schedules.length, '条');

    const wishes = [
      {
        familyId: family._id,
        name: '看电影',
        icon: '🎬',
        points: 50,
        assignedTo: ['小明'],
        weeklyLimitEnabled: false,
        weeklyLimitCount: 0,
      },
      {
        familyId: family._id,
        name: '玩游戏1小时',
        icon: '🎮',
        points: 100,
        assignedTo: ['小明'],
        weeklyLimitEnabled: true,
        weeklyLimitCount: 3,
      },
      {
        familyId: family._id,
        name: '冰淇淋',
        icon: '🍦',
        points: 30,
        assignedTo: ['小明'],
        weeklyLimitEnabled: true,
        weeklyLimitCount: 2,
      },
      {
        familyId: family._id,
        name: '去游乐园',
        icon: '🎢',
        points: 300,
        assignedTo: ['小明'],
        weeklyLimitEnabled: false,
        weeklyLimitCount: 0,
      },
      {
        familyId: family._id,
        name: '买玩具',
        icon: '🎁',
        points: 200,
        assignedTo: ['小明'],
        weeklyLimitEnabled: false,
        weeklyLimitCount: 0,
      },
      {
        familyId: family._id,
        name: '吃大餐',
        icon: '🍔',
        points: 80,
        assignedTo: ['小明'],
        weeklyLimitEnabled: false,
        weeklyLimitCount: 0,
      },
    ];

    await Wish.insertMany(wishes);
    console.log('心愿数据已创建:', wishes.length, '条');

    console.log('数据初始化完成！');
    process.exit(0);

  } catch (error) {
    console.error('数据初始化失败:', error.message);
    process.exit(1);
  }
};

initData();
