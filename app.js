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
    pomodoroTaskInfo: null
  },
  
  API_BASE_URL: 'http://localhost:3000/api',
  
  onLaunch: function () {
    try {
      console.log('App初始化中...')
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo && typeof userInfo === 'object') {
        this.globalData.userInfo = userInfo
        console.log('加载用户信息成功:', userInfo)
        this.loadFamilyMembers()
        this.loadSchedules()
      }
    } catch (e) {
      console.error('数据加载错误:', e)
    }
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
        wx.setStorageSync('familyMembers', result.family)
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
        wx.setStorageSync('schedules', result.schedules)
      }
    } catch (error) {
      console.error('加载日程错误:', error)
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
  
  completeSchedule: async function(scheduleId, memberName) {
    try {
      const result = await this.request({
        url: '/schedules/' + scheduleId + '/complete',
        method: 'PUT',
        data: { memberName }
      })
      
      if (result.success) {
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
      const result = await this.request({
        url: '/schedules/' + scheduleId + '/uncomplete',
        method: 'PUT',
        data: { memberName }
      })
      
      if (result.success) {
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
      
      const currentPoints = this.globalData.points || 0
      const newBalance = currentPoints + amount
      
      const result = await this.request({
        url: '/points/add',
        method: 'POST',
        data: {
          familyId: userInfo.familyId,
          userId: userInfo._id || userInfo.id,
          memberName,
          amount,
          reason,
          balance: newBalance
        }
      })
      
      if (result.success) {
        this.globalData.points = newBalance
        wx.setStorageSync('points', newBalance)
        
        if (memberName) {
          this.globalData.memberPoints[memberName] = (this.globalData.memberPoints[memberName] || 0) + amount
          wx.setStorageSync('memberPoints', this.globalData.memberPoints)
        }
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
      
      const currentPoints = this.globalData.points || 0
      const newBalance = Math.max(0, currentPoints - amount)
      
      const result = await this.request({
        url: '/points/subtract',
        method: 'POST',
        data: {
          familyId: userInfo.familyId,
          userId: userInfo._id || userInfo.id,
          memberName,
          amount,
          reason,
          balance: newBalance
        }
      })
      
      if (result.success) {
        this.globalData.points = newBalance
        wx.setStorageSync('points', newBalance)
        
        if (memberName) {
          this.globalData.memberPoints[memberName] = Math.max(0, (this.globalData.memberPoints[memberName] || 0) - amount)
          wx.setStorageSync('memberPoints', this.globalData.memberPoints)
        }
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
        wx.setStorageSync('pointsHistory', result.history)
      }
      
      return result
    } catch (error) {
      console.error('获取积分历史错误:', error)
      return { success: false, message: error }
    }
  },
  
  saveUserInfo: function(userInfo) {
    try {
      this.globalData.userInfo = userInfo
      wx.setStorageSync('userInfo', userInfo)
      return { success: true }
    } catch (e) {
      console.error('保存用户信息错误:', e)
      return { success: false, message: '保存失败' }
    }
  },
  
  saveFamilyMembers: function(family) {
    try {
      this.globalData.familyMembers = family
      wx.setStorageSync('familyMembers', family)
      return { success: true }
    } catch (e) {
      console.error('保存家庭成员错误:', e)
      return { success: false, message: '保存失败' }
    }
  },
  
  saveSchedules: function(schedules) {
    try {
      this.globalData.schedules = schedules
      wx.setStorageSync('schedules', schedules)
      return { success: true }
    } catch (e) {
      console.error('保存日程错误:', e)
      return { success: false, message: '保存失败' }
    }
  },
  
  savePomodoroHistory: function(historyItem) {
    try {
      const history = this.globalData.pomodoroHistory || []
      history.unshift(historyItem)
      this.globalData.pomodoroHistory = history
      wx.setStorageSync('pomodoroHistory', history)
      return { success: true }
    } catch (e) {
      console.error('保存番茄钟历史错误:', e)
      return { success: false, message: '保存失败' }
    }
  },
  
  saveCurrentUserToUsersList: function() {
    try {
      const userInfo = this.globalData.userInfo
      if (!userInfo) return { success: false, message: '无用户信息' }
      
      const users = this.globalData.users || []
      const existingIndex = users.findIndex(u => u.phone === userInfo.phone)
      
      if (existingIndex !== -1) {
        users[existingIndex] = userInfo
      } else {
        users.push(userInfo)
      }
      
      this.globalData.users = users
      wx.setStorageSync('users', users)
      return { success: true }
    } catch (e) {
      console.error('保存用户列表错误:', e)
      return { success: false, message: '保存失败' }
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
  
  logout: function() {
    try {
      this.globalData.userInfo = null
      this.globalData.familyMembers = { members: [] }
      this.globalData.schedules = []
      this.globalData.points = 0
      this.globalData.memberPoints = {}
      this.globalData.pointsHistory = []
      this.globalData.pomodoroHistory = []
      this.globalData.pomodoroTaskInfo = null
      
      wx.removeStorageSync('userInfo')
      wx.removeStorageSync('familyMembers')
      wx.removeStorageSync('schedules')
      wx.removeStorageSync('points')
      wx.removeStorageSync('memberPoints')
      wx.removeStorageSync('pointsHistory')
      wx.removeStorageSync('pomodoroHistory')
    } catch (e) {
      console.error('退出登录错误:', e)
    }
  },
  
  clearAllData: async function() {
    try {
      const result = await this.request({
        url: '/admin/clear-all',
        method: 'POST'
      })
      
      this.globalData.users = []
      this.globalData.userInfo = null
      this.globalData.familyMembers = {}
      this.globalData.schedules = []
      this.globalData.points = 0
      this.globalData.memberPoints = {}
      this.globalData.pointsHistory = []
      this.globalData.pomodoroHistory = []
      this.globalData.pomodoroTaskInfo = null
      
      wx.removeStorageSync('users')
      wx.removeStorageSync('userInfo')
      wx.removeStorageSync('familyMembers')
      wx.removeStorageSync('schedules')
      wx.removeStorageSync('points')
      wx.removeStorageSync('memberPoints')
      wx.removeStorageSync('pointsHistory')
      wx.removeStorageSync('pomodoroHistory')
      
      console.log('所有数据已清空')
      return result
    } catch (e) {
      console.error('清空数据错误:', e)
      return { success: false, message: '清空数据失败' }
    }
  }
})
