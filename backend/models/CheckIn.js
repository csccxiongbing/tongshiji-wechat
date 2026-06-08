const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  memberName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  checkInType: {
    type: String,
    enum: ['task', 'pomodoro'],
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 唯一索引：确保同一用户、同一天、同一类型、同一referenceId只能有一条记录
checkInSchema.index({ familyId: 1, userId: 1, date: 1, checkInType: 1, referenceId: 1 }, { unique: true });

module.exports = mongoose.model('CheckIn', checkInSchema);
