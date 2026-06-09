const mongoose = require('mongoose');
const CheckIn = require('../models/CheckIn');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/time', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('已连接到数据库');

  // 删除旧索引
  console.log('删除旧索引 familyId_1_userId_1_date_1...');
  try {
    await CheckIn.collection.dropIndex('familyId_1_userId_1_date_1');
    console.log('旧索引删除成功');
  } catch (error) {
    console.log('旧索引不存在或已被删除:', error.message);
  }

  // 删除所有打卡记录（清空测试数据）
  console.log('清空打卡记录...');
  await CheckIn.deleteMany({});
  console.log('打卡记录已清空');

  // 重新创建索引
  console.log('创建新索引...');
  await CheckIn.collection.createIndex(
    { familyId: 1, userId: 1, date: 1, checkInType: 1, referenceId: 1 },
    { unique: true }
  );
  console.log('新索引创建成功');

  console.log('修复完成！');
  process.exit(0);
}).catch(err => {
  console.error('数据库连接错误:', err);
  process.exit(1);
});
