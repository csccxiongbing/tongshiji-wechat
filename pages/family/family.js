Page({
  data: {
    selectedRole: ''
  },
  
  onLoad: function(options) {
    this.setData({
      selectedRole: options.role || ''
    })
  },
  
  goToCreateFamily: function() {
    if (this.data.selectedRole) {
      wx.navigateTo({
        url: '/pages/addFamily/addFamily?role=' + this.data.selectedRole
      })
    } else {
      wx.navigateTo({
        url: '/pages/addFamily/addFamily'
      })
    }
  },
  
  goToJoinFamily: function() {
    wx.navigateTo({
      url: '/pages/joinFamily/joinFamily'
    })
  }
})