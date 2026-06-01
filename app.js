App({
  globalData: {
    userInfo: null,
    familyMembers: {
      members: [
        { name: '爸爸', role: 'parent' },
        { name: '妈妈', role: 'parent' },
        { name: '小明', role: 'child' }
      ]
    },
    schedules: [],
    points: 150,
    pointsHistory: [
      { id: 1, amount: 10, reason: '完成早餐任务', time: '2026/5/29 08:30', balance: 150 },
      { id: 2, amount: 20, reason: '完成番茄专注', time: '2026/5/28 16:00', balance: 140 },
      { id: 3, amount: 10, reason: '完成午餐任务', time: '2026/5/28 12:00', balance: 120 },
      { id: 4, amount: 50, reason: '连续打卡奖励', time: '2026/5/27 20:00', balance: 110 }
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
    } catch (e) {
      console.error('数据加载错误:', e)
    }
  },
  
  saveUserInfo: function(userInfo) {
    try {
      this.globalData.userInfo = userInfo
      wx.setStorageSync('userInfo', userInfo)
    } catch (e) {
      console.error('保存用户信息错误:', e)
    }
  },
  
  saveSchedules: function(schedules) {
    try {
      this.globalData.schedules = schedules
      wx.setStorageSync('schedules', schedules)
    } catch (e) {
      console.error('保存日程错误:', e)
    }
  },
  
  saveFamilyMembers: function(members) {
    try {
      this.globalData.familyMembers = members
      wx.setStorageSync('familyMembers', members)
    } catch (e) {
      console.error('保存家庭成员错误:', e)
    }
  },
  
  savePoints: function(points) {
    try {
      this.globalData.points = points
      wx.setStorageSync('points', points)
    } catch (e) {
      console.error('保存积分错误:', e)
    }
  },
  
  addPoints: function(amount, reason) {
    try {
      const newPoints = this.globalData.points + amount
      this.globalData.points = newPoints
      
      const history = {
        id: Date.now(),
        amount: amount,
        reason: reason,
        time: new Date().toLocaleString(),
        balance: newPoints
      }
      this.globalData.pointsHistory.unshift(history)
      
      wx.setStorageSync('points', newPoints)
      wx.setStorageSync('pointsHistory', this.globalData.pointsHistory)
    } catch (e) {
      console.error('添加积分错误:', e)
    }
  },
  
  savePomodoroHistory: function(history) {
    try {
      this.globalData.pomodoroHistory.unshift(history)
      wx.setStorageSync('pomodoroHistory', this.globalData.pomodoroHistory)
    } catch (e) {
      console.error('保存番茄钟记录错误:', e)
    }
  }
})