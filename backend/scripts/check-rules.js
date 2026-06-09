const mongoose = require('mongoose');
const Rule = require('../models/Rule');

mongoose.connect('mongodb://localhost:27017/fasttime').then(async () => {
  const rules = await Rule.find().sort({ ruleType: 1, order: 1 });
  
  console.log('=== 规则列表 ===\n');
  
  const pointsRules = rules.filter(r => r.ruleType === 'points');
  const badgeRules = rules.filter(r => r.ruleType === 'badge');
  const levelRules = rules.filter(r => r.ruleType === 'level');
  
  console.log(`积分规则 (${pointsRules.length} 条):`);
  pointsRules.forEach(r => console.log(`  ${r.order}. ${r.ruleName}`));
  
  console.log(`\n徽章规则 (${badgeRules.length} 条):`);
  badgeRules.forEach(r => console.log(`  ${r.order}. ${r.ruleName}`));
  
  console.log(`\n等级规则 (${levelRules.length} 条):`);
  levelRules.forEach(r => console.log(`  ${r.order}. ${r.ruleName}`));
  
  console.log(`\n总计: ${rules.length} 条`);
  
  mongoose.disconnect();
});