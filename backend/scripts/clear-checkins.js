const mongoose = require('mongoose');
const CheckIn = require('../models/CheckIn');

mongoose.connect('mongodb://localhost:27017/time', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('已连接到数据库');
  
  // 清空打卡记录
  await CheckIn.deleteMany({});
  console.log('打卡记录已清空');
  
  process.exit(0);
}).catch(err => {
  console.error('数据库连接错误:', err);
  process.exit(1);
});
