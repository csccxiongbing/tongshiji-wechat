const mongoose = require('mongoose');
const User = require('../models/User');
const Family = require('../models/Family');
const Schedule = require('../models/Schedule');
const PointsHistory = require('../models/PointsHistory');
const PomodoroHistory = require('../models/PomodoroHistory');

async function clearDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/time', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Clearing database...');
    
    await User.deleteMany({});
    console.log('✓ Users cleared');
    
    await Family.deleteMany({});
    console.log('✓ Families cleared');
    
    await Schedule.deleteMany({});
    console.log('✓ Schedules cleared');
    
    await PointsHistory.deleteMany({});
    console.log('✓ PointsHistory cleared');
    
    await PomodoroHistory.deleteMany({});
    console.log('✓ PomodoroHistory cleared');
    
    console.log('\nDatabase cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearDB();
