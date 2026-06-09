const mongoose = require('mongoose');
const CheckIn = require('../models/CheckIn');

mongoose.connect('mongodb://localhost:27017/time', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('已连接到数据库');

  // 获取所有索引
  const indexes = await CheckIn.collection.indexes();
  console.log('当前索引:', indexes.map(i => i.name));

  // 删除所有索引（除了 _id）
  for (const index of indexes) {
    if (index.name !== '_id_') {
      try {
        await CheckIn.collection.dropIndex(index.name);
        console.log('删除索引:', index.name);
      } catch (error) {
        console.log('索引删除失败:', index.name, error.message);
      }
    }
  }

  // 清空打卡记录
  await CheckIn.deleteMany({});
  console.log('打卡记录已清空');

  // 创建新索引
  await CheckIn.collection.createIndex({ familyId: 1, userId: 1, date: 1 }, { unique: true });
  console.log('新索引创建成功');

  console.log('索引更新完成！');
  process.exit(0);
}).catch(err => {
  console.error('数据库连接错误:', err);
  process.exit(1);
});
