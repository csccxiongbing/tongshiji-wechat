const mongoose = require('mongoose');
const User = require('../models/User');
const Family = require('../models/Family');

mongoose.connect('mongodb://localhost:27017/time');

async function checkDB() {
  try {
    console.log('=== Users ===');
    const users = await User.find();
    console.log('Total users:', users.length);
    users.forEach(function(user) {
      console.log('- ' + user.phone + ': ' + user.nickname);
      console.log('  role:', user.role);
      if (user.familyId) {
        console.log('  familyId:', user.familyId.toString());
      } else {
        console.log('  familyId: null');
      }
      console.log('  _id:', user._id.toString());
    });

    console.log('\n=== Families ===');
    const families = await Family.find();
    console.log('Total families:', families.length);
    families.forEach(function(family) {
      console.log('- ' + family.name + ', code: ' + family.inviteCode);
      console.log('  _id:', family._id.toString());
      console.log('  members:', family.members);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkDB();
