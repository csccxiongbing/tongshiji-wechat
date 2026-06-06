const app = getApp()

Page({
  data: {
    // 积分相关
    currentPoints: 0,
    taskPoints: 10,
    
    // 等级相关
    currentLevel: 1,
    levelName: '新手',
    progressPercent: 0,
    currentLevelIndex: 0,
    levels: [
      { level: 1, name: '新手', minPoints: 0 },
      { level: 2, name: '学徒', minPoints: 100 },
      { level: 3, name: '达人', minPoints: 300 },
      { level: 4, name: '精英', minPoints: 600 },
      { level: 5, name: '大师', minPoints: 1000 },
      { level: 6, name: '传奇', minPoints: 2000 }
    ],
    nextLevelPoints: 100,
    
    // 连续打卡
    streakDays: 0,
    streakRewards: [
      { days: 3, bonus: 5 },
      { days: 7, bonus: 10 },
      { days: 15, bonus: 20 },
      { days: 30, bonus: 40 },
      { days: 60, bonus: 80 },
      { days: 100, bonus: 160 }
    ],
    
    // 勋章
    badges: [
      { 
        id: 1, 
        icon: '🌟', 
        name: '初次任务', 
        condition: '完成第1个任务',
        unlocked: false 
      },
      { 
        id: 2, 
        icon: '🔥', 
        name: '连续3天', 
        condition: '连续签到3天',
        unlocked: false 
      },
      { 
        id: 3, 
        icon: '⭐', 
        name: '初学者', 
        condition: '获得100积分',
        unlocked: false 
      },
      { 
        id: 4, 
        icon: '🏆', 
        name: '任务达人', 
        condition: '完成10个任务',
        unlocked: false 
      },
      { 
        id: 5, 
        icon: '🎯', 
        name: '专注之星', 
        condition: '完成10个番茄钟',
        unlocked: false 
      },
      { 
        id: 6, 
        icon: '💎', 
        name: '中级用户', 
        condition: '达到3级',
        unlocked: false 
      },
      { 
        id: 7, 
        icon: '👑', 
        name: '高级用户', 
        condition: '达到5级',
        unlocked: false 
      },
      { 
        id: 8, 
        icon: '🚀', 
        name: '连续7天', 
        condition: '连续签到7天',
        unlocked: false 
      },
      { 
        id: 9, 
        icon: '💫', 
        name: '超级用户', 
        condition: '达到6级',
        unlocked: false 
      }
    ]
  },

  onLoad: function(options) {
    this.loadUserData()
  },

  onShow: function() {
    this.loadUserData()
  },

  loadUserData: function() {
    // 从全局数据加载用户信息
    const userInfo = app.globalData.userInfo || {}
    const familyMembers = app.globalData.familyMembers || {}
    
    // 获取当前用户对应的成员信息
    let currentMember = null
    if (familyMembers.members) {
      // 优先通过手机号匹配
      if (userInfo.phone) {
        currentMember = familyMembers.members.find(m => m.phone === userInfo.phone)
      }
      // 如果没找到，通过角色匹配
      if (!currentMember && userInfo.role) {
        currentMember = familyMembers.members.find(m => m.role === userInfo.role)
      }
      // 如果还没找到，通过isCurrentUser标记
      if (!currentMember) {
        currentMember = familyMembers.members.find(m => m.isCurrentUser)
      }
    }
    
    // 获取积分
    const currentPoints = currentMember?.points || userInfo.points || 0
    
    // 计算等级
    const levels = this.data.levels
    let currentLevelIndex = 0
    let currentLevel = 1
    let levelName = '新手'
    let nextLevelPoints = levels[1]?.minPoints || 100
    
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
    
    // 获取连续打卡天数
    const streakDays = currentMember?.streakDays || 0
    
    // 解锁勋章判断
    const badges = this.data.badges.map(badge => {
      let unlocked = false
      
      switch(badge.id) {
        case 1: // 初次任务
          unlocked = currentPoints >= 10 || streakDays >= 1
          break
        case 2: // 连续3天
          unlocked = streakDays >= 3
          break
        case 3: // 初学者
          unlocked = currentPoints >= 100
          break
        case 4: // 任务达人
          unlocked = currentPoints >= 300
          break
        case 5: // 专注之星
          unlocked = currentPoints >= 500
          break
        case 6: // 中级用户
          unlocked = currentLevel >= 3
          break
        case 7: // 高级用户
          unlocked = currentLevel >= 5
          break
        case 8: // 连续7天
          unlocked = streakDays >= 7
          break
        case 9: // 超级用户
          unlocked = currentLevel >= 6
          break
      }
      
      return { ...badge, unlocked }
    })
    
    this.setData({
      currentPoints,
      currentLevel,
      levelName,
      progressPercent,
      currentLevelIndex,
      nextLevelPoints,
      streakDays,
      badges,
      taskPoints: 10
    })
  }
})
