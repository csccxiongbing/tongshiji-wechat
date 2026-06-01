const app = getApp()

Page({
  data: {
    wishPoints: 0,
    level: 1,
    history: [],
    tasks: [
      { name: '完成任务', desc: '完成每日日程任务', icon: '✅', points: 5, bgColor: '#B5FFD9' },
      { name: '连续打卡', desc: '连续打卡7天', icon: '🔥', points: 20, bgColor: '#FFB5B5' },
      { name: '番茄专注', desc: '完成一次番茄钟', icon: '🍅', points: 10, bgColor: '#FFE4B5' },
      { name: '家庭互动', desc: '邀请家人加入', icon: '👨‍👩‍👧', points: 15, bgColor: '#B5E3FF' }
    ],
    rewards: [
      { name: '小星星', icon: '⭐', cost: 50 },
      { name: '小太阳', icon: '☀️', cost: 100 },
      { name: '皇冠', icon: '👑', cost: 300 },
      { name: '神秘礼物', icon: '🎁', cost: 500 }
    ]
  },
  
  onShow: function() {
    this.loadData()
  },
  
  loadData: function() {
    const points = app.globalData.points || 150
    const history = app.globalData.pointsHistory || [
      { id: 1, amount: 5, reason: '完成早餐任务', time: '2026-05-29 08:30', balance: 150 },
      { id: 2, amount: 10, reason: '完成番茄专注', time: '2026-05-28 16:00', balance: 145 },
      { id: 3, amount: 5, reason: '完成午餐任务', time: '2026-05-28 12:00', balance: 135 },
      { id: 4, amount: 20, reason: '连续打卡奖励', time: '2026-05-27 20:00', balance: 130 }
    ]
    
    let level = 1
    if (points >= 300) level = 5
    else if (points >= 200) level = 4
    else if (points >= 100) level = 3
    else if (points >= 50) level = 2
    
    this.setData({
      wishPoints: points,
      level: level,
      history: history
    })
  },
  
  exchangeReward: function(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const reward = this.data.rewards[index]
    
    if (this.data.wishPoints < reward.cost) {
      wx.showToast({
        title: '心愿不足',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '确认兑换',
      content: `确定花费${reward.cost}个心愿兑换${reward.name}吗？`,
      success: (res) => {
        if (res.confirm) {
          app.addPoints(-reward.cost, `兑换${reward.name}`)
          
          wx.showToast({
            title: '兑换成功',
            icon: 'success'
          })
          
          this.loadData()
        }
      }
    })
  }
})