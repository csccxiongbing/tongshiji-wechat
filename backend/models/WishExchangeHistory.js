const mongoose = require('mongoose');

const wishExchangeHistorySchema = new mongoose.Schema({
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
  wishId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wish',
    required: true,
  },
  wishName: {
    type: String,
    required: true,
  },
  memberName: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  exchangeTime: {
    type: Date,
    default: Date.now,
  },
  weekNumber: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('WishExchangeHistory', wishExchangeHistorySchema);
