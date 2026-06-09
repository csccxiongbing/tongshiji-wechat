const app = getApp()

Page({
  data: {
    familyCode: '',
    familyMembers: [],
    currentUserRole: '',
    showEditModal: false,
    editForm: {
      index: -1,
      name: '',
      phone: '',
      role: ''
    }
  },
  
  onLoad: async function(options) {
    await this.loadFamilyMembers()
    await this.loadFamilyCode()
    this.loadCurrentUserInfo()
  },
  
  onShow: async function() {
    if (!app.checkLogin()) return
    await this.loadFamilyMembers()
  },
  
  loadFamilyCode: async function() {
    const userInfo = app.globalData.userInfo || {}
    if (!userInfo.familyId) {
      return
    }
    
    try {
      const result = await app.request({
        url: '/families/' + userInfo.familyId,
        method: 'GET'
      })
      
      if (result.success) {
        this.setData({
          familyCode: result.family.inviteCode
        })
      }
    } catch (error) {
      console.error('加载家庭码错误:', error)
    }
  },
  
  loadFamilyMembers: async function() {
    const userInfo = app.globalData.userInfo || {}
    if (!userInfo.familyId) {
      this.setData({
        familyMembers: []
      })
      return
    }
    
    try {
      const result = await app.request({
        url: '/families/' + userInfo.familyId,
        method: 'GET'
      })
      
      if (result.success) {
        app.globalData.familyMembers = result.family
        wx.setStorageSync('familyMembers', result.family)
        
        let members = result.family.members || []
        const userPhone = userInfo.phone || ''
        
        // 保存原始索引，因为前端会重新排序
        members = members.map((member, idx) => {
          let isCurrentUser = false
          
          // 通过手机号匹配当前用户
          if (userPhone && member.phone === userPhone) {
            isCurrentUser = true
          }
          
          return {
            ...member,
            isCurrentUser: isCurrentUser,
            originalIndex: idx  // 保存数据库中的原始索引
          }
        })
        
        const currentUserMember = members.find(m => m.isCurrentUser)
        const otherMembers = members.filter(m => !m.isCurrentUser)
        const sortedMembers = currentUserMember ? [currentUserMember, ...otherMembers] : members
        
        this.setData({
          familyMembers: sortedMembers
        })
      }
    } catch (error) {
      console.error('加载家庭成员错误:', error)
    }
  },
  
  loadCurrentUserInfo: function() {
    const userInfo = app.globalData.userInfo || {}
    const role = userInfo.role || 'child'
    
    this.setData({
      currentUserRole: role
    })
  },
  
  generateFamilyCode: function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  },
  
  editMember: function(e) {
    const index = e.currentTarget.dataset.index
    const member = this.data.familyMembers[index]
    
    this.setData({
      showEditModal: true,
      editForm: {
        index: index,
        name: member.name,
        phone: member.phone || '',
        role: member.role || ''
      }
    })
  },
  
  closeEditModal: function() {
    this.setData({
      showEditModal: false
    })
  },
  
  stopPropagation: function() {
  },
  
  onEditNameInput: function(e) {
    this.setData({
      'editForm.name': e.detail.value
    })
  },
  
  onEditPhoneInput: function(e) {
    this.setData({
      'editForm.phone': e.detail.value
    })
  },
  
  saveMember: async function() {
    const { editForm, familyMembers } = this.data
    const isChild = editForm.role === 'child'
    
    if (!editForm.name.trim()) {
      wx.showToast({
        title: isChild ? '请输入宝贝名字' : '请输入角色名称',
        icon: 'none'
      })
      return
    }
    
    const userInfo = app.globalData.userInfo || {}
    if (!userInfo.familyId) {
      wx.showToast({
        title: '请先创建或加入家庭',
        icon: 'none'
      })
      return
    }
    
    const newName = editForm.name.trim()
    const newPhone = editForm.phone.trim()
    
    // 获取正在编辑的成员的原始索引（数据库中的索引）和原始名字
    const currentMember = familyMembers[editForm.index]
    const currentOriginalIndex = currentMember.originalIndex
    const oldName = currentMember.name
    
    // 检查是否有其他成员的名字和角色都相同（排除正在编辑的成员）
    const existingMember = familyMembers.find((m, idx) => {
      return idx !== editForm.index && m.name === newName && m.role === editForm.role
    })
    
    if (existingMember) {
      // 名字和角色都相同：保留正在编辑的这个成员，删除其他重复的
      wx.showLoading({ title: '合并中...' })
      
      try {
        // 确定最终手机号：优先使用新手机号，如果没有则保留已存在成员的手机号
        let finalPhone = newPhone || existingMember.phone
        
        // 更新正在编辑的成员的信息（使用原始索引）
        await app.updateFamilyMember(userInfo.familyId, currentOriginalIndex, {
          name: newName,
          phone: finalPhone
        })
        
        // 删除已存在的那个重复成员（使用它的原始索引）
        await app.deleteFamilyMember(userInfo.familyId, existingMember.originalIndex)
        
        wx.hideLoading()
        
        wx.showToast({
          title: '已合并到 ' + newName,
          icon: 'success'
        })
        
        this.setData({
          showEditModal: false
        })
        
        await this.loadFamilyMembers()
        
        if (oldName !== newName) {
          await this.updateMemberNameInSchedules(oldName, newName)
        }
      } catch (error) {
        wx.hideLoading()
        wx.showToast({
          title: '合并失败',
          icon: 'none'
        })
      }
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    const memberData = {
      name: newName,
      phone: newPhone
    }
    
    // 使用原始索引更新
    const result = await app.updateFamilyMember(userInfo.familyId, currentOriginalIndex, memberData)
    
    wx.hideLoading()
    
    if (result.success) {
      // 如果是当前用户，只同步更新手机号，不同步角色名称到用户昵称
      if (currentMember.isCurrentUser) {
        const userInfo = app.globalData.userInfo || {}
        userInfo.phone = newPhone
        app.saveUserInfo(userInfo)
      }
      
      this.setData({
        showEditModal: false
      })
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 刷新家庭成员列表
      await this.loadFamilyMembers()
      
      // 如果名字发生变化，更新任务中对应的角色名字
      if (oldName !== newName) {
        await this.updateMemberNameInSchedules(oldName, newName)
      }
    } else {
      wx.showToast({
        title: result.message || '保存失败',
        icon: 'none'
      })
    }
  },
  
  updateMemberNameInSchedules: async function(oldName, newName) {
    const schedules = app.globalData.schedules || []
    const schedulesToUpdate = []
    
    // 获取当天0点的时间
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    schedules.forEach(schedule => {
      let needsUpdate = false
      
      // 检查任务是否在今天0点后
      let isAfterToday = true
      if (schedule.startTime) {
        const scheduleDate = new Date(schedule.startTime.replace(/-/g, '/'))
        isAfterToday = scheduleDate >= today
      }
      
      // 只有当天0点后的任务才更新
      if (isAfterToday) {
        if (schedule.scheduleMembers && schedule.scheduleMembers.includes(oldName)) {
          schedule.scheduleMembers = schedule.scheduleMembers.map(name => 
            name === oldName ? newName : name
          )
          needsUpdate = true
        }
        
        if (schedule.completedBy && schedule.completedBy.includes(oldName)) {
          schedule.completedBy = schedule.completedBy.map(name => 
            name === oldName ? newName : name
          )
          needsUpdate = true
        }
        
        if (schedule.remindMembers && schedule.remindMembers.includes(oldName)) {
          schedule.remindMembers = schedule.remindMembers.map(name => 
            name === oldName ? newName : name
          )
          needsUpdate = true
        }
        
        if (schedule.remindMembersText && schedule.remindMembersText.includes(oldName)) {
          schedule.remindMembersText = schedule.remindMembersText.replace(new RegExp(oldName, 'g'), newName)
          needsUpdate = true
        }
        
        if (needsUpdate) {
          schedulesToUpdate.push(schedule)
        }
      }
    })
    
    for (const schedule of schedulesToUpdate) {
      try {
        await app.updateSchedule(schedule.id || schedule._id, {
          scheduleMembers: schedule.scheduleMembers,
          completedBy: schedule.completedBy,
          remindMembers: schedule.remindMembers,
          remindMembersText: schedule.remindMembersText
        })
      } catch (error) {
        console.error('更新日程成员名字失败:', error)
      }
    }
  },
  
  goToAddMember: function() {
    wx.navigateTo({
      url: '/pages/addFamilyMember/addFamilyMember'
    })
  },
  
  goToJoinFamily: function() {
    wx.navigateTo({
      url: '/pages/joinFamily/joinFamily'
    })
  },
  
  copyFamilyCode: function() {
    const code = this.data.familyCode
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  }
})
