const mongoose = require('mongoose');

const pointsHistorySchema = new mongoose.Schema({
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
    default: '',
  },
  amount: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    default: '',
  },
  balance: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PointsHistory', pointsHistorySchema);
