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
    showMemberPicker: false,
    isChildRole: false,
    currentMemberName: '',
    showPointsPopup: false,
    pointsPopupText: '',
    pointsScheduleId: null,
    pointsPopupMember: ''
  },
  
  onShow: async function() {
    this.initUserRole();
    this.initWeekDays();
    await this.loadFamilyMembers();
    await this.initSchedules();
    this.updateTabBar();
  },
  
  updateTabBar: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        currentIndex: 1
      })
    }
  },
  
  initUserRole: function() {
    const userInfo = app.globalData.userInfo || {}
    const isChild = userInfo.role === 'child'
    const currentMemberName = this.findCurrentMemberName(userInfo)
    
    this.setData({
      isChildRole: isChild,
      currentMemberName: currentMemberName
    })
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
        fullDate: this.formatDate(date),
        dateObj: date,
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
  
  initSchedules: async function() {
    const userInfo = app.globalData.userInfo || {};
    let schedules = [];
    
    // 优先从后端API获取数据
    if (userInfo.familyId) {
      try {
        const result = await app.request({
          url: '/schedules/family/' + userInfo.familyId,
          method: 'GET'
        });
        
        if (result.success) {
          app.globalData.schedules = result.schedules;
          wx.setStorageSync('schedules', result.schedules);
          schedules = result.schedules || [];
        }
      } catch (error) {
        console.error('加载日程错误:', error);
      }
    }
    
    // 如果后端API获取失败，使用本地缓存
    if (schedules.length === 0) {
      schedules = app.globalData.schedules || [];
    }
    
    const { weekDays, isChildRole, currentMemberName, selectedMembers } = this.data;
    
    const weekSchedules = {};
    weekDays.forEach((day, i) => {
      const daySchedules = this.getSchedulesForDate(schedules, day.dateObj);
      weekSchedules[i] = daySchedules;
    });
    
    const updatedWeekDays = this.data.weekDays.map((day, i) => {
      let daySchedules = weekSchedules[i] || [];
      
      if (isChildRole) {
        daySchedules = daySchedules.filter(schedule => {
          return schedule.scheduleMembers && schedule.scheduleMembers.includes(currentMemberName);
        });
      } else if (selectedMembers.length > 0) {
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
    
    const result = [];
    
    schedules.forEach(schedule => {
      let shouldShow = false;
      
      if (schedule.startTime) {
        const scheduleDate = new Date(schedule.startTime.replace(/-/g, '/'));
        const scheduleDateStr = this.formatDate(scheduleDate);
        
        if (scheduleDateStr === targetDateStr) {
          shouldShow = true;
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
      }
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
    const currentMemberName = this.data.currentMemberName
    const isChild = this.data.isChildRole
    
    if (isChild) {
      // 孩子角色：只显示自己
      return [{
        name: currentMemberName,
        completed: completedBy.includes(currentMemberName),
        isMe: true,
        isClickable: true,
        showFireworks: false
      }]
    }
    
    // 家长角色：显示所有成员
    return members.map(name => {
      const isMe = isChild && name === currentMemberName
      return {
        name: name,
        completed: completedBy.includes(name),
        isMe: isMe,
        isClickable: !isChild || isMe,
        showFireworks: false
      }
    })
  },

  checkAllCompleted: function(members, completedBy) {
    if (!members || members.length === 0) return false
    if (!completedBy || completedBy.length === 0) return false
    return members.every(member => completedBy.includes(member))
  },

  toggleMemberComplete: async function(e) {
    const scheduleId = e.currentTarget.dataset.id;
    const memberName = e.currentTarget.dataset.member;
    const day = this.data.selectedDay;

    console.log('toggleMemberComplete - scheduleId:', scheduleId, 'memberName:', memberName);

    // 容错处理：如果 scheduleId 不存在或为空
    if (!scheduleId) {
      console.error('scheduleId 为空');
      return;
    }

    const daySchedules = [...this.data.weekSchedules[day]];
    const scheduleIndex = daySchedules.findIndex(s => s.id === scheduleId || s._id === scheduleId);
    const schedule = daySchedules[scheduleIndex];
    
    if (!schedule) {
      console.error('未找到对应的 schedule, scheduleId:', scheduleId);
      return;
    }
    
    const isCompleted = (schedule.completedBy || []).includes(memberName);
    
    // 如果已完成，则取消完成
    if (isCompleted) {
      const result = await app.uncompleteSchedule(scheduleId, memberName);
      
      if (!result.success) {
        wx.showToast({
          title: result.message,
          icon: 'none'
        });
        return;
      }
      
      // 取消完成时扣除积分
      if (schedule.points && schedule.points > 0) {
        await app.subtractPoints(memberName, schedule.points, `取消完成"${schedule.title}"任务`);
        this.showMinusPointsEffect(schedule.points, memberName, scheduleId);
      }
      
      // 延迟刷新数据，让效果先展示
      setTimeout(() => {
        this.initSchedules();
      }, 1000);
      return;
    }
    
    // 如果未完成，则标记完成
    if (!isCompleted) {
      const result = await app.completeSchedule(scheduleId, memberName);
      
      if (!result.success) {
        wx.showToast({
          title: result.message,
          icon: 'none'
        });
        return;
      }
      
      let totalPoints = 0
      let bonusPoints = 0
      
      // 添加任务本身的积分
      if (schedule.points && schedule.points > 0) {
        await app.addPoints(memberName, schedule.points, `完成"${schedule.title}"任务`);
        totalPoints += schedule.points
      }
      
      // 检查是否有打卡奖励
      if (result.rewards) {
        const rewards = result.rewards
        if (!rewards.alreadyCheckedIn && rewards.awardedPoints > 0) {
          bonusPoints = rewards.awardedPoints
          totalPoints += bonusPoints
        }
      }
      
      // 显示积分效果
      if (totalPoints > 0) {
        this.showPointsEffect(totalPoints, memberName, scheduleId);
      }
      
      // 延迟刷新数据，让效果先展示
      setTimeout(() => {
        this.initSchedules();
      }, 1000);
    }
  },
  
  showPointsEffect: function(points, memberName, scheduleId) {
    this.triggerFireworks(scheduleId, memberName);
    this.showMiniPointsPopup(scheduleId, memberName, points, true);
    this.playPointsSound();
  },
  
  showMinusPointsEffect: function(points, memberName, scheduleId) {
    this.showMiniPointsPopup(scheduleId, memberName, points, false);
  },
  
  showMiniPointsPopup: function(scheduleId, memberName, points, isAdd) {
    this.setData({
      showPointsPopup: true,
      pointsPopupText: isAdd ? `⭐ +${points}` : `⭐ -${points}`,
      pointsScheduleId: scheduleId,
      pointsPopupMember: memberName
    });
    
    setTimeout(() => {
      this.setData({
        showPointsPopup: false,
        pointsPopupText: '',
        pointsScheduleId: null,
        pointsPopupMember: ''
      });
    }, 1000);
  },
  
  triggerFireworks: function(scheduleId, memberName) {
    const day = this.data.selectedDay;
    const weekSchedules = {...this.data.weekSchedules};
    let daySchedules = [...weekSchedules[day]];
    const scheduleIndex = daySchedules.findIndex(s => s.id === scheduleId);
    
    if (scheduleIndex !== -1) {
      const updatedMemberStatus = (daySchedules[scheduleIndex].memberStatus || []).map(ms => ({
        ...ms,
        showFireworks: ms.name === memberName ? true : false
      }));
      
      daySchedules[scheduleIndex].memberStatus = updatedMemberStatus;
      
      weekSchedules[day] = [...daySchedules];
      
      // 同时更新 daySchedules
      const filteredDaySchedules = daySchedules.filter(schedule => {
        const { selectedMembers } = this.data;
        if (selectedMembers.length > 0) {
          return schedule.scheduleMembers && schedule.scheduleMembers.some(m => selectedMembers.includes(m));
        }
        return true;
      });
      
      this.setData({
        weekSchedules: weekSchedules,
        daySchedules: filteredDaySchedules
      });
      
      setTimeout(() => {
        const resetWeekSchedules = {...this.data.weekSchedules};
        const resetDaySchedules = [...resetWeekSchedules[day]];
        const resetMemberStatus = (resetDaySchedules[scheduleIndex].memberStatus || []).map(ms => ({
          ...ms,
          showFireworks: false
        }));
        resetDaySchedules[scheduleIndex].memberStatus = resetMemberStatus;
        resetWeekSchedules[day] = resetDaySchedules;
        
        // 同时更新 daySchedules
        const resetFilteredDaySchedules = resetDaySchedules.filter(schedule => {
          const { selectedMembers } = this.data;
          if (selectedMembers.length > 0) {
            return schedule.scheduleMembers && schedule.scheduleMembers.some(m => selectedMembers.includes(m));
          }
          return true;
        });
        
        this.setData({
          weekSchedules: resetWeekSchedules,
          daySchedules: resetFilteredDaySchedules
        });
      }, 1000);
    }
  },
  
  playPointsSound: function() {
    try {
      const audio = wx.createInnerAudioContext();
      audio.src = '/audio/point.mp3';
      audio.play();
      audio.onEnded(() => {
        audio.destroy();
      });
      audio.onError((err) => {
        console.error('播放音效失败:', err);
        audio.destroy();
      });
    } catch (e) {
      console.error('播放音效失败:', e);
    }
  },

  filterSchedules: function() {
    const day = this.data.selectedDay;
    const { weekSchedules, selectedMembers, isChildRole, currentMemberName } = this.data;
    let schedules = weekSchedules[day] || [];
    
    // 孩子角色：只显示包含自己的任务
    if (isChildRole) {
      schedules = schedules.filter(schedule => {
        return schedule.scheduleMembers && schedule.scheduleMembers.includes(currentMemberName);
      });
    } else if (selectedMembers.length > 0) {
      // 家长角色：使用选中成员过滤
      schedules = schedules.filter(schedule => {
        return schedule.scheduleMembers && schedule.scheduleMembers.some(m => selectedMembers.includes(m));
      });
    }
    
    // 重新计算 memberStatus（因为全局数据可能变了）
    schedules = schedules.map(s => {
      // 总是重新计算 memberStatus，确保孩子角色时只显示自己
      return {
        ...s,
        memberStatus: this.getMemberStatus(s),
        _memberStatusCached: true
      }
    })
    
    let totalSchedules = 0;
    let totalCompleted = 0;
    Object.values(weekSchedules).forEach(daySchedules => {
      let filteredDaySchedules = daySchedules;
      
      if (isChildRole) {
        filteredDaySchedules = daySchedules.filter(schedule => {
          return schedule.scheduleMembers && schedule.scheduleMembers.includes(currentMemberName);
        });
      } else if (selectedMembers.length > 0) {
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
    const { weekDays, weekSchedules, selectedMembers, isChildRole, currentMemberName } = this.data;
    
    const updatedWeekDays = weekDays.map((day, i) => {
      let daySchedules = weekSchedules[i] || [];
      
      if (isChildRole) {
        daySchedules = daySchedules.filter(schedule => {
          return schedule.scheduleMembers && schedule.scheduleMembers.includes(currentMemberName);
        });
      } else if (selectedMembers.length > 0) {
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

  watchScheduleDetail: function(e) {
    const scheduleId = parseInt(e.currentTarget.dataset.id)
    wx.navigateTo({
      url: `/pages/scheduleDetail/scheduleDetail?id=${scheduleId}`
    })
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
  
  // 防止误触其他成员按钮
  onMemberButtonTap: function(e) {
    const isClickable = e.currentTarget.dataset.clickable
    if (isClickable === false || isClickable === 'false') {
      wx.showToast({
        title: '只可以操作自己的任务哦',
        icon: 'none',
        duration: 1500
      })
      return
    }
    this.toggleMemberComplete(e)
  },

  // 防止 startPomodoro 被冒泡影响  
  onStartButtonTap: function(e) {
    this.startPomodoro(e)
  }
})
