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
  
  onLoad: function(options) {
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
    this.loadStats()
  },
  
  onShow: function() {
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
    const history = app.globalData.pomodoroHistory || this.data.todayHistory
    let completedPomodoros = 0
    let totalMinutes = 0
    
    history.forEach(item => {
      if (item.type === 'pomodoro') {
        completedPomodoros++
      }
      totalMinutes += item.duration
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
      id: Date.now(),
      type: this.data.currentMode,
      time: timeStr,
      duration: Math.round(modeConfig.duration / 60)
    }
    
    if (this.data.currentMode === 'pomodoro') {
      // 如果有任务，完成番茄钟时也完成任务
      if (this.data.scheduleId && this.data.memberName) {
        await this.completeTask()
      }
      
      // 添加番茄钟的基础积分
      await app.addPoints('', 10, '完成番茄专注')
      
      wx.showToast({
        title: '🎉 专注完成！+10心愿',
        icon: 'success',
        duration: 2000
      })
    } else {
      wx.showToast({
        title: '休息时间结束',
        icon: 'none'
      })
    }
    
    app.savePomodoroHistory(historyItem)
    this.loadStats()
    
    this.autoSwitchMode()
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
    
    // 调用后端API完成任务
    const result = await app.completeSchedule(scheduleId, memberName)
    
    if (!result.success) {
      console.error('完成任务失败:', result.message)
      return
    }
    
    // 添加任务积分（如果任务有积分奖励）
    if (taskPoints > 0) {
      await app.addPoints(memberName, taskPoints, `完成"${this.data.taskInfo?.title || '任务'}"任务`)
      
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
