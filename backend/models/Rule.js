const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  ruleType: {
    type: String,
    enum: ['points', 'badge', 'level'],
    required: true,
    index: true
  },
  ruleKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ruleName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  points: {
    type: Number,
    default: 0
  },
  conditions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ruleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

ruleSchema.index({ ruleType: 1, isActive: 1 });
ruleSchema.index({ ruleType: 1, order: 1 });

module.exports = mongoose.model('Rule', ruleSchema);
