const mongoose = require('mongoose');

const wishSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    required: true,
    default: 0,
  },
  weeklyLimitEnabled: {
    type: Boolean,
    default: false,
  },
  weeklyLimitCount: {
    type: Number,
    default: 0,
  },
  assignedTo: {
    type: [String],
    default: [],
  },
  icon: {
    type: String,
    default: '🎁',
  },
  background: {
    type: String,
    default: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Wish', wishSchema);
