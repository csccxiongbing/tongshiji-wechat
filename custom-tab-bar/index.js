const app = getApp()

Component({
  data: {
    currentIndex: 0,
    childTabList: [
      {
        pagePath: '/pages/home/home',
        text: '今日',
        icon: '📅'
      },
      {
        pagePath: '/pages/pomodoro/pomodoro',
        text: '专注',
        icon: '🍅'
      },
      {
        pagePath: '/pages/schedule/schedule',
        text: '周计划',
        icon: '📋'
      },
      {
        pagePath: '/pages/my/my',
        text: '我的',
        icon: '👤'
      }
    ],
    parentTabList: [
      {
        pagePath: '/pages/home/home',
        text: '今日',
        icon: '📅'
      },
      {
        pagePath: '/pages/schedule/schedule',
        text: '周计划',
        icon: '📋'
      },
      {
        pagePath: '/pages/my/my',
        text: '我的',
        icon: '👤'
      }
    ],
    tabList: []
  },
  
  attached: function() {
    this.updateTabList()
  },
  
  methods: {
    updateTabList: function() {
      const userInfo = app.globalData.userInfo
      let role = 'child'
      
      if (userInfo && userInfo.role) {
        role = userInfo.role
      } else if (userInfo && userInfo.phone) {
        // 如果有用户信息但没有角色，默认显示孩子的 tab 列表（包含专注页）
        role = 'child'
      }
      
      const tabList = role === 'parent' ? this.data.parentTabList : this.data.childTabList
      this.setData({ tabList: tabList }, () => {
        // 在 tabList 更新完成后再设置当前索引
        this.setCurrentIndex()
      })
    },
    
    setCurrentIndex: function() {
      const pages = getCurrentPages()
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        const pagePath = '/' + currentPage.route
        
        const tabList = this.data.tabList
        const index = tabList.findIndex(item => item.pagePath === pagePath)
        if (index !== -1) {
          this.setData({
            currentIndex: index
          })
        }
      }
    },
    
    switchTab: function(e) {
      const path = e.currentTarget.dataset.path
      const index = parseInt(e.currentTarget.dataset.index)
      
      if (index !== this.data.currentIndex) {
        this.setData({
          currentIndex: index
        })
        
        wx.switchTab({
          url: path
        })
      }
    }
  }
})