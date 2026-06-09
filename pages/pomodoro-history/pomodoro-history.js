const app = getApp()

Page({
  data: {
    history: [],
    timeOptions: [
      { label: '今天', value: 'today' },
      { label: '全部', value: 'all' },
      { label: '近一周', value: 'week' },
      { label: '近一个月', value: 'month' },
      { label: '近半年', value: 'halfYear' }
    ],
    typeOptions: [
      { label: '全部', value: 'all' },
      { label: '专注', value: 'pomodoro' },
      { label: '短休息', value: 'shortBreak' },
      { label: '长休息', value: 'longBreak' }
    ],
    memberOptions: [
      { label: '全部', value: 'all' }
    ],
    selectedTime: 'today',
    selectedType: 'all',
    selectedMember: 'all',
    selectedTimeIndex: 0,
    selectedTypeIndex: 0,
    selectedMemberIndex: 0,
    filteredHistory: [],
    displayedHistory: [],
    totalPomodoros: 0,
    totalMinutes: 0,
    totalPoints: 0,
    pageSize: 10,
    currentPage: 1,
    hasMore: false,
    loadingMore: false
  },

  onShow: function() {
    if (!app.checkLogin()) return
    this.loadData()
  },

  onReachBottom: function() {
    var that = this
    if (that.data.loadingMore) return
    if (!that.data.hasMore) return
    that.loadMore()
  },

  loadData: async function() {
    wx.showLoading({ title: '加载中...' })

    try {
      await app.loadPomodoroHistory()
      await app.loadFamilyMembers()
      var rawHistory = app.globalData.pomodoroHistory || []
      var formatted = this.formatHistory(rawHistory)

      var userInfo = app.globalData.userInfo || {}
      var userRole = userInfo.role || 'child'
      var currentMemberName = ''

      var familyMembers = (app.globalData.familyMembers && app.globalData.familyMembers.members) || []
      var childMembers = familyMembers.filter(function(m) {
        return m.role === 'child'
      })

      if (userRole === 'child') {
        var currentMember = null
        
        var phone = userInfo.phone
        if (phone) {
          currentMember = familyMembers.find(function(m) {
            return m.phone === phone && m.role === 'child'
          })
        }
        
        if (!currentMember && userInfo.role) {
          currentMember = familyMembers.find(function(m) {
            return m.role === userInfo.role
          })
        }
        
        if (!currentMember) {
          currentMember = familyMembers.find(function(m) {
            return m.isCurrentUser && m.role === 'child'
          })
        }
        
        currentMemberName = currentMember ? currentMember.name : (userInfo.nickname || '')
        
        var memberOptions = []
        if (currentMemberName) {
          memberOptions.push({ label: currentMemberName, value: currentMemberName })
        }

        this.setData({
          history: formatted,
          memberOptions: memberOptions,
          selectedMember: currentMemberName,
          selectedMemberIndex: 0
        })
      } else {
        var memberOptions = [
          { label: '全部', value: 'all' }
        ]
        for (var i = 0; i < childMembers.length; i++) {
          memberOptions.push({ label: childMembers[i].name, value: childMembers[i].name })
        }

        this.setData({
          history: formatted,
          memberOptions: memberOptions
        })
      }

      this.applyFilters()
    } catch (error) {
      console.error('加载番茄钟记录错误:', error)
    }

    wx.hideLoading()
  },

  formatHistory: function(history) {
    return history.map(function(item) {
      var dateStr = ''
      if (item.createdAt) {
        var d = new Date(item.createdAt)
        var year = d.getFullYear()
        var month = (d.getMonth() + 1 < 10 ? '0' + (d.getMonth() + 1) : d.getMonth() + 1)
        var day = (d.getDate() < 10 ? '0' + d.getDate() : d.getDate())
        dateStr = year + '-' + month + '-' + day
      }

      var displayName = ''
      if (item.type === 'pomodoro') {
        displayName = item.taskName || '专注时间'
      } else if (item.type === 'shortBreak') {
        displayName = '短休息'
      } else if (item.type === 'longBreak') {
        displayName = '长休息'
      } else {
        displayName = item.taskName || '专注时间'
      }

      return {
        id: item._id || item.id || Date.now() + Math.random(),
        type: item.type || 'pomodoro',
        taskName: item.taskName || '',
        displayName: displayName,
        memberName: item.memberName || '',
        duration: item.duration || 0,
        completed: item.completed !== undefined ? item.completed : true,
        points: item.points || 0,
        startTime: item.startTime || '',
        endTime: item.endTime || '',
        createdAt: item.createdAt || new Date(),
        dateStr: dateStr
      }
    }).sort(function(a, b) {
      var timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      var timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return timeB - timeA
    })
  },

  onTimeChange: function(e) {
    var index = e.detail.value
    var option = this.data.timeOptions[index]
    this.setData({
      selectedTimeIndex: index,
      selectedTime: option.value,
      currentPage: 1
    })
    this.applyFilters()
  },

  onTypeChange: function(e) {
    var index = e.detail.value
    var option = this.data.typeOptions[index]
    this.setData({
      selectedTypeIndex: index,
      selectedType: option.value,
      currentPage: 1
    })
    this.applyFilters()
  },

  onMemberChange: function(e) {
    var index = e.detail.value
    var option = this.data.memberOptions[index]
    this.setData({
      selectedMemberIndex: index,
      selectedMember: option.value,
      currentPage: 1
    })
    this.applyFilters()
  },

  loadMore: function() {
    var that = this
    that.setData({ loadingMore: true })

    var nextPage = that.data.currentPage + 1
    var endIndex = nextPage * that.data.pageSize
    var newItems = that.data.filteredHistory.slice(0, endIndex)

    var more = endIndex < that.data.filteredHistory.length

    setTimeout(function() {
      that.setData({
        displayedHistory: newItems,
        currentPage: nextPage,
        hasMore: more,
        loadingMore: false
      })
    }, 300)
  },

  applyFilters: function() {
    var that = this
    var history = that.data.history
    var selectedTime = that.data.selectedTime
    var selectedType = that.data.selectedType
    var selectedMember = that.data.selectedMember
    var pageSize = that.data.pageSize

    var now = new Date()
    var startTime = null
    var isToday = false
    if (selectedTime === 'today') {
      var todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      startTime = todayStart
      isToday = true
    } else if (selectedTime === 'week') {
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (selectedTime === 'month') {
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (selectedTime === 'halfYear') {
      startTime = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
    }

    var filtered = history.filter(function(item) {
      if (startTime) {
        var itemTime = item.createdAt ? new Date(item.createdAt) : null
        if (!itemTime || itemTime < startTime) {
          return false
        }
        if (isToday) {
          var itemDay = new Date(itemTime)
          var today2 = new Date()
          if (itemDay.getFullYear() !== today2.getFullYear() ||
              itemDay.getMonth() !== today2.getMonth() ||
              itemDay.getDate() !== today2.getDate()) {
            return false
          }
        }
      }
      if (selectedType !== 'all') {
        if (item.type !== selectedType) {
          return false
        }
      }
      if (selectedMember !== 'all') {
        if (item.memberName !== selectedMember) {
          return false
        }
      }
      return true
    })

    var totalPomodoros = 0
    var totalMinutes = 0
    var totalPoints = 0
    for (var i = 0; i < filtered.length; i++) {
      var item = filtered[i]
      if (item.type === 'pomodoro') {
        totalPomodoros++
        totalMinutes += item.duration || 0
        totalPoints += item.points || 0
      }
    }

    var displayed = filtered.slice(0, pageSize)
    var hasMore = filtered.length > pageSize

    that.setData({
      filteredHistory: filtered,
      displayedHistory: displayed,
      totalPomodoros: totalPomodoros,
      totalMinutes: totalMinutes,
      totalPoints: totalPoints,
      currentPage: 1,
      hasMore: hasMore
    })
  }
})
