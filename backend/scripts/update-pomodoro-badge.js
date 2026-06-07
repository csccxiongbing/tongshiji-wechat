const mongoose = require('mongoose');
const Rule = require('../models/Rule');

async function updatePomodoroBadge() {
  try {
    await mongoose.connect('mongodb://localhost:27017/time');

    console.log('已连接到数据库');

    // 更新番茄达人的条件
    const result = await Rule.updateOne(
      { ruleKey: 'badge_pomodoro_master' },
      { 
        description: '完成50个番茄钟',
        conditions: { type: 'pomodoro_count', count: 50 }
      }
    );

    if (result.modifiedCount > 0) {
      console.log('番茄达人徽章已更新为50个番茄钟');
    } else {
      console.log('未找到番茄达人徽章或未做任何修改');
    }

    await mongoose.connection.close();
    console.log('数据库连接已关闭');
    process.exit(0);
  } catch (error) {
    console.error('更新错误:', error);
    process.exit(1);
  }
}

updatePomodoroBadge();
