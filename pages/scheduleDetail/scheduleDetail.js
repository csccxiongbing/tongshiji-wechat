const app = getApp()

Page({
  data: {
    scheduleId: null,
    schedule: null
  },

  onLoad: function(options) {
    console.log('日程详情页面加载，参数:', options)
    
    if (options.id) {
      this.setData({
        scheduleId: parseInt(options.id)
      })
      this.loadScheduleDetail()
    }
  },

  loadScheduleDetail: function() {
    const { scheduleId } = this.data
    const schedules = app.globalData.schedules || []
    
    console.log('所有日程:', schedules)
    console.log('查找日程 ID:', scheduleId)
    
    const schedule = schedules.find(s => s.id === scheduleId)
    
    if (schedule) {
      console.log('找到日程:', schedule)
      const formattedSchedule = this.formatScheduleTime(schedule)
      this.setData({
        schedule: formattedSchedule
      })
    } else {
      console.log('未找到日程，使用默认数据')
      const defaultSchedule = {
        id: scheduleId,
        title: '日程详情',
        time: '00:00',
        startTime: '',
        endTime: '',
        icon: '📝',
        color: '#FFE4E1',
        completed: false,
        scheduleMembers: [],
        points: 0
      }
      this.setData({
        schedule: this.formatScheduleTime(defaultSchedule)
      })
    }
  },

  formatScheduleTime: function(schedule) {
    if (!schedule.startTime || !schedule.endTime) return schedule
    
    const result = { ...schedule }
    
    // 格式化开始时间
    const startParts = schedule.startTime.split(' ')
    if (startParts.length >= 2) {
      result.startDate = startParts[0]
      result.startTimeOnly = startParts[1]
    }
    
    // 格式化结束时间
    const endParts = schedule.endTime.split(' ')
    if (endParts.length >= 2) {
      result.endDate = endParts[0]
      result.endTimeOnly = endParts[1]
    }
    
    return result
  },

  toggleComplete: function() {
    const { schedule, scheduleId } = this.data
    if (!schedule) return
    
    const schedules = app.globalData.schedules || []
    const updatedSchedules = schedules.map(s => {
      if (s.id === scheduleId) {
        return { ...s, completed: !s.completed }
      }
      return s
    })
    
    app.saveSchedules(updatedSchedules)
    
    this.setData({
      'schedule.completed': !schedule.completed
    })
  },

  goBack: function() {
    wx.navigateBack()
  }
})
