App({
  globalData: {
    users: [],
    userInfo: null,
    familyMembers: {},
    schedules: [],
    points: 0,
    memberPoints: {},
    pointsHistory: [],
    pomodoroHistory: [],
    pomodoroTaskInfo: null,
    wishes: [],
    wishExchangeHistory: [],
    rules: {
      points: [],
      badge: [],
      level: []
    }
  },
  
  API_BASE_URL: 'http://localhost:3000/api',
  
  onLaunch: function () {
    try {
      console.log('App初始化中...')
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo && typeof userInfo === 'object' && userInfo._id) {
        this.globalData.userInfo = userInfo
        console.log('加载用户信息成功:', userInfo)
        this.loadFamilyMembers()
        this.loadSchedules()
        this.loadPomodoroHistory()
        this.loadRules()
      }
    } catch (e) {
      console.error('数据加载错误:', e)
    }
  },

  logout: function() {
    try {
      wx.removeStorageSync('userInfo')
      wx.removeStorageSync('familyMembers')
      wx.removeStorageSync('memberPoints')
      wx.removeStorageSync('points')
      wx.removeStorageSync('schedules')
      wx.removeStorageSync('pointsHistory')
    } catch (e) {}
    this.globalData.userInfo = null
    this.globalData.familyMembers = {}
    this.globalData.schedules = []
    this.globalData.points = 0
    this.globalData.memberPoints = {}
    this.globalData.pointsHistory = []
    this.globalData.pomodoroHistory = []
    this.globalData.users = []
    wx.redirectTo({
      url: '/pages/login/login'
    })
  },
  
  checkLogin: function() {
    const userInfo = this.globalData.userInfo
    if (!userInfo || !userInfo._id) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return false
    }
    return true
  },

  request: function(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.API_BASE_URL + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json'
        },
        success: function(res) {
          if (res.data && res.data.success) {
            resolve(res.data)
          } else {
            reject(res.data ? res.data.message : '请求失败')
          }
        },
        fail: function(err) {
          reject(err.errMsg || '网络错误')
        }
      })
    })
  },
  
  registerUser: async function(userInfo) {
    try {
      const result = await this.request({
        url: '/users/register',
        method: 'POST',
        data: userInfo
      })
      
      if (result.success) {
        this.globalData.userInfo = result.user
        wx.setStorageSync('userInfo', result.user)
      }
      
      return result
    } catch (error) {
      console.error('注册用户错误:', error)
      return { success: false, message: error }
    }
  },
  
  loginUser: async function(phone) {
    try {
      const result = await this.request({
        url: '/users/login',
        method: 'POST',
        data: { phone }
      })
      
      if (result.success) {
        this.globalData.userInfo = result.user
        wx.setStorageSync('userInfo', result.user)
        
        if (result.user.familyId) {
          await this.loadFamilyMembers()
          await this.loadSchedules()
          await this.loadPomodoroHistory()
          await this.loadRules()
        }
      }
      
      return result
    } catch (error) {
      console.error('登录用户错误:', error)
      return { success: false, message: error }
    }
  },
  
  loadFamilyMembers: async function() {
    try {
      const userInfo = this.globalData.userInfo
      if (!userInfo || !userInfo.familyId) {
        this.globalData.familyMembers = { members: [] }
        return
      }
      
      const result = await this.request({
        url: '/families/' + userInfo.familyId,
        method: 'GET'
      })
      
      if (result.success) {
        this.globalData.familyMembers = result.family
        
        // 提取每个成员的积分，构建 memberPoints 对象
        const memberPoints = {}
        if (result.family && result.family.members) {
          result.family.members.forEach(member => {
            memberPoints[member.name] = member.points || 0
          })
        }
        this.globalData.memberPoints = memberPoints
        
        // 更新总积分
        const totalPoints = Object.values(memberPoints).reduce((sum, p) => sum + p, 0)
        this.globalData.points = totalPoints
        
        console.log('加载家庭成员成功，memberPoints:', memberPoints, '总积分:', totalPoints)
      }
    } catch (error) {
      console.error('加载家庭成员错误:', error)
    }
  },
  
  loadSchedules: async function() {
    try {
      const userInfo = this.globalData.userInfo
      if (!userInfo || !userInfo.familyId) {
        this.globalData.schedules = []
        return
      }
      
      const result = await this.request({
        url: '/schedules/family/' + userInfo.familyId,
        method: 'GET'
      })
      
      if (result.success) {
        this.globalData.schedules = result.schedules
      }
    } catch (error) {
      console.error('加载日程错误:', error)
    }
  },
  
  // 从数据库加载番茄钟历史记录（按当前用户+当前家庭）
  loadPomodoroHistory: async function() {
    try {
      const userInfo = this.globalData.userInfo
      if (!userInfo || !userInfo.familyId || !userInfo._id) {
        this.globalData.pomodoroHistory = []
        return
      }
      
      const result = await this.request({
        url: '/pomodoro/user/' + userInfo._id + '/family/' + userInfo.familyId,
        method: 'GET'
      })
      
      if (result.success) {
        this.globalData.pomodoroHistory = result.history
      }
    } catch (error) {
      console.error('加载番茄钟历史错误:', error)
    }
  },
  
  loadRules: async function() {
    try {
      const result = await this.request({
        url: '/rules/family',
        method: 'GET'
      })
      
      if (result.success) {
        const parseConditions = function(conditions) {
          if (!conditions) return {};
          if (typeof conditions === 'object') return conditions;
          try {
            if (typeof conditions === 'string') {
              let str = conditions;
              if (str.startsWith('@{') && str.endsWith('}')) {
                str = '{' + str.slice(2, -1) + '}';
                str = str.replace(/=/g, ':').replace(/True/g, 'true').replace(/False/g, 'false');
              }
              return JSON.parse(str);
            }
          } catch (e) {}
          return {};
        };
        
        const rules = result.rules;
        if (rules.points) {
          rules.points = rules.points.map(rule => ({
            ...rule,
            conditions: parseConditions(rule.conditions)
          }));
        }
        if (rules.badge) {
          rules.badge = rules.badge.map(rule => ({
            ...rule,
            conditions: parseConditions(rule.conditions)
          }));
        }
        if (rules.level) {
          rules.level = rules.level.map(rule => ({
            ...rule,
            conditions: parseConditions(rule.conditions)
          }));
        }
        
        this.globalData.rules = rules;
        console.log('加载规则成功:', rules);
      }
    } catch (error) {
      console.error('加载规则错误:', error);
    }
  },
  
  createFamily: async function(familyData) {
    try {
      const result = await this.request({
        url: '/families/create',
        method: 'POST',
        data: familyData
      })
      
      if (result.success) {
        this.globalData.familyMembers = result.family
        wx.setStorageSync('familyMembers', result.family)
        
        if (this.globalData.userInfo) {
          this.globalData.userInfo.familyId = result.family._id
          wx.setStorageSync('userInfo', this.globalData.userInfo)
        }
        
        // 重新加载以更新 memberPoints
        await this.loadFamilyMembers()
      }
      
      return result
    } catch (error) {
      console.error('创建家庭错误:', error)
      return { success: false, message: error }
    }
  },
  
  joinFamily: async function(inviteCode, phone, memberInfo) {
    try {
      const result = await this.request({
        url: '/families/join',
        method: 'POST',
        data: { inviteCode, phone, memberInfo }
      })
      
      if (result.success) {
        this.globalData.familyMembers = result.family
        wx.setStorageSync('familyMembers', result.family)
        
        if (this.globalData.userInfo) {
          this.globalData.userInfo.familyId = result.family._id
          wx.setStorageSync('userInfo', this.globalData.userInfo)
        }
        
        // 重新加载以更新 memberPoints
        await this.loadFamilyMembers()
      }
      
      return result
    } catch (error) {
      console.error('加入家庭错误:', error)
      return { success: false, message: error }
    }
  },
  
  addFamilyMember: async function(familyId, member) {
    try {
      const result = await this.request({
        url: '/families/' + familyId + '/members',
        method: 'POST',
        data: { member }
      })
      
      if (result.success) {
        this.globalData.familyMembers = result.family
        wx.setStorageSync('familyMembers', result.family)
        // 重新加载以更新 memberPoints
        await this.loadFamilyMembers()
      }
      
      return result
    } catch (error) {
      console.error('添加家庭成员错误:', error)
      return { success: false, message: error }
    }
  },
  
  updateFamilyMember: async function(familyId, index, memberData) {
    try {
      const result = await this.request({
        url: '/families/' + familyId + '/members/' + index,
        method: 'PUT',
        data: memberData
      })
      
      if (result.success) {
        this.globalData.familyMembers = result.family
        wx.setStorageSync('familyMembers', result.family)
        // 重新加载以更新 memberPoints
        await this.loadFamilyMembers()
      }
      
      return result
    } catch (error) {
      console.error('更新家庭成员错误:', error)
      return { success: false, message: error }
    }
  },
  
  deleteFamilyMember: async function(familyId, index) {
    try {
      const result = await this.request({
        url: '/families/' + familyId + '/members/' + index,
        method: 'DELETE'
      })
      
      if (result.success) {
        this.globalData.familyMembers = result.family
        wx.setStorageSync('familyMembers', result.family)
        // 重新加载以更新 memberPoints
        await this.loadFamilyMembers()
      }
      
      return result
    } catch (error) {
      console.error('删除家庭成员错误:', error)
      return { success: false, message: error }
    }
  },
  
  addSchedule: async function(scheduleData) {
    try {
      const userInfo = this.globalData.userInfo
      if (!userInfo || !userInfo.familyId) {
        return { success: false, message: '用户未登录或未加入家庭' }
      }
      
      const result = await this.request({
        url: '/schedules',
        method: 'POST',
        data: { familyId: userInfo.familyId, ...scheduleData }
      })
      
      if (result.success) {
        await this.loadSchedules()
      }
      
      return result
    } catch (error) {
      console.error('添加日程错误:', error)
      return { success: false, message: error }
    }
  },
  
  updateSchedule: async function(scheduleId, scheduleData) {
    try {
      const result = await this.request({
        url: '/schedules/' + scheduleId,
        method: 'PUT',
        data: scheduleData
      })
      
      if (result.success) {
        await this.loadSchedules()
      }
      
      return result
    } catch (error) {
      console.error('更新日程错误:', error)
      return { success: false, message: error }
    }
  },
  
  deleteSchedule: async function(scheduleId) {
    try {
      const result = await this.request({
        url: '/schedules/' + scheduleId,
        method: 'DELETE'
      })
      
      if (result.success) {
        await this.loadSchedules()
      }
      
      return result
    } catch (error) {
      console.error('删除日程错误:', error)
      return { success: false, message: error }
    }
  },
  
  loadTodaySchedules: async function() {
    try {
      const userInfo = this.globalData.userInfo
      if (!userInfo || !userInfo.familyId) {
        this.globalData.todaySchedules = []
        return { success: false, message: '用户未登录' }
      }
      
      console.log('加载今日日程 - familyId:', userInfo.familyId)
      
      const result = await this.request({
        url: '/schedules/today/' + userInfo.familyId,
        method: 'GET'
      })
      
      if (result.success) {
        this.globalData.todaySchedules = result.schedules
        console.log('今日日程加载成功:', result.schedules.length, '条')
      }
      
      return result
    } catch (error) {
      const errorMsg = typeof error === 'string' ? error : (error && error.message) || '未知错误'
      console.error('加载今日日程错误:', errorMsg)
      return { success: false, message: errorMsg }
    }
  },
  
  getDailyCompletion: async function(scheduleId, date) {
    try {
      const result = await this.request({
        url: `/schedules/${scheduleId}/completions/${date}`,
        method: 'GET'
      })
      return result
    } catch (error) {
      console.error('获取完成记录错误:', error)
      return { success: false, message: error }
    }
  },
  
  updateDailyCompletion: async function(scheduleId, date, memberName, completed) {
    try {
      const userInfo = this.globalData.userInfo
      const result = await this.request({
        url: `/schedules/${scheduleId}/completions/${date}`,
        method: 'POST',
        data: {
          memberName,
          completed,
          userId: userInfo._id
        }
      })
      
      if (result.success) {
        await this.loadFamilyMembers()
      }
      
      return result
    } catch (error) {
      console.error('更新完成记录错误:', error)
      return { success: false, message: error }
    }
  },

  getCompletedTaskStats: async function(familyId, memberName = null) {
    try {
      let url = `/schedules/stats/completed/${familyId}`
      if (memberName) {
        url += `?memberName=${encodeURIComponent(memberName)}`
      }
      
      const result = await this.request({
        url: url,
        method: 'GET'
      })
      
      return result
    } catch (error) {
      console.error('获取完成任务统计错误:', error)
      return { success: false, message: error }
    }
  },
  
  loadWishes: async function() {
    try {
      const userInfo = this.globalData.userInfo
      if (!userInfo || !userInfo.familyId) {
        this.globalData.wishes = []
        return
      }
      
      const result = await this.request({
        url: '/wishes/family/' + userInfo.familyId,
        method: 'GET'
      })
      
      if (result.success) {
        this.globalData.wishes = result.wishes
        wx.setStorageSync('wishes', result.wishes)
      }
    } catch (error) {
      console.error('加载心愿错误:', error)
    }
  },
  
  loadWishExchangeHistory: async function() {
    try {
      const userInfo = this.globalData.userInfo
      if (!userInfo || !userInfo.familyId) {
        this.globalData.wishExchangeHistory = []
        return
      }
      
      const result = await this.request({
        url: '/wishes/history/family/' + userInfo.familyId,
        method: 'GET'
      })
      
      if (result.success) {
        this.globalData.wishExchangeHistory = result.history
        wx.setStorageSync('wishExchangeHistory', result.history)
      }
    } catch (error) {
      console.error('加载心愿兑换历史错误:', error)
    }
  },
  
  addWish: async function(wishData) {
    try {
      const userInfo = this.globalData.userInfo
      if (!userInfo || !userInfo.familyId) {
        return { success: false, message: '用户未登录或未加入家庭' }
      }
      
      const result = await this.request({
        url: '/wishes',
        method: 'POST',
        data: { familyId: userInfo.familyId, ...wishData }
      })
      
      if (result.success) {
        await this.loadWishes()
      }
      
      return result
    } catch (error) {
      console.error('添加心愿错误:', error)
      return { success: false, message: error }
    }
  },
  
  updateWish: async function(wishId, wishData) {
    try {
      const result = await this.request({
        url: '/wishes/' + wishId,
        method: 'PUT',
        data: wishData
      })
      
      if (result.success) {
        await this.loadWishes()
      }
      
      return result
    } catch (error) {
      console.error('更新心愿错误:', error)
      return { success: false, message: error }
    }
  },
  
  deleteWish: async function(wishId) {
    try {
      const result = await this.request({
        url: '/wishes/' + wishId,
        method: 'DELETE'
      })
      
      if (result.success) {
        await this.loadWishes()
      }
      
      return result
    } catch (error) {
      console.error('删除心愿错误:', error)
      return { success: false, message: error }
    }
  },
  
  exchangeWish: async function(wishId, memberName) {
    try {
      const userInfo = this.globalData.userInfo
      if (!userInfo || !userInfo.familyId) {
        return { success: false, message: '用户未登录或未加入家庭' }
      }
      
      const result = await this.request({
        url: '/wishes/exchange',
        method: 'POST',
        data: {
          familyId: userInfo.familyId,
          userId: userInfo._id || userInfo.id,
          wishId,
          memberName
        }
      })
      
      if (result.success) {
        // 重新加载家庭成员以更新积分
        await this.loadFamilyMembers()
        await this.loadWishes()
        await this.loadWishExchangeHistory()
      }
      
      return result
    } catch (error) {
      console.error('兑换心愿错误:', error)
      return { success: false, message: error }
    }
  },
  
  completeSchedule: async function(scheduleId, memberName) {
    try {
      const userInfo = this.globalData.userInfo
      console.log('=== completeSchedule 调用 ===')
      console.log('scheduleId:', scheduleId)
      console.log('memberName:', memberName)
      console.log('userInfo:', userInfo)
      console.log('userInfo._id:', userInfo?._id)
      console.log('userInfo.id:', userInfo?.id)
      
      const result = await this.request({
        url: '/schedules/' + scheduleId + '/complete',
        method: 'PUT',
        data: { 
          memberName,
          userId: userInfo?._id || userInfo?.id
        }
      })
      
      console.log('completeSchedule 返回结果:', result)
      
      if (result.success) {
        // 重新加载家庭成员以更新积分
        await this.loadFamilyMembers()
        await this.loadSchedules()
      }
      
      return result
    } catch (error) {
      console.error('完成日程错误:', error)
      return { success: false, message: error }
    }
  },
  
  uncompleteSchedule: async function(scheduleId, memberName) {
    try {
      const userInfo = this.globalData.userInfo
      const result = await this.request({
        url: '/schedules/' + scheduleId + '/uncomplete',
        method: 'PUT',
        data: {
          memberName,
          userId: userInfo?._id || userInfo?.id
        }
      })
      
      if (result.success) {
        await this.loadFamilyMembers()
        await this.loadSchedules()
      }
      
      return result
    } catch (error) {
      console.error('取消完成日程错误:', error)
      return { success: false, message: error }
    }
  },
  
  addPoints: async function(memberName, amount, reason) {
    try {
      const userInfo = this.globalData.userInfo
      if (!userInfo || !userInfo.familyId) {
        return { success: false, message: '用户未登录或未加入家庭' }
      }
      
      const result = await this.request({
        url: '/points/add',
        method: 'POST',
        data: {
          familyId: userInfo.familyId,
          userId: userInfo._id || userInfo.id,
          memberName,
          amount,
          reason
        }
      })
      
      if (result.success) {
        // 重新加载家庭成员以更新积分
        await this.loadFamilyMembers()
      }
      
      return result
    } catch (error) {
      console.error('添加积分错误:', error)
      return { success: false, message: error }
    }
  },
  
  subtractPoints: async function(memberName, amount, reason) {
    try {
      const userInfo = this.globalData.userInfo
      if (!userInfo || !userInfo.familyId) {
        return { success: false, message: '用户未登录或未加入家庭' }
      }
      
      const result = await this.request({
        url: '/points/subtract',
        method: 'POST',
        data: {
          familyId: userInfo.familyId,
          userId: userInfo._id || userInfo.id,
          memberName,
          amount,
          reason
        }
      })
      
      if (result.success) {
        // 重新加载家庭成员以更新积分
        await this.loadFamilyMembers()
      }
      
      return result
    } catch (error) {
      console.error('扣除积分错误:', error)
      return { success: false, message: error }
    }
  },
  
  getPointsHistory: async function() {
    try {
      const userInfo = this.globalData.userInfo
      if (!userInfo || !userInfo.familyId) {
        return { success: false, message: '用户未登录或未加入家庭' }
      }
      
      const result = await this.request({
        url: '/points/history/' + userInfo.familyId,
        method: 'GET'
      })
      
      if (result.success) {
        this.globalData.pointsHistory = result.history
      }
      
      return result
    } catch (error) {
      console.error('获取积分历史错误:', error)
      return { success: false, message: error }
    }
  },
  
  // 保存番茄钟历史到数据库
  savePomodoroHistory: async function(historyItem, memberName) {
    try {
      const userInfo = this.globalData.userInfo
      if (!userInfo || !userInfo.familyId || !userInfo._id) {
        return { success: false, message: '用户未登录或未加入家庭' }
      }
      
      // 构建数据库格式的数据
      const dbHistoryItem = {
        familyId: userInfo.familyId,
        userId: userInfo._id,
        memberName: memberName,
        scheduleId: historyItem.scheduleId || null,
        taskName: historyItem.taskName || '专注时间',
        duration: historyItem.duration || 25,
        completed: historyItem.completed !== undefined ? historyItem.completed : true,
        type: historyItem.type || 'pomodoro',
        points: historyItem.points || 0,
        startTime: historyItem.startTime || '',
        endTime: historyItem.endTime || ''
      }
      
      const result = await this.request({
        url: '/pomodoro',
        method: 'POST',
        data: dbHistoryItem
      })
      
      if (result.success) {
        await this.loadPomodoroHistory()
      }
      
      return result
    } catch (error) {
      console.error('保存番茄钟历史错误:', error)
      return { success: false, message: error }
    }
  },
  
  updateUser: async function(userId, userData) {
    try {
      const result = await this.request({
        url: '/users/' + userId,
        method: 'PUT',
        data: userData
      })
      
      if (result.success) {
        this.globalData.userInfo = result.user
        wx.setStorageSync('userInfo', result.user)
      }
      
      return result
    } catch (error) {
      console.error('更新用户错误:', error)
      return { success: false, message: error }
    }
  },
})
