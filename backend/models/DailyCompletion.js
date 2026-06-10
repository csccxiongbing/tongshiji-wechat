const mongoose = require('mongoose');

const completionSchema = new mongoose.Schema({
  memberName: {
    type: String,
    required: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  pointsEarned: {
    type: Number,
    default: 0,
  },
  pointsDeducted: {
    type: Boolean,
    default: false,
  },
});

const dailyCompletionSchema = new mongoose.Schema({
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  completions: {
    type: [completionSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

dailyCompletionSchema.index({ scheduleId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyCompletion', dailyCompletionSchema);