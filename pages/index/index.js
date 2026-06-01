const app = getApp()

Page({
  goToLogin: function() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },
  
  goToRegister: function() {
    wx.navigateTo({
      url: '/pages/register/register'
    })
  },
  
  onLoad: function() {
    console.log('index页面onLoad')
    this.checkAndNavigate()
  },
  
  onShow: function() {
    console.log('index页面onShow')
    this.checkAndNavigate()
  },
  
  checkAndNavigate: function() {
    console.log('检查登录状态...')
    
    // 直接从 Storage 读取，确保获取最新数据
    try {
      const userInfo = wx.getStorageSync('userInfo')
      const familyMembers = wx.getStorageSync('familyMembers')
      
      console.log('Storage userInfo:', userInfo)
      console.log('Storage familyMembers:', familyMembers)
      
      // 检查条件：有用户信息、有角色、有家庭信息、有家庭成员
      const hasUserInfo = userInfo && typeof userInfo === 'object'
      const hasRole = hasUserInfo && userInfo.role
      const hasFamily = familyMembers && typeof familyMembers === 'object'
      const hasMembers = hasFamily && familyMembers.members && Array.isArray(familyMembers.members) && familyMembers.members.length > 0
      
      console.log('hasUserInfo:', hasUserInfo, 'hasRole:', hasRole, 'hasFamily:', hasFamily, 'hasMembers:', hasMembers)
      
      // 同步到 globalData
      if (hasUserInfo) {
        app.globalData.userInfo = userInfo
      }
      if (hasFamily) {
        app.globalData.familyMembers = familyMembers
      }
      
      if (hasUserInfo && hasRole && hasFamily && hasMembers) {
        console.log('已登录，跳转到首页')
        wx.switchTab({
          url: '/pages/home/home'
        })
      } else {
        console.log('未完成登录/家庭设置，停留在首页')
      }
    } catch(e) {
      console.error('读取存储失败', e)
    }
  }
})