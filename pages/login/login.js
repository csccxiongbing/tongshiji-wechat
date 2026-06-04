const app = getApp()

Page({
  data: {
    phone: '',
    code: '',
    codeBtnText: '获取验证码',
    codeCountdown: 0
  },
  
  goBack: function() {
    wx.navigateBack()
  },
  
  goToRegister: function() {
    wx.navigateTo({
      url: '/pages/register/register'
    })
  },
  
  onPhoneInput: function(e) {
    this.setData({
      phone: e.detail.value
    })
  },
  
  onCodeInput: function(e) {
    this.setData({
      code: e.detail.value
    })
  },
  
  sendCode: function() {
    if (!this.data.phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }
    
    if (this.data.codeCountdown > 0) {
      return
    }
    
    this.setData({
      codeCountdown: 60,
      codeBtnText: '60秒后重新获取'
    })
    
    const timer = setInterval(() => {
      const countdown = this.data.codeCountdown - 1
      if (countdown <= 0) {
        clearInterval(timer)
        this.setData({
          codeCountdown: 0,
          codeBtnText: '获取验证码'
        })
      } else {
        this.setData({
          codeCountdown: countdown,
          codeBtnText: `${countdown}秒后重新获取`
        })
      }
    }, 1000)
    
    wx.showToast({
      title: '验证码已发送',
      icon: 'success'
    })
  },
  
  login: async function() {
    if (!this.data.phone || !this.data.code) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({ title: '登录中...' })
    
    const result = await app.loginUser(this.data.phone)
    
    wx.hideLoading()
    
    if (!result.success) {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
      return
    }
    
    this.checkAndNavigate()
  },
  
  checkAndNavigate: function() {
    const userInfo = app.globalData.userInfo
    const familyMembers = app.globalData.familyMembers
    
    // 检查是否完成完整注册流程：有角色且有家庭（家庭中有真正的成员）
    const hasRole = userInfo && userInfo.role
    const hasFamilyMembers = familyMembers && familyMembers.members && familyMembers.members.length > 0
    
    if (hasRole && hasFamilyMembers) {
      // 已完成完整注册流程，跳转到首页
      wx.switchTab({
        url: '/pages/home/home'
      })
    } else if (!hasRole) {
      // 没有角色，跳转到角色选择
      wx.navigateTo({
        url: '/pages/role/role'
      })
    } else {
      // 有角色但没有家庭，跳转到家庭选择
      wx.navigateTo({
        url: '/pages/family/family?role=' + userInfo.role
      })
    }
  }
})