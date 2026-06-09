const mongoose = require('mongoose');

const pomodoroHistorySchema = new mongoose.Schema({
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
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    default: null,
  },
  taskName: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    default: 25,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'pomodoro',
  },
  points: {
    type: Number,
    default: 0,
  },
  memberName: {
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PomodoroHistory', pomodoroHistorySchema);
