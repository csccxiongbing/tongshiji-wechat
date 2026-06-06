const app = getApp()

Page({
  data: {
    pointsHistory: [],
    wishExchangeHistory: [],
    childMembers: [],
    timeOptions: [
      { label: '全部', value: 'all' },
      { label: '近一周', value: 'week' },
      { label: '近一个月', value: 'month' },
      { label: '近半年', value: 'halfYear' }
    ],
    typeOptions: [
      { label: '全部', value: 'all' },
      { label: '积分', value: 'points' },
      { label: '心愿', value: 'wish' }
    ],
    memberOptions: [
      { label: '全部', value: 'all' }
    ],
    selectedTime: 'all',
    selectedType: 'all',
    selectedMember: 'all',
    selectedTimeIndex: 0,
    selectedTypeIndex: 0,
    selectedMemberIndex: 0,
    filteredPointsHistory: [],
    filteredWishHistory: [],
    displayedPointsHistory: [],
    displayedWishHistory: [],
    pageSize: 15,
    pointsPage: 1,
    wishesPage: 1
  },
  
  onShow: function() {
    this.loadData()
  },
  
  loadData: async function() {
    wx.showLoading({ title: '加载中...' })
    
    try {
      await app.getPointsHistory()
      await app.loadWishExchangeHistory()
      await app.loadFamilyMembers()
      
      const pointsHistory = this.formatPointsHistory(app.globalData.pointsHistory || [])
      const wishExchangeHistory = app.globalData.wishExchangeHistory || []
      
      const familyMembers = app.globalData.familyMembers?.members || []
      const childMembers = familyMembers.filter(m => m.role === 'child')
      
      const memberOptions = [
        { label: '全部', value: 'all' },
        ...childMembers.map(m => ({ label: m.name, value: m.name }))
      ]
      
      this.setData({
        pointsHistory,
        wishExchangeHistory,
        childMembers,
        memberOptions
      })
      
      this.applyFilters()
    } catch (error) {
      console.error('加载数据错误:', error)
    }
    
    wx.hideLoading()
  },
  
  formatPointsHistory: function(history) {
    return history.map(item => {
      let timeStr = ''
      if (item.createdAt) {
        const date = new Date(item.createdAt)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hour = String(date.getHours()).padStart(2, '0')
        const minute = String(date.getMinutes()).padStart(2, '0')
        timeStr = `${year}-${month}-${day} ${hour}:${minute}`
      }
      
      return {
        ...item,
        id: item._id || item.id,
        time: timeStr || item.time
      }
    }).sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return timeB - timeA
    })
  },
  
  formatDate: function(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },
  
  onTimeChange: function(e) {
    const index = e.detail.value
    const option = this.data.timeOptions[index]
    this.setData({
      selectedTimeIndex: index,
      selectedTime: option.value,
      pointsPage: 1,
      wishesPage: 1
    })
    this.applyFilters()
  },
  
  onTypeChange: function(e) {
    const index = e.detail.value
    const option = this.data.typeOptions[index]
    this.setData({
      selectedTypeIndex: index,
      selectedType: option.value,
      pointsPage: 1,
      wishesPage: 1
    })
  },
  
  onMemberChange: function(e) {
    const index = e.detail.value
    const option = this.data.memberOptions[index]
    this.setData({
      selectedMemberIndex: index,
      selectedMember: option.value,
      pointsPage: 1,
      wishesPage: 1
    })
    this.applyFilters()
  },
  
  loadMorePoints: function() {
    const { pointsPage, pageSize, filteredPointsHistory, displayedPointsHistory } = this.data
    const nextPage = pointsPage + 1
    const startIndex = pointsPage * pageSize
    const endIndex = nextPage * pageSize
    
    const newItems = filteredPointsHistory.slice(startIndex, endIndex)
    const newDisplayed = [...displayedPointsHistory, ...newItems]
    
    this.setData({
      displayedPointsHistory: newDisplayed,
      pointsPage: nextPage
    })
  },
  
  loadMoreWishes: function() {
    const { wishesPage, pageSize, filteredWishHistory, displayedWishHistory } = this.data
    const nextPage = wishesPage + 1
    const startIndex = wishesPage * pageSize
    const endIndex = nextPage * pageSize
    
    const newItems = filteredWishHistory.slice(startIndex, endIndex)
    const newDisplayed = [...displayedWishHistory, ...newItems]
    
    this.setData({
      displayedWishHistory: newDisplayed,
      wishesPage: nextPage
    })
  },
  
  applyFilters: function() {
    const { pointsHistory, wishExchangeHistory, selectedTime, selectedMember, pageSize } = this.data
    const now = new Date()
    
    let startTime = null
    if (selectedTime === 'week') {
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (selectedTime === 'month') {
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (selectedTime === 'halfYear') {
      startTime = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
    }
    
    const filteredPoints = pointsHistory.filter(item => {
      if (startTime) {
        const itemTime = item.createdAt ? new Date(item.createdAt) : null
        if (!itemTime || itemTime < startTime) {
          return false
        }
      }
      if (selectedMember !== 'all') {
        if (item.memberName !== selectedMember) {
          return false
        }
      }
      return true
    })
    
    const filteredWishes = wishExchangeHistory.filter(item => {
      if (startTime) {
        const itemTime = item.exchangeTime ? new Date(item.exchangeTime) : null
        if (!itemTime || itemTime < startTime) {
          return false
        }
      }
      if (selectedMember !== 'all') {
        if (item.memberName !== selectedMember) {
          return false
        }
      }
      return true
    })
    
    const displayedPoints = filteredPoints.slice(0, pageSize)
    const displayedWishes = filteredWishes.slice(0, pageSize)
    
    this.setData({
      filteredPointsHistory: filteredPoints,
      filteredWishHistory: filteredWishes,
      displayedPointsHistory: displayedPoints,
      displayedWishHistory: displayedWishes,
      pointsPage: 1,
      wishesPage: 1
    })
  }
})
