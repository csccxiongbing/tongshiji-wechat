const app = getApp()

Page({
  data: {
    inviteCode: ['', '', '', '', '', ''],
    currentFocusIndex: 0
  },
  
  onLoad: function() {
    this.setData({
      currentFocusIndex: 0
    })
  },
  
  goBack: function() {
    wx.navigateBack()
  },
  
  onCodeInput: function(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const value = (e.detail.value || '').toUpperCase()
    
    if (value && !/^[A-Z0-9]$/.test(value.slice(-1))) {
      return
    }
    
    const code = [...this.data.inviteCode]
    const inputValue = value.slice(-1)
    code[index] = inputValue
    
    // 判断是否需要移动焦点
    let newFocusIndex = index
    if (inputValue && index < 5) {
      // 输入了字符，自动跳到下一个
      newFocusIndex = index + 1
    } else if (!inputValue && index > 0 && !code[index - 1]) {
      // 删除了字符且当前为空且前一个也为空，跳到前一个
      newFocusIndex = index - 1
    }
    
    this.setData({
      inviteCode: code,
      currentFocusIndex: newFocusIndex
    })
  },
  
  joinFamily: function() {
    const code = this.data.inviteCode.join('')
    if (code.length !== 6) {
      wx.showToast({
        title: '请输入完整邀请码',
        icon: 'none'
      })
      return
    }
    
    wx.showToast({
      title: '加入成功',
      icon: 'success'
    })
    
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/home/home'
      })
    }, 1500)
  }
})