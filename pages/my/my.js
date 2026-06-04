const app = getApp()

Page({
  data: {
    nickname: '',
    role: '',
    roleText: '孩子',
    wishPoints: 0,
    achievements: {
      totalDays: 7,
      completedTasks: 42,
      badges: 5
    },
    familyMembers: [],
    selectedMembers: [],
    showMemberPicker: false
  },
  
  onShow: function() {
    const userInfo = app.globalData.userInfo
    const nickname = userInfo?.nickname || '用户'
    const role = userInfo?.role || 'child'
    const wishPoints = app.globalData.points || 150
    
    this.setData({
      nickname: nickname,
      role: role,
      roleText: role === 'parent' ? '家长' : '孩子',
      wishPoints: wishPoints
    })
    
    this.loadFamilyMembers()
    this.updateTabBar()
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
      this.getTabBar().setData({
        currentIndex: 3
      })
    }
  },
  
  goToEditProfile: function() {
    const userInfo = app.globalData.userInfo
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      content: userInfo?.nickname || '',
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          userInfo.nickname = res.content.trim()
          app.saveUserInfo(userInfo)
          this.setData({
            nickname: userInfo.nickname
          })
          wx.showToast({
            title: '修改成功',
            icon: 'success'
          })
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
  
  goToSettings: function() {
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    })
  },

  printStorage: function() {
    console.log('========== 本地存储数据 ==========')
    try {
      const keys = ['userInfo', 'familyMembers', 'schedules', 'points', 'pointsHistory', 'pomodoroHistory']
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
  
  logout: function() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          
          wx.showToast({
            title: '退出成功',
            icon: 'success'
          })
          
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/login/login'
            })
          }, 1500)
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