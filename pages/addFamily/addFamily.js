const app = getApp()

Page({
  data: {
    selectedRole: '',
    parentRole: 'dad',
    customParentName: '',
    babyName: '',
    babyBirthday: '',
    birthdayDisplay: '',
    members: [
      { name: '', role: 'parent' }
    ]
  },
  
  onLoad: function(options) {
    const role = options.role || ''
    this.setData({
      selectedRole: role,
      parentRole: 'dad',
      fixedRole: role, // 标记固定的角色
      members: role === 'parent' ? [
        { name: '爸爸', role: role || 'parent' }
      ] : [
        { name: '', role: 'child' }
      ]
    })
  },
  
  selectRole: function(e) {
    // 如果有固定角色，则不允许切换
    if (this.data.fixedRole) {
      wx.showToast({
        title: '角色已在注册时确定',
        icon: 'none'
      })
      return
    }
    
    const role = e.currentTarget.dataset.role
    this.setData({
      selectedRole: role,
      members: [
        { name: '', role: role }
      ]
    })
  },
  
  selectParentRole: function(e) {
    const role = e.currentTarget.dataset.role;
    const members = this.data.members;
    
    if (role === 'dad') {
      members[0].name = '爸爸';
    } else if (role === 'mom') {
      members[0].name = '妈妈';
    }
    
    this.setData({
      parentRole: role,
      members: members,
      customParentName: role === 'custom' ? this.data.customParentName : ''
    })
  },
  
  onCustomParentNameInput: function(e) {
    const members = this.data.members;
    if (members.length > 0) {
      members[0].name = e.detail.value;
    }
    this.setData({
      customParentName: e.detail.value,
      members: members
    })
  },
  
  onBabyNameInput: function(e) {
    this.setData({
      babyName: e.detail.value
    })
  },
  
  onBabyBirthdayChange: function(e) {
    this.setData({
      babyBirthday: e.detail.value,
      birthdayDisplay: this.formatDate(e.detail.value)
    })
  },
  
  formatDate: function(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}年${month}月${day}日`
  },
  
  onMemberNameInput: function(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const members = [...this.data.members]
    members[index].name = e.detail.value
    this.setData({
      members: members
    })
  },
  
  setMemberRole: function(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const role = e.currentTarget.dataset.role
    const members = [...this.data.members]
    members[index].role = role
    this.setData({
      members: members
    })
  },
  
  deleteMember: function(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    if (this.data.members.length <= 1) {
      wx.showToast({
        title: '至少需要一位成员',
        icon: 'none'
      })
      return
    }
    const members = this.data.members.filter((_, i) => i !== index)
    this.setData({
      members: members
    })
  },
  
  generateInviteCode: function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  },
  
  createFamily: function() {
    if (!this.data.selectedRole) {
      wx.showToast({
        title: '请选择角色',
        icon: 'none'
      })
      return
    }
    
    const userInfo = app.globalData.userInfo || {}
    const userPhone = userInfo.phone || ''
    
    let validMembers = []
    
    if (this.data.selectedRole === 'child') {
      if (!this.data.babyName.trim()) {
        wx.showToast({
          title: '请输入宝贝名称',
          icon: 'none'
        })
        return
      }
      if (!this.data.babyBirthday) {
        wx.showToast({
          title: '请选择宝贝出生日期',
          icon: 'none'
        })
        return
      }
      validMembers = [
        { 
          name: this.data.babyName, 
          role: 'child', 
          birthday: this.data.babyBirthday,
          phone: userPhone,
          isCurrentUser: true
        }
      ]
    } else {
      validMembers = this.data.members.filter(m => m.name.trim()).map(m => ({
        ...m,
        phone: userPhone,
        isCurrentUser: true
      }))
      if (validMembers.length === 0) {
        wx.showToast({
          title: '请添加至少一位成员',
          icon: 'none'
        })
        return
      }
      if (this.data.babyName.trim()) {
        if (!this.data.babyBirthday) {
          wx.showToast({
            title: '请选择宝贝出生日期',
            icon: 'none'
          })
          return
        }
        validMembers.push({
          name: this.data.babyName,
          role: 'child',
          birthday: this.data.babyBirthday
        })
      }
    }
    
    const inviteCode = this.generateInviteCode()
    
    let familyName = ''
    if (this.data.selectedRole === 'parent') {
      if (this.data.parentRole === 'dad') {
        familyName = '爸爸的家庭'
      } else if (this.data.parentRole === 'mom') {
        familyName = '妈妈的家庭'
      } else {
        familyName = (this.data.customParentName || '家长') + '的家庭'
      }
    } else {
      familyName = this.data.babyName + '的家庭'
    }
    
    const familyInfo = {
      name: familyName,
      familyCode: inviteCode,
      members: validMembers,
      creatorRole: this.data.selectedRole,
      parentRole: this.data.selectedRole === 'parent' ? this.data.parentRole : null,
      customParentName: this.data.customParentName
    }
    
    app.saveFamilyMembers(familyInfo)
    
    wx.showToast({
      title: '创建成功',
      icon: 'success'
    })
    
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/home/home'
      })
    }, 1500)
  }
})