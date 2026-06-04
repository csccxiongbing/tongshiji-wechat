const mongoose = require('mongoose');
const User = require('../models/User');
const Family = require('../models/Family');

async function checkUser(phone) {
  try {
    await mongoose.connect('mongodb://localhost:27017/time', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`=== 查找用户: ${phone} ===`);
    const user = await User.findOne({ phone });
    
    if (user) {
      console.log('找到用户:');
      console.log(`  _id: ${user._id}`);
      console.log(`  phone: ${user.phone}`);
      console.log(`  nickname: ${user.nickname}`);
      console.log(`  role: ${user.role}`);
      console.log(`  familyId: ${user.familyId || 'null'}`);
      console.log(`  points: ${user.points}`);
      console.log(`  memberPoints:`, user.memberPoints);
      
      if (user.familyId) {
        const family = await Family.findById(user.familyId);
        if (family) {
          console.log('  family:');
          console.log(`    name: ${family.name}`);
          console.log(`    inviteCode: ${family.inviteCode}`);
          console.log(`    members:`, family.members.map(m => m.name));
        }
      }
    } else {
      console.log('用户不存在');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

const phone = process.argv[2] || '15507590321';
checkUser(phone);
