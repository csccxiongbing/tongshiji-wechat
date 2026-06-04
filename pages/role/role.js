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
  
  confirmRole: async function() {
    if (!this.data.selectedRole) {
      wx.showToast({
        title: '请选择角色',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    const userInfo = app.globalData.userInfo
    const userId = userInfo._id || userInfo.id
    
    const result = await app.updateUser(userId, { role: this.data.selectedRole })
    
    wx.hideLoading()
    
    if (!result.success) {
      wx.showToast({
        title: result.message || '保存失败',
        icon: 'none'
      })
      return
    }
    
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
    
    // 检查是否已经有家庭（家庭中有真正的成员）
    const hasFamilyMembers = familyMembers && familyMembers.members && familyMembers.members.length > 0
    
    if (hasFamilyMembers) {
      // 已有家庭，直接跳转到首页
      wx.switchTab({
        url: '/pages/home/home'
      })
    } else {
      // 没有家庭，跳转到家庭选择页面
      wx.navigateTo({
        url: '/pages/family/family?role=' + this.data.selectedRole
      })
    }
  }
})