const app = getApp()

Page({
  data: {
    currentYear: 2026,
    currentMonth: 5,
    selectedDay: 0,
    weekDays: [],
    daySchedules: [],
    weekSchedules: {},
    selectedDayName: '周日',
    totalSchedules: 14,
    completedSchedules: 3,
    avgCompletion: 21
  },
  
  onShow: function() {
    this.initWeekDays()
    this.initSchedules()
    this.updateTabBar()
  },
  
  updateTabBar: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentIndex: 2
      })
    }
  },
  
  initWeekDays: function() {
    const now = new Date()
    const today = now.getDate()
    const dayOfWeek = now.getDay()
    
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const weekDays = []
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    
    for (let i = 0; i < 7; i++) {
      const diff = i - dayOfWeek
      const date = new Date(now)
      date.setDate(today + diff)
      
      weekDays.push({
        name: weekdays[i],
        date: date.getDate(),
        fullDate: `${date.getMonth() + 1}-${date.getDate()}`,
        hasSchedule: true
      })
    }
    
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      weekDays: weekDays,
      selectedDay: dayOfWeek,
      selectedDayName: dayNames[dayOfWeek]
    })
  },
  
  initSchedules: function() {
    const weekSchedules = {
      '0': [
        { id: 1, title: '周日公园游玩', time: '09:00', icon: '🏞️', color: '#B5FFD9', completed: true },
        { id: 2, title: '家庭聚餐', time: '12:00', icon: '🍽️', color: '#FFE4B5', completed: false }
      ],
      '1': [
        { id: 3, title: '上学', time: '08:30', icon: '🎒', color: '#B5E3FF', completed: true },
        { id: 4, title: '数学作业', time: '16:00', icon: '📐', color: '#D4B5FF', completed: false }
      ],
      '2': [
        { id: 5, title: '上学', time: '08:30', icon: '🎒', color: '#B5E3FF', completed: true },
        { id: 6, title: '英语课', time: '17:00', icon: '🔤', color: '#FFB5B5', completed: false }
      ],
      '3': [
        { id: 7, title: '上学', time: '08:30', icon: '🎒', color: '#B5E3FF', completed: false },
        { id: 8, title: '画画', time: '15:30', icon: '🎨', color: '#FFE4FF', completed: false }
      ],
      '4': [
        { id: 9, title: '上学', time: '08:30', icon: '🎒', color: '#B5E3FF', completed: false },
        { id: 10, title: '游泳课', time: '16:30', icon: '🏊', color: '#B5E3FF', completed: false }
      ],
      '5': [
        { id: 11, title: '上学', time: '08:30', icon: '🎒', color: '#B5E3FF', completed: false },
        { id: 12, title: '钢琴课', time: '14:00', icon: '🎹', color: '#FFE4B5', completed: false }
      ],
      '6': [
        { id: 13, title: '周末早餐', time: '09:00', icon: '🍳', color: '#FFB5B5', completed: false },
        { id: 14, title: '看电影', time: '15:00', icon: '🎬', color: '#D4B5FF', completed: false }
      ]
    }
    
    const day = this.data.selectedDay
    this.setData({
      weekSchedules: weekSchedules,
      daySchedules: weekSchedules[day] || [],
      totalSchedules: 14,
      completedSchedules: 3,
      avgCompletion: 21
    })
  },
  
  selectDay: function(e) {
    const day = parseInt(e.currentTarget.dataset.day)
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const schedules = this.data.weekSchedules[day] || []
    
    let completed = 0
    schedules.forEach(s => {
      if (s.completed) completed++
    })
    
    this.setData({
      selectedDay: day,
      selectedDayName: dayNames[day],
      daySchedules: schedules,
      completedSchedules: completed
    })
  },
  
  toggleSchedule: function(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const day = this.data.selectedDay
    const schedules = [...this.data.daySchedules]
    schedules[index].completed = !schedules[index].completed
    
    const weekSchedules = {...this.data.weekSchedules}
    weekSchedules[day] = schedules
    
    let completed = 0
    schedules.forEach(s => {
      if (s.completed) completed++
    })
    
    let totalCompleted = 0
    Object.values(weekSchedules).forEach(daySchedules => {
      daySchedules.forEach(s => {
        if (s.completed) totalCompleted++
      })
    })
    
    this.setData({
      daySchedules: schedules,
      weekSchedules: weekSchedules,
      completedSchedules: completed,
      totalSchedules: totalCompleted + (14 - Object.values(weekSchedules).reduce((acc, s) => acc + s.length, 0)),
      avgCompletion: Math.round((totalCompleted / 14) * 100)
    })
  },
  
  goToAddSchedule: function() {
    wx.navigateTo({
      url: '/pages/addSchedule/addSchedule'
    })
  }
})