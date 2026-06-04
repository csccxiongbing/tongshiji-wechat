const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  nickname: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['parent', 'child', null],
    default: null,
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    default: null,
  },
  points: {
    type: Number,
    default: 0,
  },
  memberPoints: {
    type: Object,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
