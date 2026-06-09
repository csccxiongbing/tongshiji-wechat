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
    reachedLevels: [],
    
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
    if (!app.checkLogin()) return
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
        { level: 6, name: '时间王者', minPoints: 800 },
        { level: 7, name: '时间传说', minPoints: 1000 },
        { level: 8, name: '时间神话', minPoints: 1500 },
        { level: 9, name: '时间主宰', minPoints: 2000 },
        { level: 10, name: '时间之神', minPoints: 3000 }
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
    
    // 为每个等级添加是否已达到和是否是当前级别的标记
    levels = levels.map((level, index) => {
      return {
        ...level,
        reached: index <= currentLevelIndex,
        current: index === currentLevelIndex
      }
    })
    
    // 计算进度百分比
    const currentMinPoints = levels[currentLevelIndex]?.minPoints || 0
    const progressPercent = Math.min(100, Math.round(((currentPoints - currentMinPoints) / (nextLevelPoints - currentMinPoints)) * 100))
    
    // 计算已达到的等级（当前等级及之前的所有等级）
    const reachedLevels = []
    for (let i = 0; i <= currentLevelIndex; i++) {
      reachedLevels.push(i)
    }
    
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
        { days: 3, bonus: 2 },
        { days: 7, bonus: 5 },
        { days: 15, bonus: 10 },
        { days: 30, bonus: 20 },
        { days: 60, bonus: 40 },
        { days: 90, bonus: 70 },
        { days: 120, bonus: 100 }
      ]
    }
    
    // 获取连续打卡天数 - 从数据库中的家庭成员数据获取
    let streakDays = 0
    if (currentMember) {
      streakDays = currentMember.consecutiveCheckInDays || 0
    }
    
    // 处理徽章规则
    let badges = []
    if (rules.badge && rules.badge.length > 0) {
      badges = rules.badge.map(rule => {
        const conditions = this.parseConditions(rule.conditions)
        let minPoints = 0
        let minStreak = 0
        let pomodoroCount = 0
        let level = 0
        
        if (conditions.type === 'points') {
          minPoints = conditions.minPoints || 0
        } else if (conditions.type === 'consecutive') {
          minStreak = conditions.days || 0
        } else if (conditions.type === 'pomodoro_count') {
          pomodoroCount = conditions.count || 0
        } else if (conditions.type === 'level') {
          level = conditions.level || 0
        }
        
        let isUnlocked = true
        if (minPoints > 0) isUnlocked = isUnlocked && currentPoints >= minPoints
        if (minStreak > 0) isUnlocked = isUnlocked && streakDays >= minStreak
        if (pomodoroCount > 0) isUnlocked = false
        if (level > 0) isUnlocked = isUnlocked && currentLevel >= level
        
        let conditionText = ''
        if (conditions.type === 'register') {
          conditionText = '注册即可获得'
        } else if (conditions.type === 'points') {
          conditionText = `获得${minPoints}积分`
        } else if (conditions.type === 'consecutive') {
          conditionText = `连续打卡${minStreak}天`
        } else if (conditions.type === 'pomodoro_count') {
          conditionText = `完成${pomodoroCount}个番茄钟`
        } else if (conditions.type === 'level') {
          conditionText = `达到${level}级`
        }
        
        return {
          id: rule.ruleKey,
          icon: rule.icon,
          name: rule.ruleName,
          condition: rule.description || conditionText,
          unlocked: isUnlocked
        }
      })
      // 按解锁状态排序：已解锁的排前面，未解锁的排后面
      badges.sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1
        if (!a.unlocked && b.unlocked) return 1
        return 0
      })
    } else {
      badges = [
        { id: 'badge_beginner', icon: '⭐', name: '时间小萌新', condition: '注册即可获得', unlocked: true },
        { id: 'badge_consecutive_3', icon: '🔥', name: '连续3天', condition: '连续打卡3天', unlocked: streakDays >= 3 },
        { id: 'badge_consecutive_7', icon: '🌟', name: '连续7天', condition: '连续打卡7天', unlocked: streakDays >= 7 },
        { id: 'badge_consecutive_15', icon: '🌙', name: '连续15天', condition: '连续打卡15天', unlocked: streakDays >= 15 },
        { id: 'badge_reader', icon: '📚', name: '阅读达人', condition: '获得100积分', unlocked: currentPoints >= 100 },
        { id: 'badge_efficient', icon: '⚡', name: '效率之星', condition: '获得200积分', unlocked: currentPoints >= 200 },
        { id: 'badge_consecutive_30', icon: '🏆', name: '连续30天', condition: '连续打卡30天', unlocked: streakDays >= 30 },
        { id: 'badge_master', icon: '⏰', name: '时间大师', condition: '获得500积分', unlocked: currentPoints >= 500 },
        { id: 'badge_consecutive_60', icon: '🎯', name: '坚持不懈', condition: '连续打卡60天', unlocked: streakDays >= 60 },
        { id: 'badge_consecutive_90', icon: '💪', name: '超级坚持', condition: '连续打卡90天', unlocked: streakDays >= 90 },
        { id: 'badge_consecutive_120', icon: '☀️', name: '时间传奇', condition: '连续打卡120天', unlocked: streakDays >= 120 },
        { id: 'badge_super', icon: '🚀', name: '超级学霸', condition: '获得1000积分', unlocked: currentPoints >= 1000 },
        { id: 'badge_pomodoro_master', icon: '🍅', name: '番茄达人', condition: '完成50个番茄钟', unlocked: false },
        { id: 'badge_points_king', icon: '💎', name: '积分王者', condition: '获得800积分', unlocked: currentPoints >= 800 },
        { id: 'badge_max_level', icon: '👑', name: '满级玩家', condition: '达到10级', unlocked: currentLevel >= 10 }
      ]
      // 按解锁状态排序：已解锁的排前面，未解锁的排后面
      badges.sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1
        if (!a.unlocked && b.unlocked) return 1
        return 0
      })
    }
    
    // 处理积分获取规则
    let pointsRules = []
    if (rules.points && rules.points.length > 0) {
      const processedRules = rules.points.map(rule => {
        const conditions = this.parseConditions(rule.conditions)
        let icon = rule.icon
        let title = rule.ruleName
        let desc = rule.description
        
        if (conditions.type === 'daily') {
          icon = '📅'
          title = '每日打卡'
          desc = '每天首次完成任务'
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
          points: rule.points,
          type: conditions.type,
          days: conditions.days
        }
      })
      
      // 过滤出非连续打卡的规则
      pointsRules = processedRules.filter(rule => rule.type !== 'consecutive').map(rule => ({
        icon: rule.icon,
        title: rule.title,
        desc: rule.desc,
        pointsText: rule.points > 0 ? '+' + rule.points + '分' : '+积分'
      }))
      
      // 添加一条连续打卡规则
      pointsRules.push({
        icon: '🔥',
        title: '连续打卡',
        desc: '连续打卡额外奖励',
        pointsText: '+积分'
      })
      
      // 按顺序排序
      pointsRules.sort((a, b) => {
        const orderMap = { '每日打卡': 0, '连续打卡': 1, '完成番茄钟': 2, '完成任务': 3 }
        return orderMap[a.title] - orderMap[b.title]
      })
    }
    
    if (pointsRules.length === 0) {
      pointsRules = [
        { icon: '📅', title: '每日打卡', desc: '每天首次完成任务', pointsText: '+1分' },
        { icon: '🔥', title: '连续打卡', desc: '连续打卡额外奖励', pointsText: '+积分' },
        { icon: '🍅', title: '完成番茄钟', desc: '完成一次专注计时', pointsText: '+2分' },
        { icon: '📝', title: '完成任务', desc: '完成家长布置的任务', pointsText: '+积分' }
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
      reachedLevels,
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
