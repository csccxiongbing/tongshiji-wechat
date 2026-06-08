const app = getApp()

Page({
  data: {
    currentMode: 'pomodoro',
    isRunning: false,
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    progress: 0,
    formattedTime: '25:00',
    timerLabel: '专注时间',
    completedPomodoros: 3,
    totalMinutes: 75,
    streakDays: 5,
    todayHistory: [
      { id: 1, type: 'pomodoro', time: '09:30', duration: 25 },
      { id: 2, type: 'shortBreak', time: '10:00', duration: 5 },
      { id: 3, type: 'pomodoro', time: '10:15', duration: 25 }
    ],
    timer: null,
    // 新增：来自任务的参数
    taskInfo: null,
    scheduleId: null,
    memberName: '',
    taskPoints: 0,
    hasTask: false
  },
  
  modes: {
    pomodoro: { duration: 25 * 60, label: '专注时间', color: '#FF6B6B' },
    shortBreak: { duration: 5 * 60, label: '短休息', color: '#4ECDC4' },
    longBreak: { duration: 15 * 60, label: '长休息', color: '#45B7D1' }
  },
  
  onLoad: async function(options) {
    console.log('番茄钟页面加载')
    console.log('options:', options)
    
    // 尝试从全局变量获取任务信息（通过 switchTab 跳转）
    const pomodoroTaskInfo = app.globalData.pomodoroTaskInfo
    console.log('全局变量任务信息:', pomodoroTaskInfo)
    
    if (pomodoroTaskInfo) {
      this.setData({
        taskInfo: pomodoroTaskInfo.taskInfo,
        scheduleId: pomodoroTaskInfo.scheduleId,
        memberName: pomodoroTaskInfo.memberName,
        taskPoints: pomodoroTaskInfo.points,
        hasTask: true,
        timerLabel: pomodoroTaskInfo.taskInfo?.title || '专注时间'
      })
      
      wx.showToast({
        title: `任务：${pomodoroTaskInfo.taskInfo?.title || '任务'}`,
        icon: 'none',
        duration: 2000
      })
      
      // 清除全局变量，避免下次进入时重复使用
      app.globalData.pomodoroTaskInfo = null
    }
    
    this.updateTabBar()
    // 加载最新的番茄钟历史
    await app.loadPomodoroHistory()
    this.loadStats()
  },
  
  onShow: async function() {
    // 在 onShow 中再次检查全局变量（因为 switchTab 可能不会触发 onLoad）
    if (!this.data.hasTask) {
      const pomodoroTaskInfo = app.globalData.pomodoroTaskInfo
      if (pomodoroTaskInfo) {
        this.setData({
          taskInfo: pomodoroTaskInfo.taskInfo,
          scheduleId: pomodoroTaskInfo.scheduleId,
          memberName: pomodoroTaskInfo.memberName,
          taskPoints: pomodoroTaskInfo.points,
          hasTask: true,
          timerLabel: pomodoroTaskInfo.taskInfo?.title || '专注时间'
        })
        
        app.globalData.pomodoroTaskInfo = null
      }
    }
    
    // 加载最新的番茄钟历史
    await app.loadPomodoroHistory()
    this.loadStats()
    this.updateTabBar()
  },
  
  onUnload: function() {
    this.stopTimer()
  },
  
  updateTabBar: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentIndex: 1
      })
    }
  },
  
  loadStats: function() {
    const history = app.globalData.pomodoroHistory || []
    let completedPomodoros = 0
    let totalMinutes = 0
    
    history.forEach(item => {
      // 数据库中的 completed 字段或者旧数据的 type 字段
      if (item.completed === true || item.type === 'pomodoro') {
        completedPomodoros++
      }
      totalMinutes += item.duration || 25
    })
    
    this.setData({
      todayHistory: history,
      completedPomodoros: completedPomodoros,
      totalMinutes: totalMinutes
    })
  },
  
  setMode: function(e) {
    if (this.data.isRunning) {
      wx.showToast({
        title: '请先停止计时器',
        icon: 'none'
      })
      return
    }
    
    const mode = e.currentTarget.dataset.mode
    const modeConfig = this.modes[mode]
    
    this.setData({
      currentMode: mode,
      timeLeft: modeConfig.duration,
      totalTime: modeConfig.duration,
      timerLabel: modeConfig.label,
      formattedTime: this.formatTime(modeConfig.duration),
      progress: 0
    })
  },
  
  formatTime: function(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  },
  
  toggleTimer: function() {
    if (this.data.isRunning) {
      this.pauseTimer()
    } else {
      this.startTimer()
    }
  },
  
  startTimer: function() {
    this.setData({ isRunning: true })
    
    this.data.timer = setInterval(() => {
      const newTime = this.data.timeLeft - 1
      
      if (newTime <= 0) {
        this.completeTimer()
        return
      }
      
      const progress = ((this.data.totalTime - newTime) / this.data.totalTime) * 100
      
      this.setData({
        timeLeft: newTime,
        formattedTime: this.formatTime(newTime),
        progress: progress
      })
    }, 1000)
  },
  
  pauseTimer: function() {
    this.stopTimer()
    this.setData({ isRunning: false })
  },
  
  stopTimer: function() {
    if (this.data.timer) {
      clearInterval(this.data.timer)
      this.data.timer = null
    }
  },
  
  resetTimer: function() {
    this.stopTimer()
    const modeConfig = this.modes[this.data.currentMode]
    
    this.setData({
      isRunning: false,
      timeLeft: modeConfig.duration,
      totalTime: modeConfig.duration,
      timerLabel: modeConfig.label,
      formattedTime: this.formatTime(modeConfig.duration),
      progress: 0
    })
  },
  
  skipTimer: function() {
    this.completeTimer()
  },
  
  completeTimer: async function() {
    this.stopTimer()
    
    const modeConfig = this.modes[this.data.currentMode]
    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const historyItem = {
      scheduleId: this.data.scheduleId,
      taskName: this.data.taskInfo?.title || '专注时间',
      duration: Math.round(modeConfig.duration / 60),
      completed: this.data.currentMode === 'pomodoro',
      points: 0,  // 积分由打卡奖励系统统一发放，不再单独发放
      startTime: timeStr,
      endTime: timeStr
    }
    
    if (this.data.currentMode === 'pomodoro') {
      const memberName = this.data.memberName || this.getCurrentMemberName()
      
      // 如果有任务，完成番茄钟时也完成任务（会触发打卡奖励，但番茄钟打卡奖励在下面统一处理）
      if (this.data.scheduleId && memberName) {
        await this.completeTask()
      }
      
      // 保存番茄钟历史到数据库，同时触发打卡奖励（包含番茄钟积分+每日打卡+连续打卡）
      let totalBonus = 0
      let checkInResult = null
      const saveResult = await app.savePomodoroHistory(historyItem, memberName)
      if (saveResult.success && saveResult.rewards) {
        checkInResult = saveResult.rewards
        // 计算总积分奖励
        totalBonus = checkInResult.awardedPoints || 0
      }
      
      // 显示积分奖励信息
      let toastTitle = '🎉 专注完成！'
      if (totalBonus > 0) {
        // 显示奖励明细
        const rewardDetails = []
        if (checkInResult && checkInResult.rewards) {
          checkInResult.rewards.forEach(r => {
            if (r.ruleName && r.points > 0) {
              rewardDetails.push(`${r.ruleName}+${r.points}`)
            }
          })
        }
        if (rewardDetails.length > 0) {
          toastTitle = `🎉 专注完成！${rewardDetails.join(' ')}`
        } else {
          toastTitle = `🎉 专注完成！+${totalBonus}心愿`
        }
      }
      
      wx.showToast({
        title: toastTitle,
        icon: 'success',
        duration: 2000
      })
    } else {
      wx.showToast({
        title: '休息时间结束',
        icon: 'none'
      })
    }
    
    this.loadStats()
    
    this.autoSwitchMode()
  },

  getCurrentMemberName: function() {
    // 获取当前用户的成员名称
    const userInfo = app.globalData.userInfo || {}
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
    
    // 1. 优先通过手机号匹配
    const phone = userInfo.phone
    if (phone) {
      const phoneMatch = members.find(m => m.phone === phone)
      if (phoneMatch) return phoneMatch.name
    }
    
    // 2. 通过角色类型匹配
    if (userInfo.role) {
      const roleMatch = members.find(m => m.role === userInfo.role)
      if (roleMatch) return roleMatch.name
    }
    
    // 3. 最后才通过 isCurrentUser 标记查找
    const currentMember = members.find(m => m.isCurrentUser)
    if (currentMember) return currentMember.name
    
    return ''
  },
  
  completeTask: async function() {
    const scheduleId = this.data.scheduleId
    const memberName = this.data.memberName
    const taskPoints = this.data.taskPoints
    
    console.log('完成任务:', scheduleId, memberName, taskPoints)
    
    // 容错处理：如果 scheduleId 不存在或为空
    if (!scheduleId) {
      console.error('scheduleId 为空，无法完成任务')
      return
    }
    
    // 调用后端API完成任务（会触发任务打卡奖励，但不触发番茄钟打卡奖励）
    const result = await app.completeSchedule(scheduleId, memberName)
    
    if (!result.success) {
      console.error('完成任务失败:', result.message)
      return
    }
    
    // 添加任务本身的积分（任务积分由打卡奖励系统统一处理，这里只是额外显示）
    if (taskPoints > 0 && memberName) {
      wx.showToast({
        title: `任务完成！+${taskPoints}心愿`,
        icon: 'success',
        duration: 2000
      })
    }
    
    // 重置任务状态
    this.setData({
      hasTask: false,
      scheduleId: null,
      memberName: '',
      taskPoints: 0,
      taskInfo: null,
      timerLabel: '专注时间'
    })
  },

  autoSwitchMode: function() {
    if (this.data.currentMode === 'pomodoro') {
      this.setData({
        currentMode: 'shortBreak',
        timeLeft: this.modes.shortBreak.duration,
        totalTime: this.modes.shortBreak.duration,
        timerLabel: '短休息',
        formattedTime: '05:00',
        progress: 0
      })
    } else {
      this.setData({
        currentMode: 'pomodoro',
        timeLeft: this.modes.pomodoro.duration,
        totalTime: this.modes.pomodoro.duration,
        timerLabel: '专注时间',
        formattedTime: '25:00',
        progress: 0
      })
    }
  }
})
