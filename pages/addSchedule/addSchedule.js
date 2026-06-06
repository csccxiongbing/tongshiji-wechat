const app = getApp()

Page({
  data: {
    editId: null,  // 编辑模式的任务ID
    isEditMode: false,  // 是否是编辑模式
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
  
  onLoad: function(options) {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    const weekDay = this.getWeekDay(dateStr)
    
    const familyMembers = app.globalData.familyMembers?.members || []
    const members = familyMembers.map(m => ({ name: m.name, role: m.role }))
    
    // 初始化带选中状态的成员列表，默认不勾选
    const scheduleMemberList = members.map(m => ({
      name: m.name,
      selected: false
    }))
    const remindMemberList = members.map(m => ({
      name: m.name,
      selected: false
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
      scheduleMembers: [],
      remindMembers: [],
      scheduleMemberList: scheduleMemberList,
      remindMemberList: remindMemberList,
      isAllSelected: false,
      points: isChildRole ? '5' : '0',
      pointsEditable: !isChildRole
    })
    
    // 如果传入了id，则是编辑模式
    if (options.id) {
      this.loadScheduleForEdit(options.id)
    }
  },
  
  loadScheduleForEdit: function(scheduleId) {
    const schedules = app.globalData.schedules || []
    const schedule = schedules.find(s => 
      s.id === scheduleId || 
      s._id === scheduleId ||
      String(s.id) === scheduleId ||
      String(s._id) === scheduleId
    )
    
    if (!schedule) {
      wx.showToast({
        title: '未找到该任务',
        icon: 'none'
      })
      return
    }
    
    console.log('加载编辑任务:', schedule)
    
    // 解析开始时间和结束时间
    let date = this.getTodayStr()
    let startTime = '09:00'
    let endDate = this.getTodayStr()
    let endTime = '10:00'
    
    if (schedule.startTime) {
      const startParts = schedule.startTime.split(' ')
      if (startParts.length >= 2) {
        date = startParts[0]
        startTime = startParts[1]
      }
    }
    
    if (schedule.endTime) {
      const endParts = schedule.endTime.split(' ')
      if (endParts.length >= 2) {
        endDate = endParts[0]
        endTime = endParts[1]
      }
    }
    
    // 更新成员选中状态
    const scheduleMemberList = this.data.familyMembers.map(m => ({
      name: m.name,
      selected: (schedule.scheduleMembers || []).includes(m.name)
    }))
    
    const remindMemberList = this.data.familyMembers.map(m => ({
      name: m.name,
      selected: (schedule.remindMembers || []).includes(m.name)
    }))
    
    this.setData({
      editId: scheduleId,
      isEditMode: true,
      title: schedule.title || '',
      date: date,
      dateWeekDay: this.getWeekDay(date),
      startTime: startTime,
      endDate: endDate,
      endDateWeekDay: this.getWeekDay(endDate),
      endTime: endTime,
      selectedIcon: schedule.icon || '📝',
      selectedColor: schedule.color || '#D4B5FF',
      note: schedule.note || '',
      points: String(schedule.points || 0),
      repeatRule: schedule.repeatRule || 'never',
      repeatRuleText: this.getRepeatRuleText(schedule.repeatRule),
      endRepeat: schedule.endRepeat || 'never',
      endRepeatText: schedule.endRepeat === 'date' ? '指定日期' : '永不',
      endRepeatDate: schedule.endRepeatDate || '',
      remindEnabled: schedule.remindEnabled || false,
      remindMembers: schedule.remindMembers || [],
      remindTime: String(schedule.remindTime || 15),
      remindTimeText: this.getRemindTimeText(schedule.remindTime || 15),
      scheduleMembers: schedule.scheduleMembers || [],
      scheduleMemberList: scheduleMemberList,
      remindMemberList: remindMemberList,
      isAllSelected: scheduleMemberList.every(m => m.selected)
    })
  },
  
  getTodayStr: function() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  
  getRepeatRuleText: function(rule) {
    switch(rule) {
      case 'daily': return '每天'
      case 'weekly': return '每周'
      case 'weekday': return '工作日'
      case 'yearly': return '每年'
      default: return '永不'
    }
  },
  
  getRemindTimeText: function(time) {
    switch(String(time)) {
      case '0': return '准时提醒'
      case '5': return '提前5分钟'
      case '10': return '提前10分钟'
      case '15': return '提前15分钟'
      case '30': return '提前30分钟'
      case '60': return '提前1小时'
      default: return '提前15分钟'
    }
  },

  goBack: function() {
    wx.navigateBack()
  },
  
  onTitleInput: function(e) {
    const title = e.detail.value
    // 根据日程名称自动推荐图标
    const icon = this.getIconByName(title)
    
    this.setData({
      title: title,
      selectedIcon: icon.icon,
      selectedColor: icon.color
    })
  },
  
  // 根据日程名称自动推荐图标
  getIconByName: function(name) {
    if (!name) {
      return { icon: '📝', color: '#D4B5FF' }
    }
    
    const lowerName = name.toLowerCase()
    const iconMap = {
      // 学习相关
      '学习': { icon: '📚', color: '#FFE4B5' },
      '上学': { icon: '🏫', color: '#B5E3FF' },
      '放学': { icon: '🏫', color: '#FFB5B5' },
      '作业': { icon: '📝', color: '#D4B5FF' },
      '考试': { icon: '📝', color: '#B5FFD9' },
      '数学': { icon: '➕', color: '#FFE4FF' },
      '语文': { icon: '📖', color: '#FFE4B5' },
      '英语': { icon: '🇬🇧', color: '#B5E3FF' },
      '阅读': { icon: '📖', color: '#FFE4FF' },
      '读书': { icon: '📚', color: '#FFE4FF' },
      
      // 运动相关
      '运动': { icon: '🏃', color: '#FFE4B5' },
      '跑步': { icon: '🏃', color: '#FFE4B5' },
      '游泳': { icon: '🏊', color: '#B5E3FF' },
      '足球': { icon: '⚽', color: '#FFE4B5' },
      '篮球': { icon: '🏀', color: '#FFB5B5' },
      '跳绳': { icon: '🪢', color: '#FFE4FF' },
      '锻炼': { icon: '💪', color: '#FFE4B5' },
      '体育': { icon: '⚽', color: '#FFE4B5' },
      
      // 生活相关
      '吃饭': { icon: '🍽️', color: '#FFE4B5' },
      '早餐': { icon: '🍳', color: '#FFE4B5' },
      '午餐': { icon: '🍱', color: '#FFB5B5' },
      '晚餐': { icon: '🍲', color: '#D4B5FF' },
      '睡觉': { icon: '😴', color: '#B5E3FF' },
      '起床': { icon: '⏰', color: '#FFE4B5' },
      '刷牙': { icon: '🪥', color: '#B5FFD9' },
      '洗手': { icon: '🧼', color: '#B5E3FF' },
      '洗澡': { icon: '🚿', color: '#B5E3FF' },
      
      // 娱乐相关
      '游戏': { icon: '🎮', color: '#FFE4B5' },
      '玩具': { icon: '🧸', color: '#FFE4FF' },
      '看电视': { icon: '📺', color: '#B5E3FF' },
      '电影': { icon: '🎬', color: '#D4B5FF' },
      '画画': { icon: '🎨', color: '#FFE4FF' },
      '音乐': { icon: '🎵', color: '#FFE4B5' },
      '跳舞': { icon: '💃', color: '#FFE4FF' },
      '唱歌': { icon: '🎤', color: '#FFE4B5' },
      '钢琴': { icon: '🎹', color: '#FFE4FF' },
      
      // 户外相关
      '户外': { icon: '🌳', color: '#B5FFD9' },
      '公园': { icon: '🏞️', color: '#B5FFD9' },
      '旅游': { icon: '✈️', color: '#B5E3FF' },
      '旅行': { icon: '✈️', color: '#B5E3FF' },
      '散步': { icon: '🚶', color: '#B5FFD9' },
      '骑车': { icon: '🚲', color: '#B5E3FF' },
      
      // 家务相关
      '家务': { icon: '🧹', color: '#FFE4B5' },
      '整理': { icon: '📦', color: '#D4B5FF' },
      '清洁': { icon: '🧹', color: '#B5E3FF' },
      '洗衣': { icon: '👕', color: '#B5E3FF' },
      '做饭': { icon: '🍳', color: '#FFE4B5' },
      
      // 其他
      '购物': { icon: '🛒', color: '#FFE4B5' },
      '牙医': { icon: '🦷', color: '#B5E3FF' },
      '医院': { icon: '🏥', color: '#FFB5B5' },
      '生日': { icon: '🎂', color: '#FFE4FF' },
      '聚会': { icon: '🎉', color: '#FFE4FF' },
      '上课': { icon: '📚', color: '#FFE4B5' },
      '下课': { icon: '🏃', color: '#B5E3FF' },
      '练习': { icon: '✏️', color: '#D4B5FF' },
      '预习': { icon: '📖', color: '#D4B5FF' },
      '复习': { icon: '📚', color: '#D4B5FF' }
    }
    
    // 遍历关键词映射，查找匹配
    for (const [keyword, iconInfo] of Object.entries(iconMap)) {
      if (lowerName.includes(keyword)) {
        return iconInfo
      }
    }
    
    // 默认图标
    return { icon: '📝', color: '#D4B5FF' }
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
    
    let result
    if (this.data.isEditMode && this.data.editId) {
      // 编辑模式
      result = await app.updateSchedule(this.data.editId, scheduleData)
    } else {
      // 新增模式
      result = await app.addSchedule(scheduleData)
    }
    
    wx.hideLoading()
    
    if (!result.success) {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
      return
    }
    
    wx.showToast({
      title: this.data.isEditMode ? '修改成功' : '添加成功',
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
    
    // 初始化带选中状态的成员列表，默认不勾选
    const scheduleMemberList = familyMembers.map(m => ({
      name: m.name,
      selected: false
    }))
    const remindMemberList = familyMembers.map(m => ({
      name: m.name,
      selected: false
    }))
    
    // 检查当前用户角色，如果是孩子则积分默认5分且不可编辑
    const userInfo = app.globalData.userInfo || {}
    const isChildRole = userInfo.role === 'child'
    
    this.setData({
      editId: null,
      isEditMode: false,
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
      remindMembers: [],
      remindMemberList: remindMemberList,
      remindTime: '15',
      remindTimeText: '提前15分钟',
      scheduleMembers: [],
      scheduleMemberList: scheduleMemberList,
      isAllSelected: false
    })
  }
})
