const app = getApp()

Page({
  data: {
    phone: '',
    code: '',
    nickname: '',
    codeBtnText: '获取验证码',
    codeCountdown: 0
  },
  
  onLoad: function() {
    // 生成默认昵称：TSJ + 4位随机数字
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const defaultNickname = 'TSJ' + randomNum
    this.setData({
      nickname: defaultNickname
    })
  },
  
  goBack: function() {
    wx.navigateBack()
  },
  
  goToLogin: function() {
    wx.navigateTo({
      url: '/pages/login/login'
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
  
  onNicknameInput: function(e) {
    this.setData({
      nickname: e.detail.value
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
  
  register: function() {
    if (!this.data.phone || !this.data.code) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }
    
    const userInfo = {
      phone: this.data.phone,
      nickname: this.data.nickname || 'TSJ' + Math.floor(1000 + Math.random() * 9000),
      role: null
    }
    
    const result = app.registerUser(userInfo)
    
    if (!result.success) {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
      return
    }
    
    wx.showToast({
      title: '注册成功',
      icon: 'success'
    })
    
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/role/role'
      })
    }, 1500)
  }
})