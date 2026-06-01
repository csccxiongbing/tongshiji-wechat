const app = getApp()

Page({
  data: {
    points: 0,
    level: 1,
    pointsHistory: [],
    tasks: [
      { name: '完成任务', desc: '完成每日日程任务', icon: '✅', points: 10, bgColor: '#B5FFD9' },
      { name: '连续打卡', desc: '连续打卡7天', icon: '🔥', points: 50, bgColor: '#FFB5B5' },
      { name: '番茄专注', desc: '完成一次番茄钟', icon: '🍅', points: 20, bgColor: '#FFE4B5' },
      { name: '家庭互动', desc: '邀请家人加入', icon: '👨‍👩‍👧', points: 30, bgColor: '#B5E3FF' }
    ],
    rewards: [
      { name: '小星星徽章', icon: '⭐', cost: 100 },
      { name: '小太阳徽章', icon: '☀️', cost: 200 },
      { name: '皇冠徽章', icon: '👑', cost: 500 },
      { name: '神秘礼物', icon: '🎁', cost: 1000 }
    ]
  },
  
  onShow: function() {
    this.loadPoints()
  },
  
  loadPoints: function() {
    const points = app.globalData.points || 150
    const history = app.globalData.pointsHistory || [
      { id: 1, amount: 10, reason: '完成早餐任务', time: '2026/5/29 08:30', balance: 150 },
      { id: 2, amount: 20, reason: '完成番茄专注', time: '2026/5/28 16:00', balance: 140 },
      { id: 3, amount: 10, reason: '完成午餐任务', time: '2026/5/28 12:00', balance: 120 },
      { id: 4, amount: 50, reason: '连续打卡奖励', time: '2026/5/27 20:00', balance: 110 }
    ]
    
    let level = 1
    if (points >= 500) level = 5
    else if (points >= 300) level = 4
    else if (points >= 200) level = 3
    else if (points >= 100) level = 2
    
    this.setData({
      points: points,
      level: level,
      pointsHistory: history
    })
  },
  
  exchangeReward: function(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const reward = this.data.rewards[index]
    
    if (this.data.points < reward.cost) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '确认兑换',
      content: `确定要花费${reward.cost}积分兑换${reward.name}吗？`,
      success: (res) => {
        if (res.confirm) {
          app.addPoints(-reward.cost, `兑换${reward.name}`)
          
          wx.showToast({
            title: '兑换成功',
            icon: 'success'
          })
          
          this.loadPoints()
        }
      }
    })
  }
})