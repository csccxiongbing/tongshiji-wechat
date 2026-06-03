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
  
  onLoad: function(options) {
    this.loadFamilyCode()
    this.loadFamilyMembers()
    this.loadCurrentUserInfo()
  },
  
  onShow: function() {
    this.loadFamilyMembers()
  },
  
  loadFamilyCode: function() {
    const family = app.globalData.familyMembers || {}
    const code = family.familyCode || this.generateFamilyCode()
    
    this.setData({
      familyCode: code
    })
    
    if (!family.familyCode) {
      family.familyCode = code
      app.saveFamilyMembers(family)
    }
  },
  
  loadFamilyMembers: function() {
    const family = app.globalData.familyMembers || {}
    let members = family.members || []
    
    const userInfo = app.globalData.userInfo || {}
    const userRole = userInfo.role || 'child'
    const userPhone = userInfo.phone || ''
    
    console.log('用户信息:', userInfo)
    console.log('家庭成员:', members)
    console.log('用户手机号:', userPhone)
    
    // 主要通过手机号匹配当前用户（最准确）
    let foundCurrentUser = false
    
    members = members.map((member, index) => {
      let isCurrentUser = member.isCurrentUser || false
      
      // 优先通过手机号匹配
      if (!isCurrentUser && userPhone && member.phone === userPhone) {
        isCurrentUser = true
        foundCurrentUser = true
      }
      
      const updatedMember = {
        ...member,
        isCurrentUser: isCurrentUser
      }
      
      // 如果是当前用户，确保有手机号
      if (isCurrentUser && userPhone) {
        updatedMember.phone = userPhone
      }
      
      return updatedMember
    })
    
    // 如果通过手机号没找到，尝试通过 isCurrentUser 标记
    if (!foundCurrentUser) {
      const markedCurrentUser = members.find(m => m.isCurrentUser)
      if (markedCurrentUser) {
        foundCurrentUser = true
      }
    }
    
    // 保存更新后的家庭成员数据
    family.members = members
    app.saveFamilyMembers(family)
    
    console.log('处理后的家庭成员:', members)
    
    const currentUserMember = members.find(m => m.isCurrentUser)
    const otherMembers = members.filter(m => !m.isCurrentUser)
    const sortedMembers = currentUserMember ? [currentUserMember, ...otherMembers] : members
    
    this.setData({
      familyMembers: sortedMembers
    })
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
  
  saveMember: function() {
    const { editForm, familyMembers } = this.data
    const isChild = editForm.role === 'child'
    
    if (!editForm.name.trim()) {
      wx.showToast({
        title: isChild ? '请输入宝贝名字' : '请输入角色名称',
        icon: 'none'
      })
      return
    }
    
    const newMembers = [...familyMembers]
    const editedMember = newMembers[editForm.index]
    
    // 只修改角色名称和手机号，不影响用户昵称
    editedMember.name = editForm.name.trim()
    editedMember.phone = editForm.phone.trim()
    
    // 如果是当前用户，只同步更新手机号，不同步角色名称到用户昵称
    if (editedMember.isCurrentUser) {
      const userInfo = app.globalData.userInfo || {}
      userInfo.phone = editForm.phone.trim()
      app.saveUserInfo(userInfo)
    }
    
    const family = app.globalData.familyMembers || {}
    family.members = newMembers
    app.saveFamilyMembers(family)
    
    this.setData({
      familyMembers: newMembers,
      showEditModal: false
    })
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
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