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
    }
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
    this.updateTabBar()
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
      url: '/pages/family/family'
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
          // 只清空内存中的全局数据，不删除本地存储
          app.globalData.userInfo = null
          app.globalData.familyMembers = []
          app.globalData.schedules = []
          
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
  }
})