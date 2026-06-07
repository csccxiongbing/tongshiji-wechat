const app = getApp()

Page({
  data: {
    // 积分相关
    currentPoints: 0,
    taskPoints: 10,
    
    // 等级相关
    currentLevel: 1,
    levelName: '时间小萌新',
    progressPercent: 0,
    currentLevelIndex: 0,
    levels: [],
    nextLevelPoints: 100,
    
    // 连续打卡
    streakDays: 0,
    streakRewards: [],
    
    // 勋章
    badges: [],
    
    // 积分获取规则
    pointsRules: []
  },

  onLoad: function(options) {
    this.loadUserData()
  },

  onShow: function() {
    this.loadUserData()
  },

  findCurrentMemberName: function() {
    const userInfo = app.globalData.userInfo || {}
    if (!userInfo) return ''
    
    let family = app.globalData.familyMembers
    if (!family || (!family.members && !Array.isArray(family))) {
      try {
        family = wx.getStorageSync('familyMembers')
      } catch (e) {}
    }
    
    let members = []
    if (family && Array.isArray(family.members)) {
      members = family.members
    } else if (family && Array.isArray(family)) {
      members = family
    }
    
    const phone = userInfo.phone
    if (phone) {
      const phoneMatch = members.find(m => m.phone === phone)
      if (phoneMatch) {
        return phoneMatch.name
      }
    }
    
    if (userInfo.role) {
      const roleMatch = members.find(m => m.role === userInfo.role)
      if (roleMatch) {
        return roleMatch.name
      }
    }
    
    const currentMember = members.find(m => m.isCurrentUser)
    if (currentMember) {
      return currentMember.name
    }
    
    return userInfo.nickname || '小明'
  },

  loadUserData: function() {
    // 从全局数据加载用户信息
    const userInfo = app.globalData.userInfo || {}
    const familyMembers = app.globalData.familyMembers || {}
    
    // 获取当前用户对应的成员信息
    let currentMember = null
    if (familyMembers.members) {
      if (userInfo.phone) {
        currentMember = familyMembers.members.find(m => m.phone === userInfo.phone)
      }
      if (!currentMember && userInfo.role) {
        currentMember = familyMembers.members.find(m => m.role === userInfo.role)
      }
      if (!currentMember) {
        currentMember = familyMembers.members.find(m => m.isCurrentUser)
      }
    }
    
    // 获取当前用户角色名称
    const currentMemberName = this.findCurrentMemberName()
    
    // 获取积分
    const memberPoints = app.globalData.memberPoints || {}
    const currentPoints = memberPoints[currentMemberName] || 0
    
    // 加载规则
    const rules = app.globalData.rules || {}
    
    // 处理等级规则
    let levels = []
    let currentLevelIndex = 0
    let currentLevel = 1
    let levelName = '时间小萌新'
    let nextLevelPoints = 100
    
    if (rules.level && rules.level.length > 0) {
      levels = rules.level.map((rule, index) => {
        const conditions = this.parseConditions(rule.conditions)
        return {
          level: index + 1,
          name: rule.ruleName,
          minPoints: conditions.minPoints || 0,
          maxPoints: conditions.maxPoints || Infinity
        }
      }).sort((a, b) => a.minPoints - b.minPoints)
    } else {
      levels = [
        { level: 1, name: '时间小萌新', minPoints: 0 },
        { level: 2, name: '时间小达人', minPoints: 100 },
        { level: 3, name: '时间小标兵', minPoints: 200 },
        { level: 4, name: '时间管理师', minPoints: 300 },
        { level: 5, name: '时间大师', minPoints: 500 },
        { level: 6, name: '超级时间王者', minPoints: 1000 }
      ]
    }
    
    // 计算当前等级
    for (let i = levels.length - 1; i >= 0; i--) {
      if (currentPoints >= levels[i].minPoints) {
        currentLevelIndex = i
        currentLevel = levels[i].level
        levelName = levels[i].name
        
        if (i < levels.length - 1) {
          nextLevelPoints = levels[i + 1].minPoints
        } else {
          nextLevelPoints = levels[i].minPoints + 1000
        }
        break
      }
    }
    
    // 计算进度百分比
    const currentMinPoints = levels[currentLevelIndex]?.minPoints || 0
    const progressPercent = Math.min(100, Math.round(((currentPoints - currentMinPoints) / (nextLevelPoints - currentMinPoints)) * 100))
    
    // 处理连续打卡规则
    let streakRewards = []
    if (rules.points && rules.points.length > 0) {
      const consecutiveRules = rules.points.filter(r => {
        const conditions = this.parseConditions(r.conditions)
        return conditions.type === 'consecutive'
      })
      streakRewards = consecutiveRules.map(r => {
        const conditions = this.parseConditions(r.conditions)
        return {
          days: conditions.days || 0,
          bonus: r.points || 0
        }
      }).sort((a, b) => a.days - b.days)
    }
    
    if (streakRewards.length === 0) {
      streakRewards = [
        { days: 3, bonus: 5 },
        { days: 7, bonus: 10 },
        { days: 15, bonus: 20 },
        { days: 30, bonus: 40 },
        { days: 60, bonus: 80 },
        { days: 100, bonus: 160 }
      ]
    }
    
    // 获取连续打卡天数
    const streakData = wx.getStorageSync('streakData') || {}
    const streakDays = streakData.currentStreak || 0
    
    // 处理徽章规则
    let badges = []
    if (rules.badge && rules.badge.length > 0) {
      badges = rules.badge.map(rule => {
        const conditions = this.parseConditions(rule.conditions)
        let minPoints = 0
        let minStreak = 0
        
        if (conditions.type === 'points') {
          minPoints = conditions.minPoints || 0
        } else if (conditions.type === 'consecutive') {
          minStreak = conditions.days || 0
        }
        
        const unlocked = currentPoints >= minPoints && streakDays >= minStreak
        
        let conditionText = ''
        if (conditions.type === 'register') {
          conditionText = '注册即可获得'
        } else if (conditions.type === 'points') {
          conditionText = `获得${minPoints}积分`
        } else if (conditions.type === 'consecutive') {
          conditionText = `连续签到${minStreak}天`
        }
        
        return {
          id: rule.ruleKey,
          icon: rule.icon,
          name: rule.ruleName,
          condition: rule.description || conditionText,
          unlocked: unlocked
        }
      })
    } else {
      badges = [
        { id: 'badge_beginner', icon: '⭐', name: '时间小萌新', condition: '注册即可获得', unlocked: true },
        { id: 'badge_consecutive_3', icon: '🔥', name: '连续3天', condition: '连续签到3天', unlocked: streakDays >= 3 },
        { id: 'badge_consecutive_7', icon: '🌟', name: '连续7天', condition: '连续签到7天', unlocked: streakDays >= 7 },
        { id: 'badge_reader', icon: '📚', name: '阅读达人', condition: '获得100积分', unlocked: currentPoints >= 100 },
        { id: 'badge_efficient', icon: '⚡', name: '效率之星', condition: '获得200积分', unlocked: currentPoints >= 200 },
        { id: 'badge_consecutive_30', icon: '🏆', name: '连续30天', condition: '连续签到30天', unlocked: streakDays >= 30 },
        { id: 'badge_master', icon: '💎', name: '时间大师', condition: '获得500积分', unlocked: currentPoints >= 500 },
        { id: 'badge_super', icon: '🚀', name: '超级学霸', condition: '获得1000积分', unlocked: currentPoints >= 1000 }
      ]
    }
    
    // 处理积分获取规则
    let pointsRules = []
    if (rules.points && rules.points.length > 0) {
      pointsRules = rules.points.filter(r => {
        const conditions = this.parseConditions(r.conditions)
        return conditions.type !== 'consecutive'
      }).map(rule => {
        const conditions = this.parseConditions(rule.conditions)
        let icon = rule.icon
        let title = rule.ruleName
        let desc = rule.description
        
        if (conditions.type === 'daily') {
          icon = '📅'
          title = '每日签到'
          desc = '每天首次打开应用'
        } else if (conditions.type === 'pomodoro') {
          icon = '🍅'
          title = '完成番茄钟'
          desc = '完成一次专注计时'
        } else if (conditions.type === 'task') {
          icon = '📝'
          title = '完成任务'
          desc = '完成家长布置的任务'
        }
        
        return {
          icon: icon,
          title: title,
          desc: desc,
          points: rule.points
        }
      })
    }
    
    if (pointsRules.length === 0) {
      pointsRules = [
        { icon: '📝', title: '完成任务', desc: '完成家长布置的任务', points: 0 },
        { icon: '🍅', title: '完成番茄钟', desc: '完成一次专注计时', points: 10 },
        { icon: '📅', title: '每日签到', desc: '每天首次打开应用', points: 5 }
      ]
    }
    
    this.setData({
      currentPoints,
      currentLevel,
      levelName,
      progressPercent,
      currentLevelIndex,
      levels,
      nextLevelPoints,
      streakDays,
      streakRewards,
      badges,
      pointsRules,
      taskPoints: 10
    })
  },
  
  parseConditions: function(conditions) {
    if (!conditions) return {}
    if (typeof conditions === 'object') return conditions
    try {
      if (typeof conditions === 'string') {
        let str = conditions
        if (str.startsWith('@{') && str.endsWith('}')) {
          str = '{' + str.slice(2, -1) + '}'
          str = str.replace(/=/g, ':').replace(/True/g, 'true').replace(/False/g, 'false')
        }
        return JSON.parse(str)
      }
    } catch (e) {}
    return {}
  }
})
