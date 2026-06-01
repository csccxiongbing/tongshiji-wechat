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
    timer: null
  },
  
  modes: {
    pomodoro: { duration: 25 * 60, label: '专注时间', color: '#FF6B6B' },
    shortBreak: { duration: 5 * 60, label: '短休息', color: '#4ECDC4' },
    longBreak: { duration: 15 * 60, label: '长休息', color: '#45B7D1' }
  },
  
  onShow: function() {
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
  
  completeTimer: function() {
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
      app.addPoints(10, '完成番茄专注')
      
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