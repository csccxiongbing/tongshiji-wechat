App({
  globalData: {
    users: [],
    userInfo: null,
    familyMembers: {},
    schedules: [],
    points: 150,
    memberPoints: {
      '爸爸': 50,
      '妈妈': 50,
      '小明': 50
    },
    pointsHistory: [
      { id: 1, amount: 10, reason: '完成早餐任务', time: '2026/5/29 08:30', balance: 150, member: '小明' },
      { id: 2, amount: 20, reason: '完成番茄专注', time: '2026/5/28 16:00', balance: 140, member: '小明' },
      { id: 3, amount: 10, reason: '完成午餐任务', time: '2026/5/28 12:00', balance: 120, member: '妈妈' },
      { id: 4, amount: 50, reason: '连续打卡奖励', time: '2026/5/27 20:00', balance: 110, member: '小明' }
    ],
    pomodoroHistory: [
      { id: 1, type: 'pomodoro', time: '09:30', duration: 25 },
      { id: 2, type: 'shortBreak', time: '10:00', duration: 5 },
      { id: 3, type: 'pomodoro', time: '10:15', duration: 25 }
    ]
  },
  
  onLaunch: function () {
    try {
      console.log('App初始化中...')
      const users = wx.getStorageSync('users')
      if (users && Array.isArray(users)) {
        this.globalData.users = users
        console.log('加载用户列表成功:', users)
      } else {
        console.log('没有找到用户列表')
      }
      
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo && typeof userInfo === 'object') {
        this.globalData.userInfo = userInfo
        console.log('加载用户信息成功:', userInfo)
      } else {
        console.log('没有找到用户信息')
      }
      
      const schedules = wx.getStorageSync('schedules')
      if (schedules && Array.isArray(schedules)) {
        this.globalData.schedules = schedules
      }
      
      const familyMembers = wx.getStorageSync('familyMembers')
      if (familyMembers && typeof familyMembers === 'object') {
        this.globalData.familyMembers = familyMembers
        console.log('加载家庭信息成功:', familyMembers)
      } else {
        console.log('没有找到家庭信息')
      }
      
      const points = wx.getStorageSync('points')
      if (points !== undefined && points !== null && typeof points === 'number') {
        this.globalData.points = points
      }
      
      const pointsHistory = wx.getStorageSync('pointsHistory')
      if (pointsHistory && Array.isArray(pointsHistory)) {
        this.globalData.pointsHistory = pointsHistory
      }
      
      const pomodoroHistory = wx.getStorageSync('pomodoroHistory')
      if (pomodoroHistory && Array.isArray(pomodoroHistory)) {
        this.globalData.pomodoroHistory = pomodoroHistory
      }
      
      const memberPoints = wx.getStorageSync('memberPoints')
      if (memberPoints && typeof memberPoints === 'object') {
        this.globalData.memberPoints = memberPoints
      }
    } catch (e) {
      console.error('数据加载错误:', e)
    }
  },
  
  getUsers: function() {
    return this.globalData.users
  },
  
  saveUsers: function(users) {
    try {
      this.globalData.users = users
      wx.setStorageSync('users', users)
    } catch (e) {
      console.error('保存用户列表错误:', e)
    }
  },
  
  findUserByPhone: function(phone) {
    return this.globalData.users.find(u => u.phone === phone)
  },
  
  registerUser: function(userInfo) {
    try {
      const existingUser = this.findUserByPhone(userInfo.phone)
      if (existingUser) {
        return { success: false, message: '该手机号已注册' }
      }
      
      const newUser = {
        ...userInfo,
        id: Date.now(),
        familyMembers: {
          members: []
        },
        schedules: [],
        points: 0,
        memberPoints: {},
        pointsHistory: [],
        pomodoroHistory: []
      }
      
      const updatedUsers = [...this.globalData.users, newUser]
      this.saveUsers(updatedUsers)
      this.saveUserInfo(newUser)
      
      return { success: true, user: newUser }
    } catch (e) {
      console.error('注册用户错误:', e)
      return { success: false, message: '注册失败' }
    }
  },
  
  loginUser: function(phone) {
    try {
      const user = this.findUserByPhone(phone)
      if (!user) {
        return { success: false, message: '该手机号未注册' }
      }
      
      this.globalData.userInfo = user
      this.globalData.familyMembers = user.familyMembers || { members: [] }
      this.globalData.schedules = user.schedules || []
      this.globalData.points = user.points || 150
      this.globalData.memberPoints = user.memberPoints || {}
      this.globalData.pointsHistory = user.pointsHistory || []
      this.globalData.pomodoroHistory = user.pomodoroHistory || []
      
      wx.setStorageSync('userInfo', user)
      wx.setStorageSync('familyMembers', user.familyMembers || { members: [] })
      wx.setStorageSync('schedules', user.schedules || [])
      wx.setStorageSync('points', user.points || 150)
      wx.setStorageSync('memberPoints', user.memberPoints || {})
      wx.setStorageSync('pointsHistory', user.pointsHistory || [])
      wx.setStorageSync('pomodoroHistory', user.pomodoroHistory || [])
      
      return { success: true, user: user }
    } catch (e) {
      console.error('登录用户错误:', e)
      return { success: false, message: '登录失败' }
    }
  },
  
  logout: function() {
    try {
      this.saveCurrentUserToUsersList()
      
      this.globalData.userInfo = null
      this.globalData.familyMembers = { members: [] }
      this.globalData.schedules = []
      this.globalData.points = 150
      this.globalData.memberPoints = {}
      this.globalData.pointsHistory = []
      this.globalData.pomodoroHistory = []
      
      wx.removeStorageSync('userInfo')
      wx.removeStorageSync('familyMembers')
      wx.removeStorageSync('schedules')
      wx.removeStorageSync('points')
      wx.removeStorageSync('memberPoints')
      wx.removeStorageSync('pointsHistory')
      wx.removeStorageSync('pomodoroHistory')
    } catch (e) {
      console.error('退出登录错误:', e)
    }
  },
  
  clearAllData: function() {
    try {
      this.globalData.users = []
      this.globalData.userInfo = null
      this.globalData.familyMembers = {}
      this.globalData.schedules = []
      this.globalData.points = 150
      this.globalData.memberPoints = {}
      this.globalData.pointsHistory = []
      this.globalData.pomodoroHistory = []
      
      wx.removeStorageSync('users')
      wx.removeStorageSync('userInfo')
      wx.removeStorageSync('familyMembers')
      wx.removeStorageSync('schedules')
      wx.removeStorageSync('points')
      wx.removeStorageSync('memberPoints')
      wx.removeStorageSync('pointsHistory')
      wx.removeStorageSync('pomodoroHistory')
      
      console.log('所有数据已清空')
      return { success: true, message: '所有数据已清空' }
    } catch (e) {
      console.error('清空数据错误:', e)
      return { success: false, message: '清空数据失败' }
    }
  },
  
  saveCurrentUserToUsersList: function() {
    if (!this.globalData.userInfo) return
    
    const userIndex = this.globalData.users.findIndex(u => u.phone === this.globalData.userInfo.phone)
    if (userIndex !== -1) {
      const updatedUser = {
        ...this.globalData.userInfo,
        familyMembers: this.globalData.familyMembers,
        schedules: this.globalData.schedules,
        points: this.globalData.points,
        memberPoints: this.globalData.memberPoints,
        pointsHistory: this.globalData.pointsHistory,
        pomodoroHistory: this.globalData.pomodoroHistory
      }
      this.globalData.users[userIndex] = updatedUser
      this.saveUsers(this.globalData.users)
    }
  },
  
  saveUserInfo: function(userInfo) {
    try {
      this.globalData.userInfo = userInfo
      wx.setStorageSync('userInfo', userInfo)
      this.saveCurrentUserToUsersList()
    } catch (e) {
      console.error('保存用户信息错误:', e)
    }
  },
  
  saveSchedules: function(schedules) {
    try {
      this.globalData.schedules = schedules
      wx.setStorageSync('schedules', schedules)
      this.saveCurrentUserToUsersList()
    } catch (e) {
      console.error('保存日程错误:', e)
    }
  },
  
  clearSchedules: function() {
    try {
      this.globalData.schedules = []
      wx.setStorageSync('schedules', [])
      this.saveCurrentUserToUsersList()
    } catch (e) {
      console.error('清空日程错误:', e)
    }
  },
  
  saveFamilyMembers: function(members) {
    try {
      this.globalData.familyMembers = members
      wx.setStorageSync('familyMembers', members)
      this.saveCurrentUserToUsersList()
    } catch (e) {
      console.error('保存家庭成员错误:', e)
    }
  },
  
  savePoints: function(points) {
    try {
      this.globalData.points = points
      wx.setStorageSync('points', points)
      this.saveCurrentUserToUsersList()
    } catch (e) {
      console.error('保存积分错误:', e)
    }
  },
  
  addPoints: function(amount, reason, member) {
    try {
      const newPoints = this.globalData.points + amount
      this.globalData.points = newPoints
      
      if (member) {
        const memberCurrentPoints = this.globalData.memberPoints[member] || 0
        this.globalData.memberPoints[member] = memberCurrentPoints + amount
        wx.setStorageSync('memberPoints', this.globalData.memberPoints)
      }
      
      const history = {
        id: Date.now(),
        amount: amount,
        reason: reason,
        time: new Date().toLocaleString(),
        balance: newPoints,
        member: member
      }
      this.globalData.pointsHistory.unshift(history)
      
      wx.setStorageSync('points', newPoints)
      wx.setStorageSync('pointsHistory', this.globalData.pointsHistory)
      this.saveCurrentUserToUsersList()
    } catch (e) {
      console.error('添加积分错误:', e)
    }
  },
  
  savePomodoroHistory: function(history) {
    try {
      this.globalData.pomodoroHistory.unshift(history)
      wx.setStorageSync('pomodoroHistory', this.globalData.pomodoroHistory)
      this.saveCurrentUserToUsersList()
    } catch (e) {
      console.error('保存番茄钟记录错误:', e)
    }
  }
})