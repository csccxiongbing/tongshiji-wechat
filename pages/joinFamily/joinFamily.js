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
    
    let newFocusIndex = index
    if (inputValue && index < 5) {
      newFocusIndex = index + 1
    } else if (!inputValue && index > 0) {
      newFocusIndex = index - 1
    }
    
    this.setData({
      inviteCode: code,
      currentFocusIndex: newFocusIndex
    })
  },
  
  onCodeFocus: function(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    this.setData({
      currentFocusIndex: index
    })
  },
  
  onPaste: function() {
    const that = this
    wx.getClipboardData({
      success: function(res) {
        const clipboardData = (res.data || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
        if (clipboardData.length >= 6) {
          const code = clipboardData.slice(0, 6).split('')
          that.setData({
            inviteCode: code,
            currentFocusIndex: 5
          })
          wx.showToast({
            title: '粘贴成功',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: '剪贴板内容无效',
            icon: 'none'
          })
        }
      },
      fail: function() {
        wx.showToast({
          title: '获取剪贴板失败',
          icon: 'none'
        })
      }
    })
  },
  
  findFamilyByCode: function(code) {
    const users = app.globalData.users || []
    for (const user of users) {
      if (user.familyMembers && user.familyMembers.familyCode === code) {
        return user.familyMembers
      }
    }
    return null
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
    
    const foundFamily = this.findFamilyByCode(code)
    
    if (foundFamily) {
      const currentUser = app.globalData.userInfo || {}
      const userPhone = currentUser.phone || ''
      
      // 检查是否已经在家庭成员中
      const isAlreadyInFamily = foundFamily.members && 
        foundFamily.members.some(member => member.phone === userPhone)
      
      if (isAlreadyInFamily) {
        // 已经在家庭中
        app.globalData.familyMembers = foundFamily
        wx.setStorageSync('familyMembers', foundFamily)
        
        wx.showToast({
          title: '已在此家庭中',
          icon: 'success'
        })
        
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/home/home'
          })
        }, 1500)
      } else {
        // 不在家庭中，加入
        const newMemberName = currentUser.nickname || '新成员'
        const newMembers = [...(foundFamily.members || [])]
        newMembers.push({
          name: newMemberName,
          role: currentUser.role || 'parent', // 使用用户注册时的角色
          phone: userPhone,
          joinedAt: Date.now(),
          isCurrentUser: true
        })
        
        // 更新全局和本地存储
        foundFamily.members = newMembers
        app.globalData.familyMembers = foundFamily
        wx.setStorageSync('familyMembers', foundFamily)
        
        // 为新成员初始化积分为0
        if (!app.globalData.memberPoints[newMemberName]) {
          app.globalData.memberPoints[newMemberName] = 0
          wx.setStorageSync('memberPoints', app.globalData.memberPoints)
        }
        
        // 同步到用户列表
        app.saveCurrentUserToUsersList()
        
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
    } else {
      wx.showToast({
        title: '邀请码不正确',
        icon: 'none'
      })
    }
  }
})