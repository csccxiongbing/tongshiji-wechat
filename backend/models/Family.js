const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['parent', 'child'],
    required: true,
  },
  phone: {
    type: String,
    default: '',
  },
  isCurrentUser: {
    type: Boolean,
    default: false,
  },
  points: {
    type: Number,
    default: 0,
  },
  consecutiveCheckInDays: {
    type: Number,
    default: 0,
  },
  maxCheckInDays: {
    type: Number,
    default: 0,
  },
  lastCheckInDate: {
    type: Date,
  },
});

const familySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
  },
  members: [memberSchema],
  totalPoints: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Family', familySchema);
