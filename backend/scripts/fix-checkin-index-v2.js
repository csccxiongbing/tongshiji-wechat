const mongoose = require('mongoose');
const CheckIn = require('../models/CheckIn');

mongoose.connect('mongodb://localhost:27017/time', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('已连接到数据库');

  // 删除旧索引
  console.log('删除旧索引...');
  const indexes = await CheckIn.collection.indexes();
  for (const index of indexes) {
    if (index.name !== '_id_') {
      try {
        await CheckIn.collection.dropIndex(index.name);
        console.log('删除索引:', index.name);
      } catch (error) {
        console.log('索引不存在或已被删除:', index.name);
      }
    }
  }

  // 创建新索引（只包含 familyId, userId, date, checkInType）
  console.log('创建新索引...');
  await CheckIn.collection.createIndex(
    { familyId: 1, userId: 1, date: 1, checkInType: 1 },
    { unique: true }
  );
  console.log('新索引创建成功');

  console.log('修复完成！');
  process.exit(0);
}).catch(err => {
  console.error('数据库连接错误:', err);
  process.exit(1);
});
