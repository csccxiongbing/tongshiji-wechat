const mongoose = require('mongoose');
const User = require('../models/User');
const Family = require('../models/Family');

async function checkDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/time', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('=== Users ===');
    const users = await User.find({});
    console.log(`Total users: ${users.length}`);
    users.forEach(user => {
      console.log(`- ${user.phone}: ${user.nickname}, role: ${user.role}`);
    });
    
    console.log('\n=== Families ===');
    const families = await Family.find({});
    console.log(`Total families: ${families.length}`);
    families.forEach(family => {
      console.log(`- ${family.name}, code: ${family.inviteCode}`);
      family.members.forEach(member => {
        console.log(`  • ${member.name} (${member.role})`);
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDB();
