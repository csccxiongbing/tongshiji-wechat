const app = getApp()

Page({
  data: {
    currentPoints: 0,
    level: 1,
    levelName: '时间小萌新',
    levelProgress: 0,
    pointsToNext: 100,
    currentStreak: 0,
    bestStreak: 0,
    unlockedBadges: [],
    lockedBadges: [],
    wishes: [],
    totalTasks: 0,
    completedTasks: 0,
    role: 'child',
    childMembers: [],
    selectedChildName: '选择孩子',
    selectedChildIndex: 0,
    showChildPicker: false
  },

  onShow: function() {
    if (!app.checkLogin()) return
    this.loadAchievementData()
    this.updateTabBar()
  },

  updateTabBar: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabBar = this.getTabBar()
      if (tabBar && typeof tabBar.setData === 'function') {
        tabBar.setData({
          currentIndex: 2
        })
      }
    }
  },

  loadAchievementData: async function() {
    try {
      const userInfo = app.globalData.userInfo || {}
      const role = userInfo.role || 'child'
      
      // 获取孩子成员列表
      const childMembers = this.getChildMembers()
      console.log('孩子成员列表:', childMembers)
      
      if (app.loadWishes && typeof app.loadWishes === 'function') {
        await app.loadWishes()
      }

      // 根据角色确定查看谁的数据
      let currentMemberName
      if (role === 'parent' && childMembers.length > 0) {
        // 家长角色默认查看第一个孩子的数据
        currentMemberName = this.data.selectedChildName !== '选择孩子' 
          ? this.data.selectedChildName 
          : childMembers[0].name
      } else {
        currentMemberName = this.findCurrentMemberName()
      }
      
      console.log('当前查看成员名称:', currentMemberName)
      
      const memberPoints = app.globalData.memberPoints || {}
      let currentPoints = memberPoints[currentMemberName] || 0
      
      // 如果是孩子角色，优先从 currentMember 获取积分
      if (role === 'child') {
        const currentMember = this.getCurrentMember()
        if (currentMember && currentMember.points !== undefined && currentMember.points !== null) {
          currentPoints = currentMember.points
        }
      }
      
      console.log('当前积分:', currentPoints, 'memberPoints:', memberPoints)
      
      const { level, levelName, progress, pointsToNext } = this.calculateLevelInfo(currentPoints)
      
      // 获取打卡天数
      const { currentStreak, bestStreak } = await this.getMemberStreak(currentMemberName)
      
      const pomodoroHistory = app.globalData.pomodoroHistory || []
      const completedPomodoros = pomodoroHistory.filter(p => p.completed).length
      
      const { level: currentLevel } = this.calculateLevelInfo(currentPoints)
      
      const { unlockedBadges, lockedBadges } = this.getBadges(currentPoints, currentStreak, completedPomodoros, currentLevel)
      console.log('已解锁徽章:', unlockedBadges.length, '待解锁徽章:', lockedBadges.length)
      
      const wishes = this.getWishes(currentMemberName)
      console.log('心愿数量:', wishes.length)
      
      // 获取任务统计
      const { totalTasks, completedTasks } = await this.getTaskStats(role, currentMemberName)
      
      this.setData({
        role: role,
        childMembers: childMembers,
        selectedChildName: currentMemberName,
        currentPoints: currentPoints,
        level: level,
        levelName: levelName,
        levelProgress: progress,
        pointsToNext: pointsToNext,
        currentStreak: currentStreak,
        bestStreak: bestStreak,
        unlockedBadges: unlockedBadges,
        lockedBadges: lockedBadges,
        wishes: wishes,
        totalTasks: totalTasks,
        completedTasks: completedTasks
      })
    } catch (error) {
      console.error('加载成就数据失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 获取孩子成员列表
  getChildMembers: function() {
    let family = app.globalData.familyMembers
    let members = []
    
    if (family && Array.isArray(family.members)) {
      members = family.members
    } else if (family && Array.isArray(family)) {
      members = family
    }
    
    // 筛选孩子角色
    return members.filter(m => m.role === 'child')
  },

  // 获取当前用户对应的成员
  getCurrentMember: function() {
    const userInfo = app.globalData.userInfo || {}
    if (!userInfo) return null
    
    let family = app.globalData.familyMembers
    let members = []
    
    if (family && Array.isArray(family.members)) {
      members = family.members
    } else if (family && Array.isArray(family)) {
      members = family
    }
    
    // 1. 优先通过手机号匹配
    const phone = userInfo.phone
    if (phone) {
      const phoneMatch = members.find(m => m.phone === phone)
      if (phoneMatch) return phoneMatch
    }
    
    // 2. 通过角色类型匹配
    if (userInfo.role) {
      const roleMatch = members.find(m => m.role === userInfo.role)
      if (roleMatch) return roleMatch
    }
    
    // 3. 通过 isCurrentUser 标记查找
    return members.find(m => m.isCurrentUser)
  },

  // 获取成员的连续打卡天数
  getMemberStreak: async function(memberName) {
    let currentStreak = 0
    let bestStreak = 0
    
    let family = app.globalData.familyMembers
    let members = []
    
    if (family && Array.isArray(family.members)) {
      members = family.members
    } else if (family && Array.isArray(family)) {
      members = family
    }
    
    // 查找指定成员
    const member = members.find(m => m.name === memberName)
    if (member) {
      currentStreak = member.consecutiveCheckInDays || 0
      bestStreak = member.maxCheckInDays || 0
    }
    
    return { currentStreak, bestStreak }
  },

  // 切换下拉框显示
  toggleChildPicker: function() {
    this.setData({
      showChildPicker: !this.data.showChildPicker
    })
  },

  // 选择孩子成员
  selectChildMember: async function(e) {
    const name = e.currentTarget.dataset.name
    const childMembers = this.data.childMembers
    const index = childMembers.findIndex(m => m.name === name)
    
    if (index >= 0) {
      this.setData({
        selectedChildIndex: index,
        selectedChildName: name,
        showChildPicker: false
      })
      
      // 重新加载数据
      await this.loadAchievementData()
    }
  },

  getTaskStats: async function(role, currentMemberName) {
    const userInfo = app.globalData.userInfo || {}
    const familyId = userInfo.familyId
    
    // 获取任务总数
    const schedules = app.globalData.schedules || []
    const totalTasks = schedules.length
    
    // 获取完成任务数
    let completedTasks = 0
    
    if (familyId) {
      try {
        let result
        if (role === 'parent' && currentMemberName) {
          // 家长查看孩子数据
          result = await app.getCompletedTaskStats(familyId, currentMemberName)
        } else if (role === 'child' && currentMemberName) {
          result = await app.getCompletedTaskStats(familyId, currentMemberName)
        } else {
          result = await app.getCompletedTaskStats(familyId)
        }
        
        if (result.success) {
          if (currentMemberName) {
            completedTasks = result.total || 0
          } else {
            const stats = result.stats || {}
            completedTasks = Object.values(stats).reduce((sum, count) => sum + count, 0)
          }
        }
      } catch (error) {
        console.error('获取任务统计失败:', error)
      }
    }
    
    return { totalTasks, completedTasks }
  },

  findCurrentMemberName: function() {
    const userInfo = app.globalData.userInfo || {}
    if (!userInfo) return ''
    
    let family = app.globalData.familyMembers
    
    let members = []
    if (family && Array.isArray(family.members)) {
      members = family.members
    } else if (family && Array.isArray(family)) {
      members = family
    }
    
    console.log('家庭成员列表:', members, '用户信息:', userInfo)
    
    // 1. 优先通过手机号匹配
    const phone = userInfo.phone
    if (phone) {
      const phoneMatch = members.find(m => m.phone === phone)
      if (phoneMatch) {
        console.log('通过手机号匹配到成员:', phoneMatch.name)
        return phoneMatch.name
      }
    }
    
    // 2. 通过角色类型匹配
    if (userInfo.role) {
      const roleMatch = members.find(m => m.role === userInfo.role)
      if (roleMatch) {
        console.log('通过角色匹配到成员:', roleMatch.name)
        return roleMatch.name
      }
    }
    
    // 3. 通过 isCurrentUser 标记查找
    const currentMember = members.find(m => m.isCurrentUser)
    if (currentMember) {
      console.log('通过isCurrentUser匹配到成员:', currentMember.name)
      return currentMember.name
    }
    
    console.log('未匹配到成员，返回默认值')
    return userInfo.nickname || '小明'
  },

  calculateLevelInfo: function(points) {
    const levelRules = app.globalData.rules?.level || [];
    let levels = [];
    
    const parseConditions = function(conditions) {
      if (!conditions) return {};
      if (typeof conditions === 'object') return conditions;
      try {
        if (typeof conditions === 'string') {
          return JSON.parse(conditions.replace(/@{/g, '{').replace(/}/g, '}').replace(/=/g, ':'));
        }
      } catch (e) {}
      return {};
    };
    
    if (levelRules.length > 0) {
      levels = levelRules.map(rule => {
        const conditions = parseConditions(rule.conditions);
        return {
          min: conditions.minPoints || 0,
          max: conditions.maxPoints === Infinity || conditions.maxPoints === 'Infinity' || !conditions.maxPoints ? Infinity : (conditions.maxPoints || 0),
          name: rule.ruleName,
          icon: rule.icon
        };
      }).sort((a, b) => a.min - b.min);
    } else {
      levels = [
        { min: 0, max: 99, name: '时间小萌新', nextMin: 100, icon: '🌱' },
        { min: 100, max: 199, name: '时间小达人', nextMin: 200, icon: '🌿' },
        { min: 200, max: 299, name: '时间小标兵', nextMin: 300, icon: '🌳' },
        { min: 300, max: 499, name: '时间管理师', nextMin: 500, icon: '🌲' },
        { min: 500, max: 799, name: '时间大师', nextMin: 800, icon: '🌴' },
        { min: 800, max: 999, name: '时间王者', nextMin: 1000, icon: '🎋' },
        { min: 1000, max: 1499, name: '时间传说', nextMin: 1500, icon: '⭐' },
        { min: 1500, max: 1999, name: '时间神话', nextMin: 2000, icon: '✨' },
        { min: 2000, max: 2999, name: '时间主宰', nextMin: 3000, icon: '🌟' },
        { min: 3000, max: Infinity, name: '时间之神', nextMin: 3000, icon: '🏆' }
      ];
    }
    
    let currentLevel = levels[0];
    for (let i = levels.length - 1; i >= 0; i--) {
      if (points >= levels[i].min) {
        currentLevel = levels[i];
        break;
      }
    }
    
    const levelIndex = levels.indexOf(currentLevel);
    const levelNum = levelIndex + 1;
    const range = currentLevel.max - currentLevel.min;
    const progress = range === Infinity ? 100 : Math.min(100, Math.round(((points - currentLevel.min) / range) * 100));
    const nextLevel = levels[levelIndex + 1];
    const pointsToNext = !nextLevel ? 0 : nextLevel.min - points;
    
    return {
      level: levelNum,
      levelName: currentLevel.name,
      progress: progress,
      pointsToNext: pointsToNext,
      icon: currentLevel.icon
    };
  },

  calculateStreak: function() {
    // 从数据库中的家庭成员数据获取打卡记录
    let currentStreak = 0
    let bestStreak = 0
    
    const userInfo = app.globalData.userInfo || {}
    let family = app.globalData.familyMembers
    
    let members = []
    if (family && Array.isArray(family.members)) {
      members = family.members
    } else if (family && Array.isArray(family)) {
      members = family
    }
    
    // 查找当前用户对应的成员
    let currentMember = null
    
    // 1. 优先通过手机号匹配
    const phone = userInfo.phone
    if (phone) {
      const phoneMatch = members.find(m => m.phone === phone)
      if (phoneMatch) {
        currentMember = phoneMatch
      }
    }
    
    // 2. 通过角色类型匹配
    if (!currentMember && userInfo.role) {
      const roleMatch = members.find(m => m.role === userInfo.role)
      if (roleMatch) {
        currentMember = roleMatch
      }
    }
    
    // 3. 通过 isCurrentUser 标记查找
    if (!currentMember) {
      currentMember = members.find(m => m.isCurrentUser)
    }
    
    if (currentMember) {
      currentStreak = currentMember.consecutiveCheckInDays || 0
      bestStreak = currentMember.maxCheckInDays || 0
    }
    
    return { currentStreak, bestStreak }
  },

  getBadges: function(points, streak, completedPomodoros = 0, currentLevel = 1) {
    const badgeRules = app.globalData.rules?.badge || [];
    let allBadges = [];
    const colors = [
      { color: '#FFE66D', colorEnd: '#FFD54F' },
      { color: '#FFA726', colorEnd: '#FF7043' },
      { color: '#FF5722', colorEnd: '#E64A19' },
      { color: '#64B5F6', colorEnd: '#42A5F5' },
      { color: '#4ECDC4', colorEnd: '#26A69A' },
      { color: '#B388FF', colorEnd: '#7C4DFF' },
      { color: '#AB47BC', colorEnd: '#8E24AA' },
      { color: '#EF5350', colorEnd: '#E53935' }
    ];
    
    const parseConditions = function(conditions) {
      if (!conditions) return {};
      if (typeof conditions === 'object') return conditions;
      try {
        if (typeof conditions === 'string') {
          return JSON.parse(conditions.replace(/@{/g, '{').replace(/}/g, '}').replace(/=/g, ':'));
        }
      } catch (e) {}
      return {};
    };
    
    if (badgeRules.length > 0) {
      allBadges = badgeRules.map((rule, index) => {
        let minPoints = 0;
        let minStreak = 0;
        let pomodoroCount = 0;
        let level = 0;
        const conditions = parseConditions(rule.conditions);
        
        if (conditions.type === 'points') {
          minPoints = conditions.minPoints || 0;
        } else if (conditions.type === 'consecutive') {
          minStreak = conditions.days || 0;
        } else if (conditions.type === 'pomodoro_count') {
          pomodoroCount = conditions.count || 0;
        } else if (conditions.type === 'level') {
          level = conditions.level || 0;
        }
        
        return {
          id: rule.ruleKey,
          name: rule.ruleName,
          icon: rule.icon,
          description: rule.description,
          minPoints: minPoints,
          minStreak: minStreak,
          pomodoroCount: pomodoroCount,
          level: level,
          ...colors[index % colors.length]
        };
      });
    } else {
      allBadges = [
        { id: 'badge_beginner', name: '时间小萌新', icon: '⭐', minPoints: 0, minStreak: 0, color: '#FFE66D', colorEnd: '#FFD54F', description: '注册成功即可获得' },
        { id: 'badge_consecutive_3', name: '连续3天', icon: '🔥', minPoints: 0, minStreak: 3, color: '#FFA726', colorEnd: '#FF7043', description: '连续签到3天' },
        { id: 'badge_consecutive_7', name: '连续7天', icon: '🌟', minPoints: 0, minStreak: 7, color: '#FF5722', colorEnd: '#E64A19', description: '连续签到7天' },
        { id: 'badge_reader', name: '阅读达人', icon: '📚', minPoints: 100, minStreak: 0, color: '#64B5F6', colorEnd: '#42A5F5', description: '累计获得100积分' },
        { id: 'badge_efficient', name: '效率之星', icon: '⚡', minPoints: 200, minStreak: 0, color: '#4ECDC4', colorEnd: '#26A69A', description: '累计获得200积分' },
        { id: 'badge_consecutive_30', name: '连续30天', icon: '🏆', minPoints: 0, minStreak: 30, color: '#B388FF', colorEnd: '#7C4DFF', description: '连续签到30天' },
        { id: 'badge_master', name: '时间大师', icon: '⏰', minPoints: 500, minStreak: 0, color: '#AB47BC', colorEnd: '#8E24AA', description: '累计获得500积分' },
        { id: 'badge_super', name: '超级学霸', icon: '🚀', minPoints: 1000, minStreak: 0, color: '#EF5350', colorEnd: '#E53935', description: '累计获得1000积分' },
        { id: 'badge_pomodoro_master', name: '番茄达人', icon: '🍅', pomodoroCount: 10, color: '#FF7043', colorEnd: '#FF5722', description: '完成10个番茄钟' },
        { id: 'badge_points_king', name: '积分王者', icon: '💎', minPoints: 800, minStreak: 0, color: '#E040FB', colorEnd: '#D500F9', description: '累计获得800积分' },
        { id: 'badge_persistent', name: '坚持不懈', icon: '🎯', minStreak: 60, color: '#18FFFF', colorEnd: '#00E5FF', description: '连续签到60天' },
        { id: 'badge_max_level', name: '满级玩家', icon: '👑', level: 10, color: '#FFD700', colorEnd: '#FFC107', description: '达到10级' }
      ];
    }
    
    const unlockedBadges = [];
    const lockedBadges = [];
    
    allBadges.forEach(badge => {
      let isUnlocked = true;
      
      if (badge.minPoints !== undefined && badge.minPoints > 0) {
        isUnlocked = isUnlocked && points >= badge.minPoints;
      }
      if (badge.minStreak !== undefined && badge.minStreak > 0) {
        isUnlocked = isUnlocked && streak >= badge.minStreak;
      }
      if (badge.pomodoroCount !== undefined && badge.pomodoroCount > 0) {
        isUnlocked = isUnlocked && completedPomodoros >= badge.pomodoroCount;
      }
      if (badge.level !== undefined && badge.level > 0) {
        isUnlocked = isUnlocked && currentLevel >= badge.level;
      }
      
      if (isUnlocked) {
        unlockedBadges.push(badge);
      } else {
        lockedBadges.push(badge);
      }
    });
    
    return { unlockedBadges, lockedBadges };
  },

  getWishes: function(memberName) {
    if (!memberName) {
      memberName = this.findCurrentMemberName()
    }
    let allWishes = app.globalData.wishes || []
    
    if (allWishes.length === 0) {
      try {
        const cachedWishes = wx.getStorageSync('wishes') || []
        if (cachedWishes.length > 0) {
          allWishes = cachedWishes
          app.globalData.wishes = cachedWishes
        }
      } catch (e) {}
    }
    
    const filteredWishes = allWishes.filter(wish => {
      if (!wish.assignedTo || wish.assignedTo.length === 0) {
        return true
      }
      return wish.assignedTo.includes(memberName)
    })
    
    const gradients = [
      { color: '#FF80AB', colorEnd: '#FF4081' },
      { color: '#4ECDC4', colorEnd: '#26A69A' },
      { color: '#64B5F6', colorEnd: '#42A5F5' },
      { color: '#FFA726', colorEnd: '#FF7043' },
      { color: '#AB47BC', colorEnd: '#8E24AA' },
      { color: '#EF5350', colorEnd: '#E53935' }
    ]
    
    return filteredWishes.map((wish, index) => ({
      id: wish.id || wish._id,
      name: wish.name,
      icon: wish.icon || '🎁',
      cost: wish.points || 0,
      weeklyLimitEnabled: wish.weeklyLimitEnabled || false,
      weeklyLimitCount: wish.weeklyLimitCount || 0,
      ...gradients[index % gradients.length]
    }))
  },

  exchangeWish: async function(e) {
    const item = e.currentTarget.dataset.item
    const currentPoints = this.data.currentPoints
    
    if (item.cost > currentPoints) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '兑换心愿',
      content: `确定要兑换"${item.name}"吗？消耗 ${item.cost} 积分`,
      confirmText: '确认兑换',
      cancelText: '再想想',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '兑换中...' })
          
          try {
            // 获取当前用户角色名称
            const currentMemberName = this.findCurrentMemberName()
            
            // 调用后端 API 兑换心愿
            const result = await app.exchangeWish(item.id, currentMemberName)
            
            wx.hideLoading()
            
            if (result.success) {
              wx.showToast({
                title: '兑换成功！',
                icon: 'success',
                duration: 2000
              })
              
              // 刷新数据
              this.loadAchievementData()
              
              // 播放成功音效
              this.playSuccessSound()
            } else {
              wx.showToast({
                title: result.message || '兑换失败',
                icon: 'none'
              })
            }
          } catch (error) {
            wx.hideLoading()
            console.error('兑换心愿失败:', error)
            wx.showToast({
              title: '兑换失败，请重试',
              icon: 'none'
            })
          }
        }
      }
    })
  },
  
  playSuccessSound: function() {
    // 可以在这里添加音效播放功能
  }
})
