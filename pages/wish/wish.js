const app = getApp()

Page({
  data: {
    familyMembers: [],
    childMembers: [],
    childMemberNames: [],
    selectedMember: '',
    selectedMemberIndex: 0,
    memberPoints: {},
    wishes: [],
    filteredWishes: [],
    wishExchangeHistory: [],
    showAddModal: false,
    showPointsModal: false,
    pointsModalType: 'add',
    newWish: {
      name: '',
      points: '',
      weeklyLimitEnabled: false,
      weeklyLimitCount: '',
      assignedTo: [],
      icon: '🎁',
      background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)'
    },
    pointsForm: {
      memberName: '',
      amount: '',
      reason: ''
    },
    icons: ['🎁', '🎮', '📚', '🎨', '🏆', '⭐', '🍭', '🎯', '🚀', '🌈']
  },
  
  backgrounds: [
    'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ],

  onShow: async function() {
    if (!app.checkLogin()) return
    await this.loadData()
  },

  loadData: async function() {
    await app.loadWishes()
    await app.loadWishExchangeHistory()
    await app.loadFamilyMembers()
    
    const familyMembers = app.globalData.familyMembers?.members || []
    const childMembers = familyMembers.filter(m => m.role === 'child')
    const childMemberNames = childMembers.map(m => m.name)
    const selectedMember = childMembers.length > 0 ? childMembers[0].name : ''
    
    this.setData({
      familyMembers,
      childMembers,
      childMemberNames,
      selectedMember,
      selectedMemberIndex: 0,
      memberPoints: app.globalData.memberPoints || {},
      wishes: app.globalData.wishes || [],
      wishExchangeHistory: app.globalData.wishExchangeHistory || []
    })
    
    this.filterWishes(selectedMember)
  },
  
  filterWishes: function(memberName) {
    const wishes = this.data.wishes || []
    const filtered = wishes.filter(wish => {
      if (!wish.assignedTo || wish.assignedTo.length === 0) {
        return true
      }
      return wish.assignedTo.includes(memberName)
    })
    this.setData({
      filteredWishes: filtered
    })
  },

  selectMember: function(e) {
    const memberName = e.currentTarget.dataset.name
    this.setData({
      selectedMember: memberName
    })
    this.filterWishes(memberName)
  },
  
  onWishItemTap: async function(e) {
    const currentMember = app.globalData.userInfo
    const isParent = currentMember && currentMember.role === 'parent'
    
    if (isParent) {
      this.showEditModal(e)
    } else {
      await this.exchangeWish(e)
    }
  },

  onWishLongPress: function(e) {
    const currentMember = app.globalData.userInfo
    const isParent = currentMember && currentMember.role === 'parent'
    
    if (isParent) {
      this.showEditModal(e)
    }
  },

  showEditModal: function(e) {
    const wishId = e.currentTarget.dataset.id
    // 直接从this.data.wishes中获取完整的心愿数据
    const wish = this.data.wishes.find(w => w.id === wishId)
    
    if (!wish) {
      return
    }
    
    // 设置childMembers数组，标记已分配的成员为选中状态
    const childMembers = this.data.childMembers.map(m => ({
      ...m,
      isSelected: wish.assignedTo && wish.assignedTo.includes(m.name)
    }))
    
    this.setData({
      showAddModal: true,
      childMembers,
      newWish: {
        id: wish.id,
        name: wish.name,
        points: wish.points,
        weeklyLimitEnabled: !!wish.weeklyLimitEnabled, // 确保是布尔值
        weeklyLimitCount: wish.weeklyLimitCount,
        assignedTo: wish.assignedTo || [],
        icon: wish.icon,
        background: wish.background
      }
    })
  },

  showAddModal: function() {
    const childMembers = this.data.childMembers.map(m => ({
      ...m,
      isSelected: false
    }))
    
    this.setData({
      showAddModal: true,
      childMembers,
      newWish: {
        name: '',
        points: '',
        weeklyLimitEnabled: false,
        weeklyLimitCount: '',
        assignedTo: [],
        icon: '🎁',
        background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)'
      }
    })
  },

  hideAddModal: function() {
    this.setData({
      showAddModal: false
    })
  },

  stopPropagation: function() {
  },

  onWishNameInput: function(e) {
    const name = e.detail.value
    const newWish = this.data.newWish
    
    if (!newWish.id || (newWish.id && newWish.name !== name)) {
      const icon = this.getIconByName(name)
      this.setData({
        'newWish.name': name,
        'newWish.icon': icon
      })
    } else {
      this.setData({
        'newWish.name': name
      })
    }
  },

  getIconByName: function(name) {
    if (!name) return '🎁'
    
    const lowerName = name.toLowerCase()
    const keywords = ['游戏', '玩', '学习', '书', '画画', '音乐', '歌', '运动', '球', '跑步', '游泳', '食物', '吃', '零食', '蛋糕', '冰淇淋', '水果', '玩具', '礼物', '动物', '狗', '猫', '兔', '旅游', '旅行', '电视', '电影', '机器人', '乐高', '积木', '滑板', '轮滑', '自行车', '公主', '芭比', '车', '飞机', '火箭', '恐龙', '星星', '奖励', '奖杯', '手工', '舞蹈', '跳舞', '钢琴', '吉他', '足球', '篮球', '爬山', '露营', '钓鱼', '做饭', '购物', '公园', '花园', '花', '生日', '派对', '节日', '圣诞', '新年', '红包', '手机', '电脑', '平板', '手表', '鞋子', '衣服', '裙子', '帽子', '书包', '文具', '笔', '拼图', '魔方', '气球', '风筝', '泡泡', '水枪', '沙滩', '城堡', '帐篷', '科学', '实验', '数学', '英语', '语文', '作业', '考试', '满分', '表扬', '好', '棒', '优秀', '进步', '努力', '加油', '开心', '快乐', '幸福', '爱', '喜欢', '可爱', '漂亮', '美丽', '帅', '酷', '超级', '英雄', '奥特曼', '蜘蛛侠', '超人', '蝙蝠侠', '钢铁侠', '美国队长', '绿巨人', '雷神', '闪电侠', '神奇女侠', '海王', '格鲁特']
    
    const iconMap = {
      '游戏': ['🎮', '🎯', '🎰'],
      '玩': ['🎯', '🎮', '🎲'],
      '学习': ['📚', '🎓', '✏️'],
      '书': ['📚', '📖'],
      '画画': ['🎨', '🖍️'],
      '音乐': ['🎵', '🎸'],
      '歌': ['🎤', '🎵'],
      '运动': ['⚽', '🏀', '🏃'],
      '球': ['⚽', '🏀', '🎾'],
      '跑步': ['🏃', '👟'],
      '游泳': ['🏊', '💦'],
      '食物': ['🍕', '🍔', '🍟'],
      '吃': ['🍕', '🍔'],
      '零食': ['🍬', '🍭', '🍫'],
      '蛋糕': ['🎂', '🍰'],
      '冰淇淋': ['🍦', '🍦'],
      '水果': ['🍎', '🍊', '🍇'],
      '玩具': ['🧸', '🎁'],
      '礼物': ['🎁', '🎀'],
      '动物': ['🐶', '🐱', '🐰'],
      '狗': ['🐶', '🐕'],
      '猫': ['🐱', '🐈'],
      '兔': ['🐰', '🐇'],
      '旅游': ['✈️', '🗺️'],
      '旅行': ['✈️', '🗺️'],
      '电视': ['📺', '🎬'],
      '电影': ['🎬', '🎥'],
      '机器人': ['🤖', '🦾'],
      '乐高': ['🧱', '🔧'],
      '积木': ['🧱', '🔧'],
      '滑板': ['🛹', '🛼'],
      '轮滑': ['🛼', '🛹'],
      '自行车': ['🚲', '🚴'],
      '公主': ['👸', '👑'],
      '芭比': ['👸', '💄'],
      '车': ['🚗', '🚙'],
      '飞机': ['✈️', '🛩️'],
      '火箭': ['🚀', '🛸'],
      '恐龙': ['🦕', '🦖'],
      '星星': ['⭐', '🌟'],
      '奖励': ['🏆', '🎖️'],
      '奖杯': ['🏆', '🎖️'],
      '手工': ['✂️', '✏️'],
      '舞蹈': ['💃', '🩰'],
      '跳舞': ['💃', '🕺'],
      '钢琴': ['🎹', '🎼'],
      '吉他': ['🎸', '🎵'],
      '足球': ['⚽', '🥅'],
      '篮球': ['🏀', '🏀'],
      '爬山': ['🏔️', '⛰️'],
      '露营': ['🏕️', '⛺'],
      '钓鱼': ['🎣', '🐟'],
      '做饭': ['🍳', '👩‍🍳'],
      '购物': ['🛒', '🛍️'],
      '公园': ['🏞️', '🌳'],
      '花园': ['🌷', '🌹'],
      '花': ['🌸', '🌺'],
      '生日': ['🎂', '🎁'],
      '派对': ['🎉', '🎊'],
      '节日': ['🎄', '🎊'],
      '圣诞': ['🎄', '🎅'],
      '新年': ['🎊', '🧧'],
      '红包': ['🧧', '💰'],
      '手机': ['📱', '📲'],
      '电脑': ['💻', '🖥️'],
      '平板': ['📱', '💻'],
      '手表': ['⌚', '⌚'],
      '鞋子': ['👟', '👠'],
      '衣服': ['👕', '👗'],
      '裙子': ['👗', '👚'],
      '帽子': ['🎩', '🧢'],
      '书包': ['🎒', '📚'],
      '文具': ['✏️', '📝'],
      '笔': ['✏️', '✒️'],
      '拼图': ['🧩', '🧩'],
      '魔方': ['🎲', '🧩'],
      '气球': ['🎈', '🎈'],
      '风筝': ['🪁', '🪁'],
      '泡泡': ['🫧', '🫧'],
      '水枪': ['🔫', '💦'],
      '沙滩': ['🏖️', '🏝️'],
      '城堡': ['🏰', '🏯'],
      '帐篷': ['⛺', '⛺'],
      '科学': ['🔬', '🧪'],
      '实验': ['🧪', '⚗️'],
      '数学': ['➕', '🔢'],
      '英语': ['🇬🇧', '📚'],
      '语文': ['📚', '📖'],
      '作业': ['📝', '✏️'],
      '考试': ['📝', '✏️'],
      '满分': ['💯', '⭐'],
      '表扬': ['👍', '👏'],
      '好': ['👍', '✨'],
      '棒': ['👍', '🌟'],
      '优秀': ['🏆', '⭐'],
      '进步': ['📈', '🚀'],
      '努力': ['💪', '📚'],
      '加油': ['💪', '👏'],
      '开心': ['😊', '🎉'],
      '快乐': ['😄', '🎊'],
      '幸福': ['❤️', '💕'],
      '爱': ['❤️', '💖'],
      '喜欢': ['❤️', '💕'],
      '可爱': ['🥰', '😊'],
      '漂亮': ['✨', '💎'],
      '美丽': ['✨', '🌟'],
      '帅': ['😎', '🤵'],
      '酷': ['😎', '🕶️'],
      '超级': ['🦸', '💪'],
      '英雄': ['🦸', '🛡️'],
      '奥特曼': ['🦸', '💥'],
      '蜘蛛侠': ['🕷️', '🦸'],
      '超人': ['🦸', '👊'],
      '蝙蝠侠': ['🦇', '🦸'],
      '钢铁侠': ['🦾', '🦸'],
      '美国队长': ['🛡️', '🦸'],
      '绿巨人': ['💪', '🟢'],
      '雷神': ['⚡', '🔨'],
      '闪电侠': ['⚡', '🏃'],
      '神奇女侠': ['🦸‍♀️', '🛡️'],
      '海王': ['🌊', '🐟'],
      '格鲁特': ['🌱', '🌲']
    }
    
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        const icons = iconMap[keyword] || ['🎁']
        return icons[Math.floor(Math.random() * icons.length)]
      }
    }
    
    return '🎁'
  },

  onWishPointsInput: function(e) {
    this.setData({
      'newWish.points': e.detail.value
    })
  },

  onWeeklyLimitToggle: function(e) {
    this.setData({
      'newWish.weeklyLimitEnabled': e.detail.value
    })
  },

  onWeeklyLimitCountInput: function(e) {
    this.setData({
      'newWish.weeklyLimitCount': e.detail.value
    })
  },

  selectIcon: function(e) {
    const icon = e.currentTarget.dataset.icon
    this.setData({
      'newWish.icon': icon
    })
  },

  toggleAssignedMember: function(e) {
    const memberName = e.currentTarget.dataset.name
    const index = e.currentTarget.dataset.index
    
    const updatedChildMembers = this.data.childMembers.map((m, i) => {
      if (i === index || m.name === memberName) {
        return {
          ...m,
          isSelected: !m.isSelected
        }
      }
      return m
    })
    
    let assignedTo = [...this.data.newWish.assignedTo]
    const selectedIndex = assignedTo.indexOf(memberName)
    if (selectedIndex > -1) {
      assignedTo.splice(selectedIndex, 1)
    } else {
      assignedTo.push(memberName)
    }
    
    this.setData({
      childMembers: updatedChildMembers,
      'newWish.assignedTo': assignedTo
    })
  },

  saveWish: async function() {
    const { newWish } = this.data
    
    if (!newWish.name.trim()) {
      wx.showToast({
        title: '请输入心愿名称',
        icon: 'none'
      })
      return
    }
    
    if (!newWish.points || parseInt(newWish.points) <= 0) {
      wx.showToast({
        title: '请输入有效的积分',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    try {
      let result
      
      if (newWish.id) {
        result = await app.updateWish(newWish.id, {
          name: newWish.name,
          points: parseInt(newWish.points),
          weeklyLimitEnabled: newWish.weeklyLimitEnabled,
          weeklyLimitCount: newWish.weeklyLimitEnabled ? parseInt(newWish.weeklyLimitCount || 0) : 0,
          assignedTo: newWish.assignedTo,
          icon: newWish.icon,
          background: newWish.background
        })
      } else {
        const randomBackground = this.backgrounds[Math.floor(Math.random() * this.backgrounds.length)]
        
        const wishData = {
          name: newWish.name,
          points: parseInt(newWish.points),
          weeklyLimitEnabled: newWish.weeklyLimitEnabled,
          weeklyLimitCount: newWish.weeklyLimitEnabled ? parseInt(newWish.weeklyLimitCount || 0) : 0,
          assignedTo: newWish.assignedTo,
          icon: newWish.icon,
          background: randomBackground
        }
        
        result = await app.addWish(wishData)
      }
      
      wx.hideLoading()
      
      if (result.success) {
        wx.showToast({
          title: newWish.id ? '修改成功' : '添加成功',
          icon: 'success'
        })
        this.hideAddModal()
        await this.loadData()
      } else {
        wx.showToast({
          title: result.message || (newWish.id ? '修改失败' : '添加失败'),
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      })
    }
  },

  deleteWishFromModal: function(e) {
    const wishId = e.currentTarget.dataset.id
    const wishName = e.currentTarget.dataset.name
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除心愿"${wishName}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          
          try {
            const result = await app.deleteWish(wishId)
            wx.hideLoading()
            
            if (result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              this.hideAddModal()
              await this.loadData()
            } else {
              wx.showToast({
                title: result.message || '删除失败',
                icon: 'none'
              })
            }
          } catch (error) {
            wx.hideLoading()
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },
  
  deleteWish: function(e) {
    const wishId = e.currentTarget.dataset.id
    const wishName = e.currentTarget.dataset.name
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除心愿"${wishName}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          
          try {
            const result = await app.deleteWish(wishId)
            wx.hideLoading()
            
            if (result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              await this.loadData()
            } else {
              wx.showToast({
                title: result.message || '删除失败',
                icon: 'none'
              })
            }
          } catch (error) {
            wx.hideLoading()
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  exchangeWish: function(e) {
    const wishId = e.currentTarget.dataset.id
    const wishName = e.currentTarget.dataset.name
    const wishPoints = e.currentTarget.dataset.points
    const memberName = this.data.selectedMember
    
    if (!memberName) {
      wx.showToast({
        title: '请选择成员',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '确认兑换',
      content: `确定用${wishPoints}积分兑换"${wishName}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '兑换中...' })
          
          try {
            const result = await app.exchangeWish(wishId, memberName)
            wx.hideLoading()
            
            if (result.success) {
              wx.showToast({
                title: '兑换成功',
                icon: 'success'
              })
              await this.loadData()
            } else {
              wx.showToast({
                title: result.message || '兑换失败',
                icon: 'none'
              })
            }
          } catch (error) {
            wx.hideLoading()
            wx.showToast({
              title: '兑换失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  canExchange: function(wish) {
    const memberName = this.data.selectedMember
    if (!memberName) return false
    
    const memberPoints = this.data.memberPoints[memberName] || 0
    if (memberPoints < wish.points) return false
    
    if (wish.assignedTo.length > 0 && !wish.assignedTo.includes(memberName)) return false
    
    return true
  },

  formatDate: function(dateStr) {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  showAddPointsModal: function() {
    const childMembers = this.data.childMembers
    const defaultMember = childMembers.length > 0 ? childMembers[0].name : ''
    
    this.setData({
      showPointsModal: true,
      pointsModalType: 'add',
      pointsForm: {
        memberName: defaultMember,
        amount: '',
        reason: ''
      }
    })
  },

  showSubtractPointsModal: function() {
    const childMembers = this.data.childMembers
    const defaultMember = childMembers.length > 0 ? childMembers[0].name : ''
    
    this.setData({
      showPointsModal: true,
      pointsModalType: 'subtract',
      pointsForm: {
        memberName: defaultMember,
        amount: '',
        reason: ''
      }
    })
  },

  hidePointsModal: function() {
    this.setData({
      showPointsModal: false
    })
  },

  onPointsMemberChange: function(e) {
    const index = parseInt(e.detail.value)
    const memberName = this.data.childMemberNames[index] || ''
    this.setData({
      'pointsForm.memberName': memberName,
      selectedMemberIndex: index
    })
  },

  onPointsAmountInput: function(e) {
    this.setData({
      'pointsForm.amount': e.detail.value
    })
  },

  onPointsReasonInput: function(e) {
    this.setData({
      'pointsForm.reason': e.detail.value
    })
  },

  submitPoints: async function() {
    const { pointsModalType, pointsForm } = this.data
    
    if (!pointsForm.memberName) {
      wx.showToast({
        title: '请选择孩子',
        icon: 'none'
      })
      return
    }
    
    const amount = parseInt(pointsForm.amount)
    if (!amount || amount <= 0) {
      wx.showToast({
        title: '请输入有效的积分数量',
        icon: 'none'
      })
      return
    }
    
    let reason = pointsForm.reason.trim()
    if (!reason) {
      reason = pointsModalType === 'add' ? '发放积分' : '扣积分'
    }
    
    wx.showLoading({ title: '处理中...' })
    
    try {
      let result
      if (pointsModalType === 'add') {
        result = await app.addPoints(pointsForm.memberName, amount, reason)
      } else {
        result = await app.subtractPoints(pointsForm.memberName, amount, reason)
      }
      
      wx.hideLoading()
      
      if (result.success) {
        wx.showToast({
          title: pointsModalType === 'add' ? '发放成功' : '扣除成功',
          icon: 'success'
        })
        this.hidePointsModal()
        await this.loadData()
      } else {
        wx.showToast({
          title: result.message || (pointsModalType === 'add' ? '发放失败' : '扣除失败'),
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: pointsModalType === 'add' ? '发放失败' : '扣除失败',
        icon: 'none'
      })
    }
  },

  goToPointsHistory: function() {
    wx.navigateTo({
      url: '/pages/points/points'
    })
  }
})