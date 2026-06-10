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
    timerEmoji: '🍅',
    todayPomodoros: 0,
    totalMinutes: 0,
    thisWeekPomodoros: 0,
    todayHistory: [],
    timer: null,
    taskInfo: null,
    scheduleId: null,
    memberName: '',
    taskPoints: 0,
    hasTask: false,
    encourageText: '加油！你很棒！💪'
  },
  
  modes: {
    pomodoro: { duration: 25 * 60, label: '专注时间', color: '#FF6B35', emoji: '🍅' },
    shortBreak: { duration: 5 * 60, label: '短休息', color: '#4ECDC4', emoji: '☕' },
    longBreak: { duration: 15 * 60, label: '长休息', color: '#96CEB4', emoji: '😴' }
  },
  
  onLoad: async function(options) {
    if (!app.checkLogin()) return
    var that = this
    console.log('番茄钟页面加载')
    console.log('options:', options)
    
    var pomodoroTaskInfo = app.globalData.pomodoroTaskInfo
    console.log('全局变量任务信息:', pomodoroTaskInfo)
    
    if (pomodoroTaskInfo) {
      // 如果有传递的日期，合并到 taskInfo 中
      var taskInfo = pomodoroTaskInfo.taskInfo || {}
      if (pomodoroTaskInfo.date) {
        taskInfo.date = pomodoroTaskInfo.date
      }
      
      that.setData({
        taskInfo: taskInfo,
        scheduleId: pomodoroTaskInfo.scheduleId,
        memberName: pomodoroTaskInfo.memberName,
        taskPoints: pomodoroTaskInfo.points,
        hasTask: true,
        timerLabel: pomodoroTaskInfo.taskInfo ? pomodoroTaskInfo.taskInfo.title : '专注时间'
      })
      
      wx.showToast({
        title: '任务：' + (pomodoroTaskInfo.taskInfo ? pomodoroTaskInfo.taskInfo.title : '任务'),
        icon: 'none',
        duration: 2000
      })
      
      app.globalData.pomodoroTaskInfo = null
    }
    
    that.updateTabBar()
  },
  
  onShow: async function() {
    var that = this
    if (!that.data.hasTask) {
      var pomodoroTaskInfo = app.globalData.pomodoroTaskInfo
      if (pomodoroTaskInfo) {
        that.setData({
          taskInfo: pomodoroTaskInfo.taskInfo,
          scheduleId: pomodoroTaskInfo.scheduleId,
          memberName: pomodoroTaskInfo.memberName,
          taskPoints: pomodoroTaskInfo.points,
          hasTask: true,
          timerLabel: pomodoroTaskInfo.taskInfo ? pomodoroTaskInfo.taskInfo.title : '专注时间'
        })
        
        app.globalData.pomodoroTaskInfo = null
      }
    }
    
    await app.loadFamilyMembers()
    await app.loadPomodoroHistory()
    that.loadStats()
    that.updateTabBar()
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
    var that = this
    var history = app.globalData.pomodoroHistory || []
    var todayPomodoros = 0
    var thisWeekPomodoros = 0
    var totalMinutes = 0
    
    var today = new Date()
    today.setHours(0, 0, 0, 0)
    
    var dayOfWeek = today.getDay()
    var monday = new Date(today)
    var offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    monday.setDate(today.getDate() - offset)
    monday.setHours(0, 0, 0, 0)
    
    // history 已经是按当前用户 userId 拉取的，直接遍历
    for (var i = 0; i < history.length; i++) {
      var item = history[i]
      var itemDate = new Date(item.createdAt || item.date)
      itemDate.setHours(0, 0, 0, 0)
      
      // 只计算番茄钟专注的记录
      if (item.type === 'pomodoro') {
        if (itemDate.getTime() === today.getTime()) {
          todayPomodoros++
        }
        
        if (itemDate >= monday) {
          thisWeekPomodoros++
        }
        
        // 专注累计：只计算番茄钟的累计时间
        totalMinutes += item.duration || 0
      }
    }
    
    that.setData({
      todayHistory: history,
      todayPomodoros: todayPomodoros,
      thisWeekPomodoros: thisWeekPomodoros,
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
    
    var mode = e.currentTarget.dataset.mode
    var modeConfig = this.modes[mode]
    
    this.setData({
      currentMode: mode,
      timeLeft: modeConfig.duration,
      totalTime: modeConfig.duration,
      timerLabel: modeConfig.label,
      timerEmoji: modeConfig.emoji,
      formattedTime: this.formatTime(modeConfig.duration),
      progress: 0
    })
  },
  
  formatTime: function(seconds) {
    var mins = Math.floor(seconds / 60)
    var secs = seconds % 60
    return (mins < 10 ? '0' + mins : mins) + ':' + (secs < 10 ? '0' + secs : secs)
  },
  
  toggleTimer: function() {
    if (this.data.isRunning) {
      this.pauseTimer()
    } else {
      this.startTimer()
    }
  },
  
  stopAlarmSound: function() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval)
      this.alarmInterval = null
    }
  },

  playAlarmSound: function() {
    var that = this
    try {
      wx.vibrateLong({
        success: function() {},
        fail: function() {}
      })
      
      var beepCount = 0
      that.alarmInterval = setInterval(function() {
        try {
          var ctx = wx.createWebAudioContext()
          var oscillator = ctx.createOscillator()
          var gainNode = ctx.createGain()
          oscillator.connect(gainNode)
          gainNode.connect(ctx.destination)
          oscillator.type = 'sine'
          oscillator.frequency.setValueAtTime(880, ctx.currentTime)
          gainNode.gain.setValueAtTime(0.6, ctx.currentTime)
          oscillator.start(ctx.currentTime)
          oscillator.stop(ctx.currentTime + 0.3)
        } catch (err) {
          console.error('生成蜂鸣声失败:', err)
        }
        
        beepCount++
        if (beepCount >= 15) {
          that.stopAlarmSound()
        }
      }, 500)
    } catch (e) {
      console.error('播放提示音失败:', e)
    }
  },

  playCompleteSound: function() {
    try {
      if (!this.completeAudioCtx) {
        this.completeAudioCtx = wx.createInnerAudioContext()
        this.completeAudioCtx.src = '/audio/yay.mp3'
        this.completeAudioCtx.volume = 1.0
      }
      this.completeAudioCtx.stop()
      this.completeAudioCtx.seek(0)
      this.completeAudioCtx.play()
    } catch (e) {
      console.error('播放完成音失败:', e)
    }
  },

  startTimer: function() {
    var that = this
    that.setData({ isRunning: true })
    
    that.data.timer = {
      interval: setInterval(function() {
        var newTime = that.data.timeLeft - 1
        
        if (newTime <= 0) {
          that.playAlarmSound()
          that.data.timer.isAutoCompleted = true
          that.completeTimer()
          return
        }
        
        var progress = ((that.data.totalTime - newTime) / that.data.totalTime) * 100
        
        that.setData({
          timeLeft: newTime,
          formattedTime: that.formatTime(newTime),
          progress: progress
        })
      }, 1000),
      isAutoCompleted: false
    }
  },
  
  pauseTimer: function() {
    this.stopTimer()
    this.stopAlarmSound()
    this.setData({ isRunning: false })
  },
  
  stopTimer: function() {
    if (this.data.timer) {
      clearInterval(this.data.timer.interval)
      this.data.timer = null
    }
  },
  
  resetTimer: function() {
    this.stopTimer()
    this.stopAlarmSound()
    var modeConfig = this.modes[this.data.currentMode]
    
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
    if (this.data.timer) {
      this.data.timer.isAutoCompleted = false
    }
    this.completeTimer()
  },

  completeAndGoBack: async function() {
    var that = this
    that.playCompleteSound()
    wx.showLoading({ title: '正在完成...', mask: true })
    try {
      await that.completeTimer(true)
    } catch (err) {
      console.error('完成番茄钟出错:', err)
    } finally {
      wx.hideLoading()
    }
    setTimeout(function() {
      wx.navigateBack()
    }, 500)
  },

  goToHistory: function() {
    wx.navigateTo({
      url: '/pages/pomodoro-history/pomodoro-history'
    })
  },

  // 根据类型获取任务名称
  getTaskName: function(mode, taskInfo) {
    if (mode === 'pomodoro') {
      return taskInfo ? taskInfo.title : '专注时间'
    } else if (mode === 'shortBreak') {
      return '短休息'
    } else if (mode === 'longBreak') {
      return '长休息'
    }
    return '专注时间'
  },
  
  // 根据秒数计算分钟数（至少1分钟）
  getDurationMinutes: function(seconds) {
    var minutes = Math.round(seconds / 60)
    return minutes < 1 ? 1 : minutes
  },
  
  completeTimer: async function(isUserCompleted) {
    var that = this
    var timerData = that.data.timer
    that.stopTimer()
    
    var modeConfig = that.modes[that.data.currentMode]
    var now = new Date()
    var timeStr = (now.getHours() < 10 ? '0' + now.getHours() : now.getHours()) + ':' + (now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes())
    
    var isAutoCompleted = isUserCompleted === true ? false : (timerData ? timerData.isAutoCompleted : true)
    var currentMode = that.data.currentMode
    
    if (isAutoCompleted) {
      // 计时器自动完成：保存记录但积分=0，不调用打卡奖励
      var historyItem = {
        scheduleId: that.data.scheduleId,
        taskName: that.getTaskName(currentMode, that.data.taskInfo),
        duration: that.getDurationMinutes(modeConfig.duration),
        completed: currentMode === 'pomodoro',
        type: currentMode,
        points: 0,
        startTime: timeStr,
        endTime: timeStr
      }
      
      var memberName = that.data.memberName || that.getCurrentMemberName()
      var saveResult = await app.savePomodoroHistory(historyItem, memberName)
      if (saveResult.success) {
        console.log('自动完成记录已保存，类型:', currentMode)
      }
      
      if (currentMode === 'pomodoro') {
        wx.showToast({
          title: '⏰ 计时完成',
          icon: 'none',
          duration: 2000
        })
      } else {
        wx.showToast({
          title: '休息时间结束',
          icon: 'none',
          duration: 2000
        })
      }
      
      await app.loadFamilyMembers()
      that.loadStats()
      that.autoSwitchMode()
    } else {
      // 用户点击完成
      if (currentMode !== 'pomodoro') {
        wx.showToast({
          title: '休息时间结束',
          icon: 'none'
        })
        that.autoSwitchMode()
        return
      }
      
      var taskScheduleId = that.data.scheduleId
      var taskMemberName = that.data.memberName
      var taskPoints = that.data.taskPoints
      var taskTitle = that.data.taskInfo ? that.data.taskInfo.title : '专注时间'
      
      console.log('点击完成 - 任务信息:', {
        scheduleId: taskScheduleId,
        memberName: taskMemberName,
        taskPoints: taskPoints,
        taskTitle: taskTitle
      })
      
      if (!taskMemberName) {
        taskMemberName = that.getCurrentMemberName()
      }
      
      console.log('点击完成 - 最终成员名:', taskMemberName)
      
      // 获取日期字符串 - 优先使用从周计划传递的日期
      var dateStr
      if (that.data.taskInfo && that.data.taskInfo.date) {
        dateStr = that.data.taskInfo.date
        console.log('使用周计划传递的日期:', dateStr)
      } else {
        var now = new Date()
        dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0')
        console.log('使用当前日期:', dateStr)
      }
      
      // 先完成任务（如果有任务信息）- 使用每日完成记录
      var taskCompleted = false
      if (taskScheduleId && taskMemberName) {
        console.log('开始调用 updateDailyCompletion 完成任务')
        var taskResult = await app.updateDailyCompletion(taskScheduleId, dateStr, taskMemberName, true)
        taskCompleted = taskResult.success
        console.log('任务完成结果:', taskResult)
      } else {
        console.log('跳过任务完成: scheduleId或memberName为空')
      }
      
      // 保存番茄钟记录
      var historyItem = {
        scheduleId: taskScheduleId,
        taskName: taskTitle,
        duration: that.getDurationMinutes(modeConfig.duration),
        completed: true,
        type: 'pomodoro',
        points: 0,
        startTime: timeStr,
        endTime: timeStr
      }
      
      var totalBonus = 0
      var checkInResult = null
      var saveResult = await app.savePomodoroHistory(historyItem, taskMemberName)
      if (saveResult.success && saveResult.rewards) {
        checkInResult = saveResult.rewards
        totalBonus = checkInResult.awardedPoints || 0
      }
      
      // 清空任务状态
      that.setData({
        hasTask: false,
        scheduleId: null,
        memberName: '',
        taskPoints: 0,
        taskInfo: null,
        timerLabel: '专注时间'
      })
      
      var toastTitle = '🎉 专注完成！'
      if (totalBonus > 0) {
        var rewardDetails = []
        if (checkInResult && checkInResult.rewards) {
          for (var j = 0; j < checkInResult.rewards.length; j++) {
            var r = checkInResult.rewards[j]
            if (r.ruleName && r.points > 0) {
              rewardDetails.push(r.ruleName + '+' + r.points)
            }
          }
        }
        if (rewardDetails.length > 0) {
          toastTitle = '🎉 专注完成！' + rewardDetails.join(' ')
        } else {
          toastTitle = '🎉 专注完成！+' + totalBonus + '心愿'
        }
      }
      
      wx.showToast({
        title: toastTitle,
        icon: 'success',
        duration: 2000
      })
      
      await app.loadFamilyMembers()
      that.loadStats()
      that.autoSwitchMode()
    }
  },

  getCurrentMemberName: function() {
    var userInfo = app.globalData.userInfo || {}
    var family = app.globalData.familyMembers
    
    var members = []
    if (family && Array.isArray(family.members)) {
      members = family.members
    } else if (family && Array.isArray(family)) {
      members = family
    }
    
    var phone = userInfo.phone
    if (phone) {
      for (var k = 0; k < members.length; k++) {
        if (members[k].phone === phone) {
          return members[k].name
        }
      }
    }
    
    if (userInfo.role) {
      for (var l = 0; l < members.length; l++) {
        if (members[l].role === userInfo.role) {
          return members[l].name
        }
      }
    }
    
    for (var m = 0; m < members.length; m++) {
      if (members[m].isCurrentUser) {
        return members[m].name
      }
    }
    
    return ''
  },
  
  completeTask: async function() {
    var that = this
    var scheduleId = that.data.scheduleId
    var memberName = that.data.memberName
    var taskPoints = that.data.taskPoints
    
    console.log('完成任务:', scheduleId, memberName, taskPoints)
    
    if (!scheduleId) {
      console.error('scheduleId 为空，无法完成任务')
      return
    }
    
    // 获取当前日期字符串
    var now = new Date()
    var dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0')
    
    // 使用每日完成记录完成任务
    var result = await app.updateDailyCompletion(scheduleId, dateStr, memberName, true)
    
    if (!result.success) {
      console.error('完成任务失败:', result.message)
      return
    }
    
    if (taskPoints > 0 && memberName) {
      wx.showToast({
        title: '任务完成！+' + taskPoints + '心愿',
        icon: 'success',
        duration: 2000
      })
    }
    
    that.setData({
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
        formattedTime: this.formatTime(this.modes.shortBreak.duration),
        progress: 0
      })
    } else {
      this.setData({
        currentMode: 'pomodoro',
        timeLeft: this.modes.pomodoro.duration,
        totalTime: this.modes.pomodoro.duration,
        timerLabel: '专注时间',
        formattedTime: this.formatTime(this.modes.pomodoro.duration),
        progress: 0
      })
    }
  }
})
