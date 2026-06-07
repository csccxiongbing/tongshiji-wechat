const express = require('express');
const router = express.Router();
const Rule = require('../models/Rule');

router.get('/family', async (req, res) => {
  try {
    const query = { isActive: true };
    
    const rules = await Rule.find(query).sort({ ruleType: 1, order: 1 });
    
    const groupedRules = {
      points: rules.filter(r => r.ruleType === 'points'),
      badge: rules.filter(r => r.ruleType === 'badge'),
      level: rules.filter(r => r.ruleType === 'level')
    };
    
    res.json({
      success: true,
      rules: groupedRules
    });
  } catch (error) {
    console.error('获取规则失败:', error);
    res.status(500).json({ success: false, message: '获取规则失败' });
  }
});

router.get('/type/:ruleType', async (req, res) => {
  try {
    const { ruleType } = req.params;
    
    const rules = await Rule.find({ 
      ruleType: ruleType, 
      isActive: true 
    }).sort({ order: 1 });
    
    res.json({
      success: true,
      rules: rules
    });
  } catch (error) {
    console.error('获取规则失败:', error);
    res.status(500).json({ success: false, message: '获取规则失败' });
  }
});

router.get('/key/:ruleKey', async (req, res) => {
  try {
    const { ruleKey } = req.params;
    
    const rule = await Rule.findOne({ ruleKey: ruleKey, isActive: true });
    
    res.json({
      success: true,
      rule: rule
    });
  } catch (error) {
    console.error('获取规则失败:', error);
    res.status(500).json({ success: false, message: '获取规则失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { 
      ruleType, 
      ruleKey, 
      ruleName, 
      description = '', 
      icon = '', 
      points = 0, 
      conditions = {}, 
      order = 0, 
      metadata = {}
    } = req.body;
    
    if (!ruleType || !ruleKey || !ruleName) {
      return res.status(400).json({ 
        success: false, 
        message: '规则类型、规则键和规则名称为必填项' 
      });
    }
    
    const existingRule = await Rule.findOne({ ruleKey: ruleKey });
    if (existingRule) {
      return res.status(400).json({ 
        success: false, 
        message: '规则键已存在' 
      });
    }
    
    const rule = new Rule({
      ruleType,
      ruleKey,
      ruleName,
      description,
      icon,
      points,
      conditions,
      order,
      metadata,
      isActive: true
    });
    
    await rule.save();
    
    res.json({
      success: true,
      rule: rule,
      message: '规则创建成功'
    });
  } catch (error) {
    console.error('创建规则失败:', error);
    res.status(500).json({ success: false, message: '创建规则失败' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const rule = await Rule.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!rule) {
      return res.status(404).json({ 
        success: false, 
        message: '规则不存在' 
      });
    }
    
    res.json({
      success: true,
      rule: rule,
      message: '规则更新成功'
    });
  } catch (error) {
    console.error('更新规则失败:', error);
    res.status(500).json({ success: false, message: '更新规则失败' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const rule = await Rule.findById(id);
    if (!rule) {
      return res.status(404).json({ 
        success: false, 
        message: '规则不存在' 
      });
    }
    
    await Rule.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: '规则删除成功'
    });
  } catch (error) {
    console.error('删除规则失败:', error);
    res.status(500).json({ success: false, message: '删除规则失败' });
  }
});

router.put('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const rule = await Rule.findByIdAndUpdate(
      id,
      { isActive: isActive, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!rule) {
      return res.status(404).json({ 
        success: false, 
        message: '规则不存在' 
      });
    }
    
    res.json({
      success: true,
      rule: rule,
      message: `规则已${isActive ? '启用' : '禁用'}`
    });
  } catch (error) {
    console.error('更新规则状态失败:', error);
    res.status(500).json({ success: false, message: '更新规则状态失败' });
  }
});

