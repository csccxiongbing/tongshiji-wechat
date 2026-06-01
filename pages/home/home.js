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
    selectedMembers: []
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
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    
    this.setData({
      weekday: weekdays[now.getDay()],
      date: `${now.getMonth() + 1}月${now.getDate()}日`,
      greeting: this.getGreeting(),
      nickname: app.globalData.userInfo?.nickname || '小朋友'
    })
    
    // 先加载家庭成员，再加载日程
    this.loadFamilyMembers()
    this.loadSchedules()
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
    const schedules = app.globalData.schedules || [
      { 
        id: 1, 
        title: '早餐时间', 
        time: '07:30', 
        startTime: '2026-06-01 07:30', 
        endTime: '2026-06-01 08:00', 
        icon: '🍞', 
        color: '#FFE4B5', 
        completed: true, 
        scheduleMembers: ['爸爸', '妈妈', '小明'], 
        points: 10,
        repeatRule: 'daily',
        repeatRuleText: '每天',
        remindEnabled: true,
        remindMembers: ['妈妈'],
        remindMembersText: '妈妈',
        note: '记得吃蔬菜哦！'
      },
      { 
        id: 2, 
        title: '上学', 
        time: '08:30', 
        startTime: '2026-06-01 08:30', 
        endTime: '2026-06-01 16:00', 
        icon: '🎒', 
        color: '#B5E3FF', 
        completed: true, 
        scheduleMembers: ['小明'], 
        points: 20,
        repeatRule: 'weekday',
        repeatRuleText: '工作日',
        remindEnabled: true,
        remindMembers: ['妈妈'],
        remindMembersText: '妈妈',
        note: '带好课本和作业'
      },
      { 
        id: 3, 
        title: '午餐', 
        time: '12:00', 
        startTime: '2026-06-01 12:00', 
        endTime: '2026-06-01 12:30', 
        icon: '🍱', 
        color: '#FFB5B5', 
        completed: false, 
        scheduleMembers: ['爸爸', '妈妈', '小明'], 
        points: 10,
        repeatRule: 'daily',
        repeatRuleText: '每天',
        remindEnabled: false,
        remindMembers: [],
        remindMembersText: '',
        note: ''
      },
      { 
        id: 4, 
        title: '做作业', 
        time: '15:30', 
        startTime: '2026-06-01 15:30', 
        endTime: '2026-06-01 17:00', 
        icon: '📝', 
        color: '#D4B5FF', 
        completed: false, 
        scheduleMembers: ['小明'], 
        points: 30,
        repeatRule: 'weekly',
        repeatRuleText: '每周',
        remindEnabled: true,
        remindMembers: ['爸爸', '妈妈'],
        remindMembersText: '爸妈',
        note: '数学和语文作业'
      },
      { 
        id: 5, 
        title: '晚餐', 
        time: '18:00', 
        startTime: '2026-06-01 18:00', 
        endTime: '2026-06-01 18:30', 
        icon: '🍲', 
        color: '#B5FFD9', 
        completed: false, 
        scheduleMembers: ['爸爸', '妈妈', '小明'], 
        points: 10,
        repeatRule: 'daily',
        repeatRuleText: '每天',
        remindEnabled: true,
        remindMembers: ['小明'],
        remindMembersText: '小明',
        note: ''
      },
      { 
        id: 6, 
        title: '睡前故事', 
        time: '20:30', 
        startTime: '2026-06-01 20:30', 
        endTime: '2026-06-01 21:00', 
        icon: '📚', 
        color: '#FFE4FF', 
        completed: false, 
        scheduleMembers: ['妈妈', '小明'], 
        points: 15,
        repeatRule: 'never',
        repeatRuleText: '',
        remindEnabled: true,
        remindMembers: ['妈妈'],
        remindMembersText: '妈妈',
        note: '今天讲白雪公主'
      }
    ]
    
    // 确保每个日程都有 time 字段（兼容旧数据）
    const formattedSchedules = schedules.map(s => ({
      ...s,
      time: s.time || s.startTime || '00:00'
    }))
    
    this.setData({
      todaySchedules: formattedSchedules
    })
    
    this.filterSchedules()
  },
  
  loadFamilyMembers: function() {
    let family = app.globalData.familyMembers
    let members = []
    
    console.log('=== 开始加载家庭成员 ===')
    console.log('原始 family 数据:', family)
    
    // 兼容两种数据结构：{ members: [...] } 或者直接是 [...]
    if (family && Array.isArray(family.members)) {
      members = family.members
      console.log('使用 members 数组:', members)
    } else if (family && Array.isArray(family)) {
      members = family
      console.log('直接使用数组:', members)
    } else {
      // 默认数据
      members = [
        { name: '爸爸', role: 'parent' },
        { name: '妈妈', role: 'parent' },
        { name: '小明', role: 'child' }
      ]
      console.log('使用默认数据:', members)
    }
    
    // 给每个成员添加选中状态，默认全选
    const membersWithState = members.map(m => ({
      ...m,
      isSelected: true
    }))
    
    // 默认全选
    const selectedMembers = members.map(m => m.name)
    console.log('即将设置的数据 - familyMembers:', membersWithState)
    console.log('即将设置的数据 - selectedMembers:', selectedMembers)
    
    this.setData({
      familyMembers: membersWithState,
      selectedMembers: selectedMembers
    }, () => {
      console.log('setData 完成！')
      console.log('当前页面数据:', this.data)
      // 加载完成员后重新筛选日程
      this.filterSchedules()
    })
  },
  
  filterSchedules: function() {
    const { todaySchedules, selectedMembers } = this.data
    let filteredSchedules = todaySchedules
    
    // 只选择已勾选成员的日程
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
    console.log('点击成员:', member, '索引:', index)
    console.log('当前选中列表:', this.data.selectedMembers)
    console.log('当前 familyMembers:', this.data.familyMembers)
    
    // 更新成员对象中的 isSelected 状态
    const updatedFamilyMembers = this.data.familyMembers.map((m, i) => {
      if (i === index || m.name === member) {
        return {
          ...m,
          isSelected: !m.isSelected
        }
      }
      return m
    })
    
    // 更新 selectedMembers 数组
    let selectedMembers = [...this.data.selectedMembers]
    const selectedIndex = selectedMembers.indexOf(member)
    if (selectedIndex > -1) {
      selectedMembers.splice(selectedIndex, 1)
      console.log('取消选中:', member)
    } else {
      selectedMembers.push(member)
      console.log('添加选中:', member)
    }
    
    console.log('更新后的选中列表:', selectedMembers)
    console.log('更新后的 familyMembers:', updatedFamilyMembers)
    
    this.setData({
      familyMembers: updatedFamilyMembers,
      selectedMembers: selectedMembers
    }, () => {
      console.log('toggleMember setData 完成')
      this.filterSchedules()
    })
  },
  
  toggleSelectAll: function() {
    const { familyMembers, selectedMembers } = this.data
    const allMemberNames = familyMembers.map(m => m.name)
    
    console.log('全选按钮点击')
    console.log('当前选中长度:', selectedMembers.length)
    console.log('总成员数量:', allMemberNames.length)
    
    let updatedFamilyMembers = []
    let newSelectedMembers = []
    
    if (selectedMembers.length === allMemberNames.length) {
      // 如果已经全选，取消全选
      console.log('取消全选')
      updatedFamilyMembers = familyMembers.map(m => ({
        ...m,
        isSelected: false
      }))
      newSelectedMembers = []
    } else {
      // 否则全选
      console.log('全选所有成员:', allMemberNames)
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
      console.log('toggleSelectAll setData 完成')
      console.log('更新后的 familyMembers:', updatedFamilyMembers)
      this.filterSchedules()
    })
  },
  
  toggleSchedule: function(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const scheduleId = parseInt(e.currentTarget.dataset.id)
    
    const todaySchedules = this.data.todaySchedules.map(s => {
      if (s.id === scheduleId) {
        return { ...s, completed: !s.completed }
      }
      return s
    })
    
    this.setData({
      todaySchedules: todaySchedules
    })
    
    this.filterSchedules()
    app.saveSchedules(todaySchedules)
  },
  
  viewScheduleDetail: function(e) {
    const scheduleId = parseInt(e.currentTarget.dataset.id)
    console.log('查看日程详情:', scheduleId)
    
    wx.navigateTo({
      url: `/pages/scheduleDetail/scheduleDetail?id=${scheduleId}`
    })
  },
  
  goToAddSchedule: function() {
    wx.navigateTo({
      url: '/pages/addSchedule/addSchedule'
    })
  }
})