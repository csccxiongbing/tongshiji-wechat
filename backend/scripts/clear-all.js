const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/fasttime')
  .then(async () => {
    console.log('连接数据库成功');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const col of collections) {
      await mongoose.connection.db.collection(col.name).deleteMany({});
      console.log(`已清空: ${col.name}`);
    }
    
    console.log('\n数据库已完全清空');
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('错误:', error);
    process.exit(1);
  });