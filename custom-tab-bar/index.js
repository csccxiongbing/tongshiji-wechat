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
        pagePath: '/pages/monthly-schedule/monthly-schedule',
        text: '月计划',
        icon: '🗓️'
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
    this.setCurrentIndex()
  },
  
  methods: {
    updateTabList: function() {
      const userInfo = app.globalData.userInfo
      const role = userInfo?.role || 'child'
      const tabList = role === 'parent' ? this.data.parentTabList : this.data.childTabList
      this.setData({ tabList: tabList })
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