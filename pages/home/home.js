const app = getApp()

Page({
  data: {
    weekday: '',
    date: '',
    greeting: '',
    nickname: '',
    todaySchedules: [],
    displaySchedules: [],
    familyMembers: [],
    selectedMember: 'all',
    selectedMemberText: '家庭成员',
    completedCount: 0,
    progress: 0,
    showMemberPicker: false,
    selectedMembers: [],
    isChildRole: false,
    currentMemberName: ''
  },
  
  onShow: function() {
    this.initData()
    this.updateTabBar()
  },
  
  updateTabBar: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentIndex: 0
      })
    }
  },
  
  initData: function() {
    const now = new Date()
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    
    const userInfo = app.globalData.userInfo || {}
    const isChild = userInfo.role === 'child'
    
    const currentMemberName = this.findCurrentMemberName(userInfo)
    console.log('当前用户在家庭中的角色名称:', currentMemberName)
    
    this.setData({
      weekday: weekdays[now.getDay()],
      date: `${now.getMonth() + 1}月${now.getDate()}日`,
      greeting: this.getGreeting(),
      nickname: userInfo.nickname || '小朋友',
      isChildRole: isChild,
      currentMemberName: currentMemberName
    })
    
    this.loadFamilyMembers()
    this.loadSchedules()
  },
  
  findCurrentMemberName: function(userInfo) {
    if (!userInfo) return ''
    
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
    
    const currentMember = members.find(m => m.isCurrentUser)
    if (currentMember) return currentMember.name
    
    const phone = userInfo.phone
    if (phone) {
      const phoneMatch = members.find(m => m.phone === phone)
      if (phoneMatch) return phoneMatch.name
    }
    
    if (userInfo.role === 'child') {
      const childMember = members.find(m => m.role === 'child')
      if (childMember) return childMember.name
    }
    
    return userInfo.role === 'child' ? '小明' : ''
  },
  
  getGreeting: function() {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 12) return '早上好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  },
  
  loadSchedules: function() {
    const schedules = (app.globalData.schedules && app.globalData.schedules.length > 0) ? app.globalData.schedules : [
      { 
        id: 1, title: '早餐时间', time: '07:30', startTime: '2026-06-02 07:30', endTime: '2026-06-02 08:00',
        icon: '🍞', color: '#FFE4B5', completed: true,
        scheduleMembers: ['爸爸', '妈妈', '小明'], completedBy: ['爸爸', '妈妈', '小明'],
        points: 10, repeatRule: 'daily', repeatRuleText: '每天',
        remindEnabled: true, remindMembers: ['妈妈'], remindMembersText: '妈妈', note: '记得吃蔬菜哦！'
      },
      { 
        id: 2, title: '上学', time: '08:30', startTime: '2026-06-02 08:30', endTime: '2026-06-02 16:00',
        icon: '🎒', color: '#B5E3FF', completed: true,
        scheduleMembers: ['小明'], completedBy: ['小明'],
        points: 20, repeatRule: 'weekday', repeatRuleText: '工作日',
        remindEnabled: true, remindMembers: ['妈妈'], remindMembersText: '妈妈', note: '带好课本和作业'
      },
      { 
        id: 3, title: '午餐', time: '12:00', startTime: '2026-06-02 12:00', endTime: '2026-06-02 12:30',
        icon: '🍱', color: '#FFB5B5', completed: false,
        scheduleMembers: ['爸爸', '妈妈', '小明'], completedBy: [],
        points: 10, repeatRule: 'daily', repeatRuleText: '每天',
        remindEnabled: false, remindMembers: [], remindMembersText: '', note: ''
      },
      { 
        id: 4, title: '做作业', time: '15:30', startTime: '2026-06-02 15:30', endTime: '2026-06-02 17:00',
        icon: '📝', color: '#D4B5FF', completed: false,
        scheduleMembers: ['小明'], completedBy: [],
        points: 30, repeatRule: 'weekly', repeatRuleText: '每周',
        remindEnabled: true, remindMembers: ['爸爸', '妈妈'], remindMembersText: '爸妈', note: '数学和语文作业'
      },
      { 
        id: 5, title: '晚餐', time: '18:00', startTime: '2026-06-02 18:00', endTime: '2026-06-02 18:30',
        icon: '🍲', color: '#B5FFD9', completed: false,
        scheduleMembers: ['爸爸', '妈妈', '小明'], completedBy: [],
        points: 10, repeatRule: 'daily', repeatRuleText: '每天',
        remindEnabled: true, remindMembers: ['小明'], remindMembersText: '小明', note: ''
      },
      { 
        id: 6, title: '睡前故事', time: '20:30', startTime: '2026-06-02 20:30', endTime: '2026-06-02 21:00',
        icon: '📚', color: '#FFE4FF', completed: false,
        scheduleMembers: ['妈妈', '小明'], completedBy: [],
        points: 15, repeatRule: 'never', repeatRuleText: '',
        remindEnabled: true, remindMembers: ['妈妈'], remindMembersText: '妈妈', note: '今天讲白雪公主'
      }
    ]
    
    const now = new Date()
    const todayWeekday = now.getDay()
    const currentMemberName = this.data.currentMemberName
    const isChild = this.data.isChildRole

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

    let todaySchedules = schedules.filter(schedule => {
      if (!schedule.startTime && !schedule.endTime) return true

      let startInRange = true
      let endInRange = true

      if (schedule.startTime) {
        const startDate = new Date(schedule.startTime.replace(/-/g, '/'))
        startInRange = startDate >= todayStart
      }

      if (schedule.endTime) {
        const endDate = new Date(schedule.endTime.replace(/-/g, '/'))
        endInRange = endDate <= todayEnd
      }

      return startInRange && endInRange
    })
    
    // 如果是孩子角色，只显示任务成员中包含当前孩子的任务
    if (isChild && currentMemberName) {
      todaySchedules = todaySchedules.filter(schedule => {
        return schedule.scheduleMembers && schedule.scheduleMembers.includes(currentMemberName)
      })
    }
    
    const getWeekDay = (dateStr) => {
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      const date = new Date(dateStr.replace(/-/g, '/'))
      return weekdays[date.getDay()]
    }
    
    const extractTime = (datetimeStr) => {
      if (!datetimeStr) return ''
      const match = datetimeStr.match(/(\d{2}:\d{2})(:\d{2})?/)
      return match ? match[1] : datetimeStr
    }
    
    const getMemberStatus = (schedule) => {
      const members = schedule.scheduleMembers || []
      const completedBy = schedule.completedBy || []
      
      if (isChild && currentMemberName) {
        if (members.includes(currentMemberName)) {
          return [{
            name: currentMemberName,
            completed: completedBy.includes(currentMemberName)
          }]
        }
        return []
      }
      
      return members.map(name => ({
        name: name,
        completed: completedBy.includes(name)
      }))
    }
    
    const formattedSchedules = todaySchedules.map(s => ({
      ...s,
      time: s.time || s.startTime || '00:00',
      formattedStartTime: extractTime(s.startTime),
      formattedEndTime: extractTime(s.endTime),
      weekDay: s.startTime ? getWeekDay(s.startTime) : ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][todayWeekday],
      memberStatus: getMemberStatus(s)
    }))
    
    const sortedSchedules = formattedSchedules.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      return 0
    })
    
    this.setData({
      todaySchedules: sortedSchedules
    })
    
    this.filterSchedules()
  },
  
  formatDate: function(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  
  loadFamilyMembers: function() {
    let family = app.globalData.familyMembers
    let members = []
    
    if (family && Array.isArray(family.members)) {
      members = family.members
    } else if (family && Array.isArray(family)) {
      members = family
    } else {
      members = [
        { name: '爸爸', role: 'parent' },
        { name: '妈妈', role: 'parent' },
        { name: '小明', role: 'child' }
      ]
    }
    
    // 默认全选，孩子角色也全选以支持筛选
    const membersWithState = members.map(m => ({
      ...m,
      isSelected: true
    }))
    const selectedMembers = members.map(m => m.name)
    
    this.setData({
      familyMembers: membersWithState,
      selectedMembers: selectedMembers
    }, () => {
      this.filterSchedules()
    })
  },
  
  filterSchedules: function() {
    const { todaySchedules, selectedMembers } = this.data
    let filteredSchedules = todaySchedules
    
    // 所有角色都支持通过成员筛选
    if (selectedMembers.length > 0) {
      filteredSchedules = todaySchedules.filter(schedule => {
        return schedule.scheduleMembers && schedule.scheduleMembers.some(m => selectedMembers.includes(m))
      })
    }
    
    const completedCount = filteredSchedules.filter(s => s.completed).length
    const progress = filteredSchedules.length > 0 ? Math.round((completedCount / filteredSchedules.length) * 100) : 0
    
    this.setData({
      displaySchedules: filteredSchedules,
      completedCount: completedCount,
      progress: progress
    })
  },
  
  toggleMemberPicker: function() {
    this.setData({
      showMemberPicker: !this.data.showMemberPicker
    })
  },
  
  toggleMember: function(e) {
    const member = e.currentTarget.dataset.member
    const index = e.currentTarget.dataset.index
    
    const updatedFamilyMembers = this.data.familyMembers.map((m, i) => {
      if (i === index || m.name === member) {
        return {
          ...m,
          isSelected: !m.isSelected
        }
      }
      return m
    })
    
    let selectedMembers = [...this.data.selectedMembers]
    const selectedIndex = selectedMembers.indexOf(member)
    if (selectedIndex > -1) {
      selectedMembers.splice(selectedIndex, 1)
    } else {
      selectedMembers.push(member)
    }
    
    this.setData({
      familyMembers: updatedFamilyMembers,
      selectedMembers: selectedMembers
    }, () => {
      this.filterSchedules()
    })
  },
  
  toggleSelectAll: function() {
    const { familyMembers, selectedMembers } = this.data
    const allMemberNames = familyMembers.map(m => m.name)
    
    let updatedFamilyMembers = []
    let newSelectedMembers = []
    
    if (selectedMembers.length === allMemberNames.length) {
      updatedFamilyMembers = familyMembers.map(m => ({
        ...m,
        isSelected: false
      }))
      newSelectedMembers = []
    } else {
      updatedFamilyMembers = familyMembers.map(m => ({
        ...m,
        isSelected: true
      }))
      newSelectedMembers = allMemberNames
    }
    
    this.setData({
      familyMembers: updatedFamilyMembers,
      selectedMembers: newSelectedMembers
    }, () => {
      this.filterSchedules()
    })
  },
  
  toggleMemberComplete: function(e) {
    const scheduleId = parseInt(e.currentTarget.dataset.id)
    const memberName = e.currentTarget.dataset.member

    let earnedPoints = 0
    
    const todaySchedules = this.data.todaySchedules.map(s => {
      if (s.id === scheduleId) {
        let completedBy = s.completedBy || []
        const isCompleted = completedBy.includes(memberName)
        
        if (isCompleted) {
          completedBy = completedBy.filter(m => m !== memberName)
          if (s.points && s.points > 0) {
            app.addPoints(-s.points, `取消完成"${s.title}"任务`, memberName)
          }
        } else {
          completedBy = [...completedBy, memberName]
          if (s.points && s.points > 0) {
            app.addPoints(s.points, `完成"${s.title}"任务`, memberName)
            earnedPoints = s.points
          }
        }
        
        const allCompleted = this.checkAllCompleted(s.scheduleMembers, completedBy)
        
        const memberStatus = (s.scheduleMembers || []).map(name => ({
          name: name,
          completed: completedBy.includes(name)
        }))
        
        return { 
          ...s, 
          completedBy: completedBy,
          completed: allCompleted,
          memberStatus: memberStatus
        }
      }
      return s
    })

    this.setData({
      todaySchedules: todaySchedules
    })

    if (earnedPoints > 0) {
      this.showPointsEffect(earnedPoints, memberName, scheduleId)
    }

    this.filterSchedules()
    app.saveSchedules(todaySchedules)
  },
  
  showPointsEffect: function(points, memberName, scheduleId) {
    this.triggerFireworks(scheduleId, memberName)
    this.showMiniPointsPopup(scheduleId, memberName, points)
    this.playPointsSound()
  },
  
  showMiniPointsPopup: function(scheduleId, memberName, points) {
    this.setData({
      showPointsPopup: true,
      pointsPopupText: `⭐ +${points}`,
      pointsScheduleId: scheduleId,
      pointsPopupMember: memberName
    })
    
    setTimeout(() => {
      this.setData({
        showPointsPopup: false,
        pointsPopupText: '',
        pointsScheduleId: null,
        pointsPopupMember: ''
      })
    }, 1000)
  },
  
  triggerFireworks: function(scheduleId, memberName) {
    const todaySchedules = this.data.todaySchedules.map(s => {
      if (s.id === scheduleId) {
        const memberStatus = (s.memberStatus || []).map(ms => ({
          ...ms,
          showFireworks: ms.name === memberName ? true : false
        }))
        
        return {
          ...s,
          memberStatus: memberStatus
        }
      }
      return s
    })
    
    this.setData({
      todaySchedules: todaySchedules
    })
    
    setTimeout(() => {
      const resetSchedules = this.data.todaySchedules.map(s => ({
        ...s,
        memberStatus: (s.memberStatus || []).map(ms => ({
          ...ms,
          showFireworks: false
        }))
      }))
      
      this.setData({
        todaySchedules: resetSchedules
      })
    }, 1000)
  },
  
  playPointsSound: function() {
    try {
      const audio = wx.createInnerAudioContext()
      audio.src = '/audio/point.mp3'
      audio.play()
      audio.onEnded(() => {
        audio.destroy()
      })
      audio.onError((err) => {
        console.error('播放音效失败:', err)
        audio.destroy()
      })
    } catch (e) {
      console.error('播放音效失败:', e)
    }
  },
  
  checkAllCompleted: function(members, completedBy) {
    if (!members || members.length === 0) return false
    if (!completedBy || completedBy.length === 0) return false
    return members.every(member => completedBy.includes(member))
  },
  
  viewScheduleDetail: function(e) {
    const scheduleId = parseInt(e.currentTarget.dataset.id)
    wx.navigateTo({
      url: `/pages/scheduleDetail/scheduleDetail?id=${scheduleId}`
    })
  },
  
  startPomodoro: function(e) {
    const scheduleId = parseInt(e.currentTarget.dataset.id)
    const memberName = e.currentTarget.dataset.member
    const points = parseInt(e.currentTarget.dataset.points) || 0
    
    const schedules = app.globalData.schedules || []
    const schedule = schedules.find(s => s.id === scheduleId)
    
    app.globalData.pomodoroTaskInfo = {
      scheduleId: scheduleId,
      memberName: memberName,
      points: points,
      taskInfo: schedule
    }
    
    wx.switchTab({
      url: '/pages/pomodoro/pomodoro'
    })
  },
  
  goToAddSchedule: function() {
    wx.navigateTo({
      url: '/pages/addSchedule/addSchedule'
    })
  }
})
