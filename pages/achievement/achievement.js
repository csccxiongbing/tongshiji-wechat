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
    wishes: []
  },

  onShow: function() {
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
      
      // 只允许孩子角色访问
      if (role !== 'child') {
        wx.showToast({
          title: '该页面仅对孩子开放',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
        return
      }
      
      // 尝试加载最新的心愿数据
      try {
        if (app.loadWishes && typeof app.loadWishes === 'function') {
          await app.loadWishes()
        }
      } catch (e) {
        console.error('加载心愿失败:', e)
      }

      // 获取当前用户角色名称
      const currentMemberName = this.findCurrentMemberName()
      console.log('当前成员名称:', currentMemberName)
      
      // 获取当前积分
      const memberPoints = app.globalData.memberPoints || {}
      let currentPoints = memberPoints[currentMemberName] || 0
      console.log('当前积分:', currentPoints, 'memberPoints:', memberPoints)
      
      // 如果积分仍为0，从缓存读取
      if (currentPoints === 0) {
        try {
          const cachedPoints = wx.getStorageSync('memberPoints') || {}
          currentPoints = cachedPoints[currentMemberName] || 0
          console.log('从缓存读取积分:', currentPoints)
        } catch (e) {
          console.error('读取缓存积分失败:', e)
        }
      }
      
      // 计算等级和进度
      const { level, levelName, progress, pointsToNext } = this.calculateLevelInfo(currentPoints)
      
      // 获取连续打卡天数
      const { currentStreak, bestStreak } = this.calculateStreak()
      
      // 获取徽章数据
      const { unlockedBadges, lockedBadges } = this.getBadges(currentPoints, currentStreak)
      console.log('已解锁徽章:', unlockedBadges.length, '待解锁徽章:', lockedBadges.length)
      
      // 获取心愿数据
      const wishes = this.getWishes()
      console.log('心愿数量:', wishes.length)
      
      this.setData({
        currentPoints: currentPoints,
        level: level,
        levelName: levelName,
        levelProgress: progress,
        pointsToNext: pointsToNext,
        currentStreak: currentStreak,
        bestStreak: bestStreak,
        unlockedBadges: unlockedBadges,
        lockedBadges: lockedBadges,
        wishes: wishes
      })
    } catch (error) {
      console.error('加载成就数据失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
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
    const levels = [
      { min: 0, max: 99, name: '时间小萌新', nextMin: 100 },
      { min: 100, max: 199, name: '时间小达人', nextMin: 200 },
      { min: 200, max: 299, name: '时间小标兵', nextMin: 300 },
      { min: 300, max: 499, name: '时间管理师', nextMin: 500 },
      { min: 500, max: 999, name: '时间大师', nextMin: 1000 },
      { min: 1000, max: Infinity, name: '超级时间王者', nextMin: 1000 }
    ]
    
    let currentLevel = levels[0]
    for (let i = levels.length - 1; i >= 0; i--) {
      if (points >= levels[i].min) {
        currentLevel = levels[i]
        break
      }
    }
    
    const levelIndex = levels.indexOf(currentLevel)
    const levelNum = levelIndex + 1
    const range = currentLevel.max - currentLevel.min
    const progress = range === Infinity ? 100 : Math.min(100, Math.round(((points - currentLevel.min) / range) * 100))
    const pointsToNext = currentLevel.max === Infinity ? 0 : currentLevel.nextMin - points
    
    return {
      level: levelNum,
      levelName: currentLevel.name,
      progress: progress,
      pointsToNext: pointsToNext
    }
  },

  calculateStreak: function() {
    // 从本地存储获取打卡记录
    const streakData = wx.getStorageSync('streakData') || {}
    const currentStreak = streakData.currentStreak || 0
    const bestStreak = streakData.bestStreak || 0
    
    return { currentStreak, bestStreak }
  },

  getBadges: function(points, streak) {
    const allBadges = [
      { id: 'beginner', name: '初学者', icon: '⭐', minPoints: 0, minStreak: 0, color: '#FFE66D', colorEnd: '#FFD54F' },
      { id: 'streak3', name: '连续3天', icon: '🔥', minPoints: 0, minStreak: 3, color: '#FFA726', colorEnd: '#FF7043' },
      { id: 'streak7', name: '连续7天', icon: '🔥', minPoints: 0, minStreak: 7, color: '#FF5722', colorEnd: '#E64A19' },
      { id: 'reader', name: '阅读达人', icon: '📚', minPoints: 100, minStreak: 0, color: '#64B5F6', colorEnd: '#42A5F5' },
      { id: 'efficient', name: '效率之星', icon: '⚡', minPoints: 200, minStreak: 0, color: '#4ECDC4', colorEnd: '#26A69A' },
      { id: 'streak30', name: '连续30天', icon: '🏆', minPoints: 0, minStreak: 30, color: '#B388FF', colorEnd: '#7C4DFF' },
      { id: 'master', name: '时间大师', icon: '💎', minPoints: 500, minStreak: 0, color: '#AB47BC', colorEnd: '#8E24AA' },
      { id: 'super', name: '超级学霸', icon: '🚀', minPoints: 1000, minStreak: 0, color: '#EF5350', colorEnd: '#E53935' }
    ]
    
    const unlockedBadges = []
    const lockedBadges = []
    
    allBadges.forEach(badge => {
      const isUnlocked = points >= badge.minPoints && streak >= badge.minStreak
      if (isUnlocked) {
        unlockedBadges.push(badge)
      } else {
        lockedBadges.push(badge)
      }
    })
    
    return { unlockedBadges, lockedBadges }
  },

  getWishes: function() {
    // 获取当前用户角色名称
    const currentMemberName = this.findCurrentMemberName()
    console.log('当前成员名称:', currentMemberName)
    
    // 从 app.globalData 获取心愿数据
    let allWishes = app.globalData.wishes || []
    console.log('从 globalData 获取到的心愿:', allWishes)
    
    // 如果没有数据，尝试从缓存读取
    if (allWishes.length === 0) {
      try {
        const cachedWishes = wx.getStorageSync('wishes') || []
        if (cachedWishes.length > 0) {
          console.log('从缓存获取到心愿:', cachedWishes)
          allWishes = cachedWishes
          app.globalData.wishes = cachedWishes
        }
      } catch (e) {
        console.error('从缓存读取心愿失败:', e)
      }
    }
    
    // 如果还是没有数据，使用默认数据
    if (allWishes.length === 0) {
      console.log('使用默认心愿数据')
      allWishes = [
        { id: 'default1', name: '看电影', icon: '🎬', points: 50, assignedTo: [currentMemberName] },
        { id: 'default2', name: '玩游戏1小时', icon: '🎮', points: 100, assignedTo: [currentMemberName], weeklyLimitEnabled: true, weeklyLimitCount: 3 },
        { id: 'default3', name: '冰淇淋', icon: '🍦', points: 30, assignedTo: [currentMemberName], weeklyLimitEnabled: true, weeklyLimitCount: 2 },
        { id: 'default4', name: '去游乐园', icon: '🎢', points: 300, assignedTo: [currentMemberName] },
        { id: 'default5', name: '买玩具', icon: '🎁', points: 200, assignedTo: [currentMemberName] },
        { id: 'default6', name: '吃大餐', icon: '🍔', points: 80, assignedTo: [currentMemberName] }
      ]
    }
    
    // 筛选当前用户可兑换的心愿
    const filteredWishes = allWishes.filter(wish => {
      // 如果心愿没有分配给特定成员，则所有孩子都可以兑换
      if (!wish.assignedTo || wish.assignedTo.length === 0) {
        return true
      }
      // 否则检查是否分配给了当前成员
      return wish.assignedTo.includes(currentMemberName)
    })
    console.log('筛选后的心愿:', filteredWishes)
    
    // 定义一些渐变色用于显示
    const gradients = [
      { color: '#FF80AB', colorEnd: '#FF4081' },
      { color: '#4ECDC4', colorEnd: '#26A69A' },
      { color: '#64B5F6', colorEnd: '#42A5F5' },
      { color: '#FFA726', colorEnd: '#FF7043' },
      { color: '#AB47BC', colorEnd: '#8E24AA' },
      { color: '#EF5350', colorEnd: '#E53935' }
    ]
    
    // 格式化心愿数据
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