router.post('/init-defaults', async (req, res) => {
  try {
    const existingRules = await Rule.countDocuments();
    if (existingRules > 0) {
      return res.json({ 
        success: true, 
        message: '规则已存在，无需初始化' 
      });
    }
    
    const defaultRules = [
      {
        ruleType: 'points',
        ruleKey: 'daily_checkin',
        ruleName: '每日签到',
        description: '每日签到奖励',
        icon: '📅',
        points: 5,
        order: 1,
        conditions: { type: 'daily' }
      },
      {
        ruleType: 'points',
        ruleKey: 'consecutive_checkin_3',
        ruleName: '连续签到3天',
        description: '连续签到3天额外奖励',
        icon: '🔥',
        points: 20,
        order: 2,
        conditions: { type: 'consecutive', days: 3 }
      },
      {
        ruleType: 'points',
        ruleKey: 'consecutive_checkin_7',
        ruleName: '连续签到7天',
        description: '连续签到7天额外奖励',
        icon: '🌟',
        points: 50,
        order: 3,
        conditions: { type: 'consecutive', days: 7 }
      },
      {
        ruleType: 'points',
        ruleKey: 'complete_pomodoro',
        ruleName: '完成番茄钟',
        description: '完成一个番茄钟奖励',
        icon: '🍅',
        points: 10,
        order: 4,
        conditions: { type: 'pomodoro' }
      },
      {
        ruleType: 'points',
        ruleKey: 'complete_task',
        ruleName: '完成任务',
        description: '完成一个任务奖励',
        icon: '✅',
        points: 0,
        order: 5,
        conditions: { type: 'task', variablePoints: true }
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_beginner',
        ruleName: '时间小萌新',
        description: '注册成功即可获得',
        icon: '⭐',
        order: 1,
        conditions: { type: 'register' }
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_consecutive_3',
        ruleName: '连续3天',
        description: '连续签到3天',
        icon: '🔥',
        order: 2,
        conditions: { type: 'consecutive', days: 3 }
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_consecutive_7',
        ruleName: '连续7天',
        description: '连续签到7天',
        icon: '🌟',
        order: 3,
        conditions: { type: 'consecutive', days: 7 }
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_reader',
        ruleName: '阅读达人',
        description: '累计获得100积分',
        icon: '📚',
        order: 4,
        conditions: { type: 'points', minPoints: 100 }
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_efficient',
        ruleName: '效率之星',
        description: '累计获得200积分',
        icon: '⚡',
        order: 5,
        conditions: { type: 'points', minPoints: 200 }
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_consecutive_30',
        ruleName: '连续30天',
        description: '连续签到30天',
        icon: '🏆',
        order: 6,
        conditions: { type: 'consecutive', days: 30 }
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_master',
        ruleName: '时间大师',
        description: '累计获得500积分',
        icon: '💎',
        order: 7,
        conditions: { type: 'points', minPoints: 500 }
      },
      {
        ruleType: 'badge',
        ruleKey: 'badge_super',
        ruleName: '超级学霸',
        description: '累计获得1000积分',
        icon: '🚀',
        order: 8,
        conditions: { type: 'points', minPoints: 1000 }
      },
      {
        ruleType: 'level',
        ruleKey: 'level_1',
        ruleName: '时间小萌新',
        description: 'Lv.1',
        icon: '🌱',
        order: 1,
        conditions: { minPoints: 0, maxPoints: 99 }
      },
      {
        ruleType: 'level',
        ruleKey: 'level_2',
        ruleName: '时间小达人',
        description: 'Lv.2',
        icon: '🌿',
        order: 2,
        conditions: { minPoints: 100, maxPoints: 199 }
      },
      {
        ruleType: 'level',
        ruleKey: 'level_3',
        ruleName: '时间小标兵',
        description: 'Lv.3',
        icon: '🌳',
        order: 3,
        conditions: { minPoints: 200, maxPoints: 299 }
      },
      {
        ruleType: 'level',
        ruleKey: 'level_4',
        ruleName: '时间管理师',
        description: 'Lv.4',
        icon: '🌲',
        order: 4,
        conditions: { minPoints: 300, maxPoints: 499 }
      },
      {
        ruleType: 'level',
        ruleKey: 'level_5',
        ruleName: '时间大师',
        description: 'Lv.5',
        icon: '🌴',
        order: 5,
        conditions: { minPoints: 500, maxPoints: 999 }
      },
      {
        ruleType: 'level',
        ruleKey: 'level_6',
        ruleName: '超级时间王者',
        description: 'Lv.6',
        icon: '🎋',
        order: 6,
        conditions: { minPoints: 1000, maxPoints: Infinity }
      }
    ];
    
    await Rule.insertMany(defaultRules);
    
    res.json({
      success: true,
      message: '默认规则初始化成功',
      count: defaultRules.length
    });
  } catch (error) {
    console.error('初始化默认规则失败:', error);
    res.status(500).json({ success: false, message: '初始化默认规则失败' });
  }
});

module.exports = router;
