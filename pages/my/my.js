const app = getApp()

Page({
  data: {
    nickname: '',
    role: '',
    roleText: '孩子',
    wishPoints: 0,
    level: 1,
    levelName: '新手',
    achievements: {
      totalDays: 7,
      completedTasks: 0,
      badges: 5
    },
    familyMembers: [],
    selectedMembers: [],
    showMemberPicker: false
  },
  
  onShow: async function() {
    if (!app.checkLogin()) return
    console.log('====== my.js onShow 开始 ======')
    
    // 先加载必要的数据（loadFamilyMembers 已经会加载 memberPoints
    await app.loadFamilyMembers()
    
    const userInfo = app.globalData.userInfo || {}
    console.log('userInfo:', userInfo)
    
    const nickname = userInfo.nickname || '用户'
    const role = userInfo.role || 'child'
    
    // 获取当前用户在家庭中的角色信息
    const currentMember = this.findCurrentMember(userInfo)
    console.log('currentMember:', currentMember)
    
    const currentMemberName = currentMember ? currentMember.name : ''
    
    // 根据角色获取积分
    const memberPoints = app.globalData.memberPoints || {}
    console.log('memberPoints:', memberPoints)
    
    let wishPoints = 0
    
    if (role === 'child') {
      // 孩子角色：优先从 currentMember 获取积分，没有再从 memberPoints 找
      if (currentMember && currentMember.points !== undefined && currentMember.points !== null) {
        wishPoints = currentMember.points
        console.log('孩子角色 - 从 currentMember 获取积分:', wishPoints)
      } else if (currentMemberName) {
        wishPoints = memberPoints[currentMemberName] || 0
        console.log('孩子角色 - 从 memberPoints 获取积分:', currentMemberName, wishPoints)
      }
    } else {
      // 家长角色显示家庭总积分（所有成员积分之和）
      const pointsArray = Object.values(memberPoints)
      console.log('家长角色 - pointsArray:', pointsArray)
      if (pointsArray.length > 0) {
        wishPoints = pointsArray.reduce((sum, points) => sum + points, 0)
      } else {
        wishPoints = app.globalData.points || 0
      }
      console.log('家长角色 - wishPoints:', wishPoints)
    }
    
    // 根据角色统计完成的任务数
    const completedTasks = this.countCompletedTasks(role, currentMemberName)
    
    // 获取连续打卡天数
    const consecutiveCheckInDays = currentMember?.consecutiveCheckInDays || 0
    console.log('连续打卡天数:', consecutiveCheckInDays, 'currentMember:', currentMember)
    
    const levelInfo = this.calculateLevel(wishPoints)
    
    this.setData({
      nickname: nickname,
      role: role,
      roleText: role === 'parent' ? '家长' : '孩子',
      wishPoints: wishPoints,
      level: levelInfo.level,
      levelName: levelInfo.name,
      achievements: {
        totalDays: consecutiveCheckInDays,
        completedTasks: completedTasks,
        badges: 5
      }
    })
    
    console.log('最终显示的 wishPoints:', wishPoints)
    console.log('====== my.js onShow 结束 ======')
    
    this.loadFamilyMembers()
    this.updateTabBar()
  },
  
  // 获取当前用户在家庭中的角色信息（返回完整对象）
  findCurrentMember: function(userInfo) {
    console.log('findCurrentMember 被调用，userInfo:', userInfo)
    
    if (!userInfo) return null
    
    let family = app.globalData.familyMembers
    if (!family || (!family.members && !Array.isArray(family))) {
      try {
        family = wx.getStorageSync('familyMembers')
        console.log('从 Storage 读取 family:', family)
      } catch (e) {}
    }
    
    let members = []
    if (family && Array.isArray(family.members)) {
      members = family.members
    } else if (family && Array.isArray(family)) {
      members = family
    }
    
    console.log('家庭成员列表 members:', members)
    // 详细打印每个成员
    members.forEach((m, i) => {
      console.log(`  成员${i}: name=${m.name}, phone=${m.phone}, role=${m.role}, points=${m.points}, isCurrentUser=${m.isCurrentUser}`)
    })
    
    // 1. 优先通过手机号匹配
    const phone = userInfo.phone
    console.log('要匹配的手机号:', phone)
    if (phone) {
      const phoneMatch = members.find(m => m.phone === phone)
      if (phoneMatch) {
        console.log('通过 phone 找到:', phoneMatch)
        return phoneMatch
      }
      console.log('通过 phone 没找到匹配的成员')
    }
    
    // 2. 通过角色类型匹配
    if (userInfo.role) {
      const roleMatch = members.find(m => m.role === userInfo.role)
      if (roleMatch) {
        console.log('通过 role 找到:', roleMatch)
        return roleMatch
      }
    }
    
    // 3. 最后才通过 isCurrentUser 标记查找
    const currentMemberByFlag = members.find(m => m.isCurrentUser)
    if (currentMemberByFlag) {
      console.log('通过 isCurrentUser 找到:', currentMemberByFlag)
      return currentMemberByFlag
    }
    
    console.log('没有找到匹配的成员')
    return null
  },
  
  // 获取当前用户在家庭中的角色名称
  findCurrentMemberName: function(userInfo) {
    const member = this.findCurrentMember(userInfo)
    return member ? member.name : (userInfo.nickname || '')
  },
  
  // 统计完成的任务数
  countCompletedTasks: function(role, currentMemberName) {
    const schedules = app.globalData.schedules || []
    
    if (role === 'child') {
      // 孩子角色：统计自己完成的任务数
      if (!currentMemberName) return 0
      return schedules.filter(schedule => {
        const completedBy = schedule.completedBy || []
        return completedBy.includes(currentMemberName)
      }).length
    } else {
      // 家长角色：统计所有成员完成的任务总数
      let totalCount = 0
      schedules.forEach(schedule => {
        const completedBy = schedule.completedBy || []
        totalCount += completedBy.length
      })
      return totalCount
    }
  },
  
  calculateLevel: function(points) {
    const levels = [
      { level: 1, name: '时间小萌新', minPoints: 0 },
      { level: 2, name: '时间小达人', minPoints: 100 },
      { level: 3, name: '时间小标兵', minPoints: 200 },
      { level: 4, name: '时间管理师', minPoints: 300 },
      { level: 5, name: '时间大师', minPoints: 500 },
      { level: 6, name: '时间王者', minPoints: 800 },
      { level: 7, name: '时间传说', minPoints: 1000 },
      { level: 8, name: '时间神话', minPoints: 1500 },
      { level: 9, name: '时间主宰', minPoints: 2000 },
      { level: 10, name: '时间之神', minPoints: 3000 }
    ]
    
    for (let i = levels.length - 1; i >= 0; i--) {
      if (points >= levels[i].minPoints) {
        return levels[i]
      }
    }
    return levels[0]
  },
  
  loadFamilyMembers: function() {
    let family = app.globalData.familyMembers
    let members = []
    
    if (family && Array.isArray(family.members)) {
      members = family.members
    } else if (family && Array.isArray(family)) {
      members = family
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
  },
  
  updateTabBar: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const userInfo = app.globalData.userInfo || {}
      const role = userInfo?.role || 'child'
      const currentIndex = role === 'parent' ? 2 : 3
      this.getTabBar().setData({
        currentIndex: currentIndex
      })
    }
  },
  
  goToEditProfile: async function() {
    const userInfo = app.globalData.userInfo
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      content: userInfo?.nickname || '',
      success: async (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const newNickname = res.content.trim()
          wx.showLoading({ title: '保存中...', mask: true })
          try {
            await app.updateUser(userInfo._id || userInfo.id, { nickname: newNickname })
            wx.hideLoading()
            wx.showToast({
              title: '修改成功',
              icon: 'success'
            })
          } catch (e) {
            wx.hideLoading()
            console.error('修改昵称失败:', e)
            wx.showToast({
              title: '修改失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },
  
  goToFamily: function() {
    wx.navigateTo({
      url: '/pages/familyMember/familyMember'
    })
  },
  
  goToWish: function() {
    wx.navigateTo({
      url: '/pages/wish/wish'
    })
  },
  
  goToAchievement: function() {
    const userInfo = app.globalData.userInfo || {}
    
    // 只允许孩子角色访问成就页面
    if (userInfo.role !== 'child') {
      wx.showToast({
        title: '成就页面仅对孩子开放',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/achievement/achievement'
    })
  },
  
  goToSettings: function() {
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    })
  },

  printStorage: function() {
    console.log('========== 本地存储数据 ==========')
    try {
      const keys = ['userInfo', 'familyMembers', 'schedules', 'points', 'pointsHistory', 'pomodoroHistory', 'memberPoints']
      keys.forEach(key => {
        const value = wx.getStorageSync(key)
        console.log(`${key}:`, value)
      })
      wx.showToast({
        title: '已打印到控制台',
        icon: 'success'
      })
    } catch(e) {
      console.error('读取存储失败', e)
    }
  },
  
  goToHelp: function() {
    wx.showToast({
      title: '帮助与反馈功能开发中',
      icon: 'none'
    })
  },

  goToRules: function() {
    wx.navigateTo({
      url: '/pages/rules/rules'
    })
  },

  goToPomodoroHistory: function() {
    wx.navigateTo({
      url: '/pages/pomodoro-history/pomodoro-history'
    })
  },

  logout: function() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
        }
      }
    })
  },
  
  clearAllData: async function() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有用户数据和任务数据吗？此操作不可恢复。',
      confirmColor: '#FF6B6B',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清空中...' })
          const result = await app.clearAllData()
          wx.hideLoading()
          
          if (result.success) {
            wx.showToast({
              title: '数据已清空',
              icon: 'success'
            })
            setTimeout(() => {
              wx.reLaunch({
                url: '/pages/index/index'
              })
            }, 1500)
          } else {
            wx.showToast({
              title: '清空失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }
})
