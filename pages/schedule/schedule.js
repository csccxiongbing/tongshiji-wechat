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
    avgCompletion: 21,
    familyMembers: [],
    selectedMembers: [],
    showMemberPicker: false
  },
  
  onShow: function() {
    this.initWeekDays();
    this.loadFamilyMembers();
    this.initSchedules();
    this.updateTabBar();
  },
  
  updateTabBar: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const userInfo = app.globalData.userInfo
      const role = userInfo?.role || 'child'
      const currentIndex = role === 'parent' ? 1 : 2
      this.getTabBar().setData({
        currentIndex: currentIndex
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
        hasSchedule: false
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
    const schedules = app.globalData.schedules || [];
    
    // 初始化本周日期
    const now = new Date();
    const today = now.getDate();
    const dayOfWeek = now.getDay();
    
    const weekStart = new Date(now);
    weekStart.setDate(today - dayOfWeek);
    
    const weekDaysList = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      weekDaysList.push({
        index: i,
        date: date
      });
    }
    
    // 按星期几筛选日程
    const weekSchedules = {};
    weekDaysList.forEach(day => {
      const daySchedules = this.getSchedulesForDate(schedules, day.date);
      weekSchedules[day.index] = daySchedules;
    });
    
    // 更新 weekDays 中的 hasSchedule 标志（考虑成员筛选）
    const { selectedMembers } = this.data;
    const updatedWeekDays = this.data.weekDays.map((day, i) => {
      let daySchedules = weekSchedules[i] || [];
      
      // 如果有成员筛选，过滤出选中成员的日程
      if (selectedMembers.length > 0) {
        daySchedules = daySchedules.filter(schedule => {
          return schedule.scheduleMembers && schedule.scheduleMembers.some(m => selectedMembers.includes(m));
        });
      }
      
      return {
        ...day,
        hasSchedule: daySchedules.length > 0
      };
    });
    
    const day = this.data.selectedDay;
    this.setData({
      weekDays: updatedWeekDays,
      weekSchedules: weekSchedules
    });
    
    this.filterSchedules();
  },

  getSchedulesForDate: function(schedules, targetDate) {
    const targetDateStr = this.formatDate(targetDate);
    const targetWeekDay = targetDate.getDay();
    const targetTime = targetDate.getTime();
    
    const result = [];
    
    schedules.forEach(schedule => {
      let shouldShow = false;
      
      if (schedule.startTime) {
        const scheduleDate = new Date(schedule.startTime.replace(/-/g, '/'));
        const scheduleDateStr = this.formatDate(scheduleDate);
        const scheduleTime = scheduleDate.getTime();
        
        // 检查是否是当天
        if (scheduleDateStr === targetDateStr) {
          shouldShow = true;
        } else if (schedule.repeatRule && schedule.repeatRule !== 'never') {
          // 只有日程开始日期在目标日期之前或相等时，才考虑重复规则
          if (scheduleTime <= targetTime) {
            if (schedule.repeatRule === 'daily') {
              // 每日重复：只要开始日期在目标日期之前
              shouldShow = true;
            } else if (schedule.repeatRule === 'weekly') {
              // 每周重复：检查目标日期是否是日程开始日期的同一天（星期几）
              if (scheduleDate.getDay() === targetWeekDay) {
                shouldShow = true;
              }
            } else if (schedule.repeatRule === 'weekday') {
              // 工作日重复（周一到周五）
              if (targetWeekDay >= 1 && targetWeekDay <= 5) {
                shouldShow = true;
              }
            } else if (schedule.repeatRule === 'weekend') {
              // 周末重复（周六和周日）
              if (targetWeekDay === 0 || targetWeekDay === 6) {
                shouldShow = true;
              }
            }
          }
        }
      }
      
      if (shouldShow) {
        result.push({
          ...schedule,
          formattedStartTime: this.extractTime(schedule.startTime),
          formattedEndTime: this.extractTime(schedule.endTime),
          memberStatus: this.getMemberStatus(schedule)
        });
      }
    });
    
    // 排序：未完成的在前，已完成的在后
    return result.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return 0;
    });
  },

  formatDate: function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  extractTime: function(datetimeStr) {
    if (!datetimeStr) return '';
    const match = datetimeStr.match(/(\d{2}:\d{2})(:\d{2})?/);
    return match ? match[1] : datetimeStr;
  },
  
  selectDay: function(e) {
    const day = parseInt(e.currentTarget.dataset.day);
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    this.setData({
      selectedDay: day,
      selectedDayName: dayNames[day]
    });
    
    this.filterSchedules();
  },
  
  
  
  goToAddSchedule: function() {
    wx.navigateTo({
      url: '/pages/addSchedule/addSchedule'
    })
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
    
    const membersWithState = members.map(m => ({
      ...m,
      isSelected: true
    }))
    
    const selectedMembers = members.map(m => m.name)
    
    this.setData({
      familyMembers: membersWithState,
      selectedMembers: selectedMembers
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
    })
    
    this.updateWeekDaysWithMemberFilter()
    this.filterSchedules()
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
    })
    
    this.updateWeekDaysWithMemberFilter()
    this.filterSchedules()
  },

  getMemberStatus: function(schedule) {
    const members = schedule.scheduleMembers || []
    const completedBy = schedule.completedBy || []
    return members.map(name => ({
      name: name,
      completed: completedBy.includes(name)
    }))
  },

  checkAllCompleted: function(members, completedBy) {
    if (!members || members.length === 0) return false
    if (!completedBy || completedBy.length === 0) return false
    return members.every(member => completedBy.includes(member))
  },

  toggleMemberComplete: function(e) {
    const scheduleId = parseInt(e.currentTarget.dataset.id);
    const memberName = e.currentTarget.dataset.member;
    const day = this.data.selectedDay;

    const daySchedules = [...this.data.weekSchedules[day]];
    const scheduleIndex = daySchedules.findIndex(s => s.id === scheduleId);
    const schedule = daySchedules[scheduleIndex];
    
    let completedBy = schedule.completedBy || [];
    const isCompleted = completedBy.includes(memberName);
    
    if (isCompleted) {
      completedBy = completedBy.filter(m => m !== memberName);
      if (schedule.points && schedule.points > 0) {
        app.addPoints(-schedule.points, `取消完成"${schedule.title}"任务`, memberName);
      }
    } else {
      completedBy = [...completedBy, memberName];
      if (schedule.points && schedule.points > 0) {
        app.addPoints(schedule.points, `完成"${schedule.title}"任务`, memberName);
      }
    }
    
    const allCompleted = this.checkAllCompleted(schedule.scheduleMembers, completedBy);
    
    const memberStatus = (schedule.scheduleMembers || []).map(name => ({
      name: name,
      completed: completedBy.includes(name)
    }));
    
    const updatedSchedule = { 
      ...schedule, 
      completedBy: completedBy,
      completed: allCompleted,
      memberStatus: memberStatus
    };
    
    daySchedules[scheduleIndex] = updatedSchedule;
    
    const weekSchedules = {...this.data.weekSchedules};
    weekSchedules[day] = daySchedules;
    
    // 更新 app.globalData.schedules
    const globalSchedules = app.globalData.schedules || [];
    const globalScheduleIndex = globalSchedules.findIndex(s => s.id === scheduleId);
    if (globalScheduleIndex !== -1) {
      globalSchedules[globalScheduleIndex] = {
        ...updatedSchedule
      };
      app.saveSchedules(globalSchedules);
    }
    
    this.setData({
      weekSchedules: weekSchedules
    });
    
    this.filterSchedules();
  },

  filterSchedules: function() {
    const day = this.data.selectedDay;
    const { weekSchedules, selectedMembers } = this.data;
    let schedules = weekSchedules[day] || [];
    
    if (selectedMembers.length > 0) {
      schedules = schedules.filter(schedule => {
        return schedule.scheduleMembers && schedule.scheduleMembers.some(m => selectedMembers.includes(m));
      });
    }
    
    // 计算本周统计（考虑成员筛选）
    let totalSchedules = 0;
    let totalCompleted = 0;
    Object.values(weekSchedules).forEach(daySchedules => {
      let filteredDaySchedules = daySchedules;
      if (selectedMembers.length > 0) {
        filteredDaySchedules = daySchedules.filter(schedule => {
          return schedule.scheduleMembers && schedule.scheduleMembers.some(m => selectedMembers.includes(m));
        });
      }
      totalSchedules += filteredDaySchedules.length;
      filteredDaySchedules.forEach(s => {
        if (s.completed) totalCompleted++;
      });
    });
    
    const avgCompletion = totalSchedules > 0 ? Math.round((totalCompleted / totalSchedules) * 100) : 0;
    
    this.setData({
      daySchedules: schedules,
      completedSchedules: totalCompleted,
      totalSchedules: totalSchedules,
      avgCompletion: avgCompletion
    });
  },

  updateWeekDaysWithMemberFilter: function() {
    const { weekDays, weekSchedules, selectedMembers } = this.data;
    
    const updatedWeekDays = weekDays.map((day, i) => {
      let daySchedules = weekSchedules[i] || [];
      
      // 如果有成员筛选，过滤出选中成员的日程
      if (selectedMembers.length > 0) {
        daySchedules = daySchedules.filter(schedule => {
          return schedule.scheduleMembers && schedule.scheduleMembers.some(m => selectedMembers.includes(m));
        });
      }
      
      return {
        ...day,
        hasSchedule: daySchedules.length > 0
      };
    });
    
    this.setData({
      weekDays: updatedWeekDays
    });
  },

  viewScheduleDetail: function(e) {
    const scheduleId = parseInt(e.currentTarget.dataset.id)
    wx.navigateTo({
      url: `/pages/scheduleDetail/scheduleDetail?id=${scheduleId}`
    })
  }
})