const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    default: '',
  },
  startTime: {
    type: String,
    default: '',
  },
  endTime: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '📋',
  },
  color: {
    type: String,
    default: '#FFFFFF',
  },
  completed: {
    type: Boolean,
    default: false,
  },
  scheduleMembers: {
    type: [String],
    default: [],
  },
  completedBy: {
    type: [String],
    default: [],
  },
  points: {
    type: Number,
    default: 0,
  },
  repeatRule: {
    type: String,
    enum: ['daily', 'weekday', 'weekly', 'monthly', 'never'],
    default: 'never',
  },
  repeatDays: {
    type: [Number],
    default: [],
  },
  repeatRuleText: {
    type: String,
    default: '',
  },
  startDate: {
    type: String,
    default: '',
  },
  endRepeat: {
    type: String,
    enum: ['never', 'date'],
    default: 'never',
  },
  endRepeatDate: {
    type: String,
    default: '',
  },
  remindEnabled: {
    type: Boolean,
    default: false,
  },
  remindMembers: {
    type: [String],
    default: [],
  },
  remindMembersText: {
    type: String,
    default: '',
  },
  remindTime: {
    type: Number,
    default: 0,
  },
  note: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Schedule', scheduleSchema);
