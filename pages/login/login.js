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
  
  login: function() {
    if (!this.data.phone || !this.data.code) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }
    
    const userInfo = {
      phone: this.data.phone,
      role: null,
      nickname: '小朋友'
    }
    
    app.saveUserInfo(userInfo)
    
    this.checkAndNavigate()
  },
  
  checkAndNavigate: function() {
    const userInfo = app.globalData.userInfo
    const familyMembers = app.globalData.familyMembers
    
    if (userInfo && userInfo.role && familyMembers && Object.keys(familyMembers).length > 0) {
      wx.switchTab({
        url: '/pages/home/home'
      })
    } else if (userInfo && !userInfo.role) {
      wx.navigateTo({
        url: '/pages/role/role'
      })
    } else {
      wx.navigateTo({
        url: '/pages/family/family'
      })
    }
  }
})