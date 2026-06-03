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
    this.setData({
      selectedRole: 'child',
      parentRole: 'dad',
      members: [
        { name: '', role: 'child' }
      ]
    })
  },
  
  selectRole: function(e) {
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
  
  addMember: function() {
    if (!this.data.selectedRole) {
      wx.showToast({
        title: '请选择角色',
        icon: 'none'
      })
      return
    }
    
    let memberName = ''
    let memberRole = this.data.selectedRole
    let birthday = this.data.babyBirthday
    const userInfo = app.globalData.userInfo || {}
    const userPhone = userInfo.phone || ''
    
    if (this.data.selectedRole === 'child') {
      if (!this.data.babyName.trim()) {
        wx.showToast({
          title: '请输入宝贝名称',
          icon: 'none'
        })
        return
      }
      memberName = this.data.babyName
    } else {
      const validMembers = this.data.members.filter(m => m.name.trim())
      if (validMembers.length === 0) {
        wx.showToast({
          title: '请输入成员名称',
          icon: 'none'
        })
        return
      }
      memberName = validMembers[0].name
    }
    
    let family = app.globalData.familyMembers || { members: [] }
    
    if (!family.members) {
      family.members = []
    }
    
    // 新增的家庭成员不应该有手机号，也不应该是当前用户
    // 只有通过家庭码加入时，才会有手机号和 isCurrentUser 标记
    family.members.push({
      name: memberName,
      role: memberRole,
      birthday: birthday,
      phone: '', // 新增成员手机号为空
      joinedAt: Date.now(),
      isCurrentUser: false // 新增成员不是当前用户
    })
    
    app.saveFamilyMembers(family)
    
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    })
    
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  }
})