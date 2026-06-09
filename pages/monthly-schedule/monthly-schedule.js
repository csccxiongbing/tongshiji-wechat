const app = getApp()

Page({
  data: {
    currentYear: 2026,
    currentMonth: 5,
    selectedDate: null,
    selectedDateStr: '',
    weekHeaders: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    monthSchedules: {},
    selectedDaySchedules: [],
    totalSchedules: 0,
    completedSchedules: 0,
    completionRate: 0
  },
  
  onLoad: function() {
    const now = new Date()
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    })
    this.generateCalendar()
  },
  
  onShow: function() {
    if (!app.checkLogin()) return
    this.generateCalendar()
    this.updateTabBar()
  },
  
  updateTabBar: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentIndex: 1
      })
    }
  },
  
  generateCalendar: function() {
    const year = this.data.currentYear
    const month = this.data.currentMonth
    
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const today = new Date()
    
    const startDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    const prevMonth = new Date(year, month - 1, 0)
    const daysInPrevMonth = prevMonth.getDate()
    
    const calendarDays = []
    let total = 0
    let completed = 0
    
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      calendarDays.push({
        day: day,
        isCurrentMonth: false,
        isToday: false,
        dateStr: '',
        schedules: []
      })
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month}-${day}`
      const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day
      
      const daySchedules = this.getMockDaySchedules(month, day)
      
      calendarDays.push({
        day: day,
        isCurrentMonth: true,
        isToday: isToday,
        selected: false,
        dateStr: dateStr,
        schedules: daySchedules
      })
      
      total += daySchedules.length
      daySchedules.forEach(s => {
        if (s.completed) completed++
      })
    }
    
    const remaining = 42 - calendarDays.length
    for (let day = 1; day <= remaining; day++) {
      calendarDays.push({
        day: day,
        isCurrentMonth: false,
        isToday: false,
        dateStr: '',
        schedules: []
      })
    }
    
    let selectedDate = this.data.selectedDate
    if (!selectedDate) {
      selectedDate = today.getDate()
      this.setData({
        selectedDate: selectedDate,
        selectedDateStr: `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
      })
    }
    
    calendarDays.forEach(d => {
      if (d.isCurrentMonth && d.day === selectedDate) {
        d.selected = true
      }
    })
    
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0
    
    this.setData({
      calendarDays: calendarDays,
      totalSchedules: total,
      completedSchedules: completed,
      completionRate: rate
    })
    
    this.updateSelectedDaySchedules()
  },
  
  getMockDaySchedules: function(month, day) {
    const mockData = {
      '2026-5-29': [
        { id: 1, title: '起床', time: '07:00', icon: '🌅', color: '#FFE4B5', completed: true },
        { id: 2, title: '早餐', time: '08:00', icon: '🥪', color: '#FFB5B5', completed: true },
        { id: 3, title: '数学作业', time: '15:00', icon: '📐', color: '#D4B5FF', completed: false }
      ],
      '2026-5-30': [
        { id: 4, title: '游泳课', time: '10:00', icon: '🏊', color: '#B5E3FF', completed: false }
      ]
    }
    
    return mockData[`${this.data.currentYear}-${month}-${day}`] || []
  },
  
  prevMonth: function() {
    let year = this.data.currentYear
    let month = this.data.currentMonth - 1
    
    if (month < 1) {
      month = 12
      year--
    }
    
    this.setData({
      currentYear: year,
      currentMonth: month,
      selectedDate: null
    })
    
    this.generateCalendar()
  },
  
  nextMonth: function() {
    let year = this.data.currentYear
    let month = this.data.currentMonth + 1
    
    if (month > 12) {
      month = 1
      year++
    }
    
    this.setData({
      currentYear: year,
      currentMonth: month,
      selectedDate: null
    })
    
    this.generateCalendar()
  },
  
  selectDate: function(e) {
    const dateStr = e.currentTarget.dataset.date
    if (!dateStr) return
    
    const parts = dateStr.split('-')
    const day = parseInt(parts[2])
    
    const calendarDays = this.data.calendarDays.map(d => ({
      ...d,
      selected: d.isCurrentMonth && d.day === day
    }))
    
    this.setData({
      calendarDays: calendarDays,
      selectedDate: day,
      selectedDateStr: dateStr
    })
    
    this.updateSelectedDaySchedules()
  },
  
  updateSelectedDaySchedules: function() {
    const calendarDays = this.data.calendarDays
    const selected = calendarDays.find(d => d.selected)
    
    this.setData({
      selectedDaySchedules: selected ? selected.schedules : []
    })
  },
  
  toggleSchedule: function(e) {
    const index = e.currentTarget.dataset.index
    const schedules = [...this.data.selectedDaySchedules]
    schedules[index].completed = !schedules[index].completed
    
    const calendarDays = this.data.calendarDays.map(d => {
      if (d.selected) {
        return { ...d, schedules: schedules }
      }
      return d
    })
    
    let completed = 0
    calendarDays.forEach(d => {
      d.schedules.forEach(s => {
        if (s.completed) completed++
      })
    })
    
    const rate = this.data.totalSchedules > 0 ? Math.round((completed / this.data.totalSchedules) * 100) : 0
    
    this.setData({
      selectedDaySchedules: schedules,
      calendarDays: calendarDays,
      completedSchedules: completed,
      completionRate: rate
    })
  },
  
  goToAddSchedule: function() {
    wx.navigateTo({
      url: '/pages/addSchedule/addSchedule'
    })
  }
})