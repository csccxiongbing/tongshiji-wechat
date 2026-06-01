const app = getApp()

Page({
  data: {
    selectedRole: ''
  },
  
  selectRole: function(e) {
    const role = e.currentTarget.dataset.role
    this.setData({
      selectedRole: role
    })
  },
  
  confirmRole: function() {
    if (!this.data.selectedRole) {
      wx.showToast({
        title: '请选择角色',
        icon: 'none'
      })
      return
    }
    
    const userInfo = app.globalData.userInfo
    userInfo.role = this.data.selectedRole
    app.saveUserInfo(userInfo)
    
    wx.showToast({
      title: '选择成功',
      icon: 'success'
    })
    
    setTimeout(() => {
      this.checkAndNavigate()
    }, 1500)
  },
  
  checkAndNavigate: function() {
    const familyMembers = app.globalData.familyMembers
    
    if (familyMembers && Object.keys(familyMembers).length > 0 && familyMembers.members && familyMembers.members.length > 0) {
      wx.switchTab({
        url: '/pages/home/home'
      })
    } else {
      wx.navigateTo({
        url: '/pages/family/family?role=' + this.data.selectedRole
      })
    }
  }
})