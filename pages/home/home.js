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
  
  onShow: async function() {
    if (!app.checkLogin()) return
    await this.initData()
    this.updateTabBar()
  },
  
  updateTabBar: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentIndex: 0
      })
    }
  },
  
  initData: async function() {
    const now = new Date()
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    
    const userInfo = app.globalData.userInfo || {}
    const isChild = userInfo.role === 'child'
    
    // 先加载家庭成员数据
    await this.loadFamilyMembers()
    
    const currentMemberName = this.findCurrentMemberName(userInfo)
    
    this.setData({
      weekday: weekdays[now.getDay()],
      date: `${now.getMonth() + 1}月${now.getDate()}日`,
      greeting: this.getGreeting(),
      nickname: userInfo.nickname || '小朋友',
      isChildRole: isChild,
      currentMemberName: currentMemberName
    })
    
    await this.loadSchedules()
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
  
  loadSchedules: async function() {
    const userInfo = app.globalData.userInfo || {}
    let schedules = []
    
    // 优先从后端API获取数据
    if (userInfo.familyId) {
      try {
        const result = await app.request({
          url: '/schedules/family/' + userInfo.familyId,
          method: 'GET'
        })
        
        if (result.success) {
          app.globalData.schedules = result.schedules
          wx.setStorageSync('schedules', result.schedules)
          schedules = result.schedules || []
        }
      } catch (error) {
        console.error('加载日程错误:', error)
      }
    }
    
    // 如果后端API获取失败，使用本地缓存
    if (schedules.length === 0) {
      schedules = (app.globalData.schedules && app.globalData.schedules.length > 0) ? app.globalData.schedules : []
    }
    
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
  
  loadFamilyMembers: async function() {
    const userInfo = app.globalData.userInfo || {}
    let members = []
    
    if (userInfo.familyId) {
      try {
        const result = await app.request({
          url: '/families/' + userInfo.familyId,
          method: 'GET'
        })
        
        if (result.success) {
          app.globalData.familyMembers = result.family
          wx.setStorageSync('familyMembers', result.family)
          members = result.family.members || []
        }
      } catch (error) {
        console.error('加载家庭成员错误:', error)
      }
    }
    
    // 如果没有从后端获取到数据，使用本地缓存
    if (members.length === 0) {
      let family = app.globalData.familyMembers
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
  
  toggleMemberComplete: async function(e) {
    const scheduleId = e.currentTarget.dataset.id
    const memberName = e.currentTarget.dataset.member
    
    console.log('toggleMemberComplete - scheduleId:', scheduleId, 'memberName:', memberName)
    
    // 容错处理：如果 scheduleId 不存在或为空
    if (!scheduleId) {
      console.error('scheduleId 为空，从 todaySchedules 中查找')
      // 尝试从数据中找到对应的 schedule
      const currentSchedules = this.data.todaySchedules || []
      if (currentSchedules.length > 0) {
        console.log('todaySchedules 样本:', currentSchedules[0])
      }
      return
    }
    
    const schedule = this.data.todaySchedules.find(s => s.id === scheduleId || s._id === scheduleId)
    if (!schedule) {
      console.error('未找到对应的 schedule, scheduleId:', scheduleId)
      return
    }
    
    const isCompleted = (schedule.completedBy || []).includes(memberName)
    
    // 如果已完成，则取消完成
    if (isCompleted) {
      const result = await app.uncompleteSchedule(scheduleId, memberName)
      
      if (!result.success) {
        wx.showToast({
          title: result.message,
          icon: 'none'
        })
        return
      }
      
      // 取消完成时扣除积分
      if (schedule.points && schedule.points > 0) {
        await app.subtractPoints(memberName, schedule.points, `取消完成"${schedule.title}"任务`)
        this.showMinusPointsEffect(schedule.points, memberName, scheduleId)
      }
      
      // 延迟刷新数据，让效果先展示
      setTimeout(() => {
        this.loadSchedules()
      }, 1000)
      return
    }
    
    // 如果未完成，则标记完成
    if (!isCompleted) {
      const result = await app.completeSchedule(scheduleId, memberName)
      
      if (!result.success) {
        wx.showToast({
          title: result.message,
          icon: 'none'
        })
        return
      }
      
      // 完成任务时添加积分，积分加到完成任务的成员角色
      if (schedule.points && schedule.points > 0) {
        await app.addPoints(memberName, schedule.points, `完成"${schedule.title}"任务`)
        this.showPointsEffect(schedule.points, memberName, scheduleId)
      }
      
      // 延迟刷新数据，让效果先展示
      setTimeout(() => {
        this.loadSchedules()
      }, 1000)
    }
  },
  
  showPointsEffect: function(points, memberName, scheduleId) {
    this.triggerFireworks(scheduleId, memberName)
    this.showMiniPointsPopup(scheduleId, memberName, points, true)
    this.playPointsSound()
  },
  
  showMinusPointsEffect: function(points, memberName, scheduleId) {
    this.showMiniPointsPopup(scheduleId, memberName, points, false)
  },
  
  showMiniPointsPopup: function(scheduleId, memberName, points, isAdd) {
    this.setData({
      showPointsPopup: true,
      pointsPopupText: isAdd ? `⭐ +${points}` : `⭐ -${points}`,
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
    
    const displaySchedules = this.data.displaySchedules.map(s => {
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
      todaySchedules: todaySchedules,
      displaySchedules: displaySchedules
    })
    
    setTimeout(() => {
      const resetTodaySchedules = this.data.todaySchedules.map(s => ({
        ...s,
        memberStatus: (s.memberStatus || []).map(ms => ({
          ...ms,
          showFireworks: false
        }))
      }))
      
      const resetDisplaySchedules = this.data.displaySchedules.map(s => ({
        ...s,
        memberStatus: (s.memberStatus || []).map(ms => ({
          ...ms,
          showFireworks: false
        }))
      }))
      
      this.setData({
        todaySchedules: resetTodaySchedules,
        displaySchedules: resetDisplaySchedules
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
    const scheduleId = e.currentTarget.dataset.id
    const userInfo = app.globalData.userInfo || {}
    const isChildRole = userInfo.role === 'child'
    
    if (isChildRole) {
      // 孩子角色跳转到详情页
      wx.navigateTo({
        url: `/pages/scheduleDetail/scheduleDetail?id=${scheduleId}`
      })
    } else {
      // 家长角色跳转到编辑页面
      wx.navigateTo({
        url: `/pages/addSchedule/addSchedule?id=${scheduleId}`
      })
    }
  },
  
  startPomodoro: function(e) {
    const scheduleId = e.currentTarget.dataset.id  // 保持原始字符串格式
    const memberName = e.currentTarget.dataset.member
    const points = parseInt(e.currentTarget.dataset.points) || 0
    
    const schedules = app.globalData.schedules || []
    const schedule = schedules.find(s => s.id === scheduleId || s._id === scheduleId)
    
    app.globalData.pomodoroTaskInfo = {
      scheduleId: scheduleId,
      memberName: memberName,
      points: points,
      taskInfo: schedule
    }
    
    wx.navigateTo({
      url: '/pages/pomodoro/pomodoro'
    })
  },
  
  goToAddSchedule: function() {
    wx.navigateTo({
      url: '/pages/addSchedule/addSchedule'
    })
  }
})
