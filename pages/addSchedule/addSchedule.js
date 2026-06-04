const app = getApp()

Page({
  data: {
    title: '',
    date: '',
    dateWeekDay: '',
    startTime: '',
    endDate: '',
    endDateWeekDay: '',
    endTime: '',
    selectedIcon: '📝',
    selectedColor: '#D4B5FF',
    note: '',
    points: '0',
    pointsEditable: true,  // 积分是否可编辑
    repeatRule: 'never',
    repeatRuleText: '永不',
    endRepeat: 'never',
    endRepeatText: '永不',
    endRepeatDate: '',
    remindEnabled: false,
    remindMembers: [],
    remindTime: '15',
    remindTimeText: '提前15分钟',
    familyMembers: [],
    scheduleMembers: [],
    scheduleMemberList: [],  // 带选中状态的成员列表
    remindMemberList: [],    // 提醒角色带选中状态
    isAllSelected: false,
    icons: [
      { icon: '🍞', color: '#FFE4B5' },
      { icon: '🎒', color: '#B5E3FF' },
      { icon: '🍱', color: '#FFB5B5' },
      { icon: '📝', color: '#D4B5FF' },
      { icon: '🍲', color: '#B5FFD9' },
      { icon: '📚', color: '#FFE4FF' },
      { icon: '🏃', color: '#FFE4B5' },
      { icon: '🎨', color: '#FFE4FF' },
      { icon: '🎹', color: '#FFE4B5' },
      { icon: '🏊', color: '#B5E3FF' },
      { icon: '🍳', color: '#FFB5B5' },
      { icon: '🎬', color: '#D4B5FF' }
    ]
  },
  
  getWeekDay: function(dateStr) {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const date = new Date(dateStr)
    return weekDays[date.getDay()]
  },
  
  onLoad: function() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    const weekDay = this.getWeekDay(dateStr)
    
    const familyMembers = app.globalData.familyMembers?.members || []
    const members = familyMembers.map(m => ({ name: m.name, role: m.role }))
    const selectedNames = members.map(m => m.name)
    
    // 初始化带选中状态的成员列表
    const scheduleMemberList = members.map(m => ({
      name: m.name,
      selected: true
    }))
    const remindMemberList = members.map(m => ({
      name: m.name,
      selected: true
    }))
    
    // 检查当前用户角色，如果是孩子则积分默认5分且不可编辑
    const userInfo = app.globalData.userInfo || {}
    const isChildRole = userInfo.role === 'child'
    
    this.setData({
      date: dateStr,
      dateWeekDay: weekDay,
      endDate: dateStr,
      endDateWeekDay: weekDay,
      familyMembers: members,
      scheduleMembers: selectedNames,
      remindMembers: selectedNames,
      scheduleMemberList: scheduleMemberList,
      remindMemberList: remindMemberList,
      isAllSelected: true,
      points: isChildRole ? '5' : '0',
      pointsEditable: !isChildRole
    })
  },
  
  goBack: function() {
    wx.navigateBack()
  },
  
  onTitleInput: function(e) {
    this.setData({
      title: e.detail.value
    })
  },
  
  onDateChange: function(e) {
    const date = e.detail.value
    this.setData({
      date: date,
      dateWeekDay: this.getWeekDay(date)
    })
  },
  
  onStartTimeChange: function(e) {
    this.setData({
      startTime: e.detail.value
    })
  },
  
  onEndDateChange: function(e) {
    const endDate = e.detail.value
    this.setData({
      endDate: endDate,
      endDateWeekDay: this.getWeekDay(endDate)
    })
  },
  
  onEndTimeChange: function(e) {
    this.setData({
      endTime: e.detail.value
    })
  },
  
  selectIcon: function(e) {
    const icon = e.currentTarget.dataset.icon
    const color = e.currentTarget.dataset.color
    this.setData({
      selectedIcon: icon,
      selectedColor: color
    })
  },
  
  onPointsInput: function(e) {
    // 如果积分不可编辑，不允许修改
    if (!this.data.pointsEditable) {
      wx.showToast({
        title: '积分奖励由家长设置',
        icon: 'none'
      })
      return
    }
    this.setData({
      points: e.detail.value
    })
  },
  
  onNoteInput: function(e) {
    this.setData({
      note: e.detail.value
    })
  },
  
  showRepeatRule: function() {
    const rules = [
      { value: 'never', text: '永不' },
      { value: 'daily', text: '每天' },
      { value: 'weekly', text: '每周' },
      { value: 'yearly', text: '每年' },
      { value: 'weekday', text: '工作日' }
    ]
    
    wx.showActionSheet({
      itemList: rules.map(r => r.text),
      success: (res) => {
        const selected = rules[res.tapIndex]
        this.setData({
          repeatRule: selected.value,
          repeatRuleText: selected.text,
          endRepeat: 'never',
          endRepeatText: '永不'
        })
      }
    })
  },
  
  showEndRepeat: function() {
    const options = [
      { value: 'never', text: '永不' },
      { value: 'date', text: '指定日期' }
    ]
    
    wx.showActionSheet({
      itemList: options.map(o => o.text),
      success: (res) => {
        const selected = options[res.tapIndex]
        this.setData({
          endRepeat: selected.value,
          endRepeatText: selected.text
        })
      }
    })
  },
  
  onEndRepeatDateChange: function(e) {
    this.setData({
      endRepeatDate: e.detail.value
    })
  },
  
  onRemindToggle: function(e) {
    this.setData({
      remindEnabled: e.detail.value
    })
  },
  
  toggleScheduleMember: function(e) {
    const index = e.currentTarget.dataset.index
    const scheduleMemberList = this.data.scheduleMemberList.map((item, i) => {
      if (i === index) {
        return { name: item.name, selected: !item.selected }
      }
      return item
    })
    
    const scheduleMembers = scheduleMemberList.filter(item => item.selected).map(item => item.name)
    const isAllSelected = scheduleMembers.length === this.data.familyMembers.length
    
    this.setData({
      scheduleMemberList: scheduleMemberList,
      scheduleMembers: scheduleMembers,
      isAllSelected: isAllSelected
    })
  },
  
  toggleSelectAll: function() {
    if (this.data.isAllSelected) {
      const scheduleMemberList = this.data.familyMembers.map(m => ({
        name: m.name,
        selected: false
      }))
      this.setData({
        scheduleMemberList: scheduleMemberList,
        scheduleMembers: [],
        isAllSelected: false
      })
    } else {
      const scheduleMemberList = this.data.familyMembers.map(m => ({
        name: m.name,
        selected: true
      }))
      this.setData({
        scheduleMemberList: scheduleMemberList,
        scheduleMembers: this.data.familyMembers.map(m => m.name),
        isAllSelected: true
      })
    }
  },
  
  toggleRemindMember: function(e) {
    const index = e.currentTarget.dataset.index
    const remindMemberList = this.data.remindMemberList.map((item, i) => {
      if (i === index) {
        return { name: item.name, selected: !item.selected }
      }
      return item
    })
    
    const remindMembers = remindMemberList.filter(item => item.selected).map(item => item.name)
    
    this.setData({
      remindMemberList: remindMemberList,
      remindMembers: remindMembers
    })
  },
  
  showRemindTime: function() {
    const times = [
      { value: '0', text: '准时提醒' },
      { value: '5', text: '提前5分钟' },
      { value: '10', text: '提前10分钟' },
      { value: '15', text: '提前15分钟' },
      { value: '30', text: '提前30分钟' },
      { value: '60', text: '提前1小时' }
    ]
    
    wx.showActionSheet({
      itemList: times.map(t => t.text),
      success: (res) => {
        const selected = times[res.tapIndex]
        this.setData({
          remindTime: selected.value,
          remindTimeText: selected.text
        })
      }
    })
  },
  
  saveSchedule: async function() {
    if (!this.data.title) {
      wx.showToast({
        title: '请输入日程名称',
        icon: 'none'
      })
      return
    }
    
    if (!this.data.date || !this.data.startTime) {
      wx.showToast({
        title: '请选择开始时间',
        icon: 'none'
      })
      return
    }
    
    if (!this.data.endDate || !this.data.endTime) {
      wx.showToast({
        title: '请选择结束时间',
        icon: 'none'
      })
      return
    }
    
    if (this.data.repeatRule !== 'never' && this.data.endRepeat === 'date' && !this.data.endRepeatDate) {
      wx.showToast({
        title: '请选择结束日期',
        icon: 'none'
      })
      return
    }
    
    if (this.data.scheduleMembers.length === 0) {
      wx.showToast({
        title: '请至少选择一个日程成员',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    const scheduleData = {
      title: this.data.title,
      time: this.data.startTime,
      startTime: `${this.data.date} ${this.data.startTime}`,
      endTime: `${this.data.endDate} ${this.data.endTime}`,
      icon: this.data.selectedIcon,
      color: this.data.selectedColor,
      note: this.data.note,
      points: parseInt(this.data.points) || 0,
      completed: false,
      completedBy: [],
      repeatRule: this.data.repeatRule,
      repeatRuleText: this.data.repeatRule === 'daily' ? '每天' : 
                     this.data.repeatRule === 'weekly' ? '每周' :
                     this.data.repeatRule === 'weekday' ? '工作日' : '',
      endRepeat: this.data.endRepeat,
      endRepeatDate: this.data.endRepeatDate,
      remindEnabled: this.data.remindEnabled,
      remindMembers: this.data.remindMembers,
      remindMembersText: this.data.remindMembers.join('、'),
      remindTime: parseInt(this.data.remindTime) || 0,
      scheduleMembers: this.data.scheduleMembers
    }
    
    const result = await app.addSchedule(scheduleData)
    
    wx.hideLoading()
    
    if (!result.success) {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
      return
    }
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    })
    
    this.clearForm()
    
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },
  
  clearForm: function() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const familyMembers = app.globalData.familyMembers?.members || []
    const members = familyMembers.map(m => m.name)
    
    const scheduleMemberList = familyMembers.map(m => ({
      name: m.name,
      selected: true
    }))
    const remindMemberList = familyMembers.map(m => ({
      name: m.name,
      selected: true
    }))
    
    // 检查当前用户角色，如果是孩子则积分默认5分且不可编辑
    const userInfo = app.globalData.userInfo || {}
    const isChildRole = userInfo.role === 'child'
    
    this.setData({
      title: '',
      date: dateStr,
      startTime: '',
      endDate: dateStr,
      endTime: '',
      selectedIcon: '📝',
      selectedColor: '#D4B5FF',
      note: '',
      points: isChildRole ? '5' : '0',
      pointsEditable: !isChildRole,
      repeatRule: 'never',
      repeatRuleText: '永不',
      endRepeat: 'never',
      endRepeatText: '永不',
      endRepeatDate: '',
      remindEnabled: false,
      remindMembers: members,
      remindMemberList: remindMemberList,
      remindTime: '15',
      remindTimeText: '提前15分钟',
      scheduleMembers: members,
      scheduleMemberList: scheduleMemberList,
      isAllSelected: true
    })
  }
})
