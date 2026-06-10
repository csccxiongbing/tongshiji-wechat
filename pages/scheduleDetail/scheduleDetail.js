const app = getApp()

Page({
  data: {
    scheduleId: null,
    schedule: null,
    memberStatusList: [],
    dateStr: ''
  },

  onShow: function() {
    if (!app.checkLogin()) return
  },

  onLoad: function(options) {
    console.log('日程详情页面加载，参数:', options)
    
    if (options.id) {
      this.setData({
        scheduleId: options.id,
        dateStr: options.date || ''
      })
      this.loadScheduleDetail()
    }
  },

  loadScheduleDetail: async function() {
    const { scheduleId } = this.data
    const schedules = app.globalData.schedules || []
    
    console.log('所有日程:', schedules)
    console.log('查找日程 ID:', scheduleId)
    
    // 支持多种 id 匹配方式：数字 id、字符串 id、_id
    const schedule = schedules.find(s => 
      s.id === scheduleId || 
      s.id === String(scheduleId) || 
      s._id === scheduleId || 
      s._id === String(scheduleId)
    )
    
    if (schedule) {
      console.log('找到日程:', schedule)
      const formattedSchedule = this.formatScheduleTime(schedule)
      const memberStatusList = await this.getMemberStatusList(formattedSchedule)
      this.setData({
        schedule: formattedSchedule,
        memberStatusList: memberStatusList
      })
    } else {
      console.log('未找到日程，尝试从数据库加载')
      this.loadScheduleFromServer()
    }
  },
  
  getMemberStatusList: async function(schedule) {
    const members = schedule.scheduleMembers || []
    const { dateStr, scheduleId } = this.data
    
    console.log('getMemberStatusList - dateStr:', dateStr, 'scheduleId:', scheduleId)
    
    // 如果有日期参数，使用每日完成记录
    if (dateStr) {
      try {
        console.log('调用 getDailyCompletion - scheduleId:', scheduleId, 'dateStr:', dateStr)
        const result = await app.getDailyCompletion(scheduleId, dateStr)
        console.log('getDailyCompletion 返回:', result)
        if (result.success) {
          if (result.completion) {
            const completions = result.completion.completions || []
            console.log('完成记录:', completions)
            const completedNames = completions.map(c => c.memberName)
            console.log('已完成成员:', completedNames)
            return members.map(name => ({
              name: name,
              completed: completedNames.includes(name)
            }))
          } else {
            // 有日期但没有完成记录，说明当天没有人完成
            console.log('当天没有完成记录，返回空完成状态')
            return members.map(name => ({
              name: name,
              completed: false
            }))
          }
        }
      } catch (error) {
        console.error('获取完成记录错误:', error)
      }
    }
    
    // 否则使用旧的 completedBy
    console.log('使用旧的 completedBy:', schedule.completedBy)
    const completedBy = schedule.completedBy || []
    return members.map(name => ({
      name: name,
      completed: completedBy.includes(name)
    }))
  },

  loadScheduleFromServer: async function() {
    const { scheduleId } = this.data
    
    try {
      const result = await app.request({
        url: '/schedules/' + scheduleId,
        method: 'GET'
      })
      
      if (result.success && result.schedule) {
        console.log('从服务器获取日程:', result.schedule)
        const formattedSchedule = this.formatScheduleTime(result.schedule)
        const memberStatusList = await this.getMemberStatusList(formattedSchedule)
        this.setData({
          schedule: formattedSchedule,
          memberStatusList: memberStatusList
        })
      } else {
        console.log('服务器也未找到日程，使用默认数据')
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
          schedule: this.formatScheduleTime(defaultSchedule),
          memberStatusList: []
        })
      }
    } catch (error) {
      console.error('从服务器加载日程失败:', error)
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
        schedule: this.formatScheduleTime(defaultSchedule),
        memberStatusList: []
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

  goBack: function() {
    wx.navigateBack()
  }
})
