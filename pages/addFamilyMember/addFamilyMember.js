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

  onShow: function() {
    if (!app.checkLogin()) return
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
  
  addMember: async function() {
    if (!this.data.selectedRole) {
      wx.showToast({
        title: '请选择角色',
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
    
    let memberName = ''
    let memberRole = this.data.selectedRole
    let birthday = this.data.babyBirthday
    
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
    
    wx.showLoading({ title: '添加中...' })
    
    const member = {
      name: memberName,
      role: memberRole,
      birthday: birthday,
      phone: '',
      isCurrentUser: false
    }
    
    const result = await app.addFamilyMember(userInfo.familyId, member)
    
    wx.hideLoading()
    
    if (result.success) {
      // 为新成员初始化积分为0
      if (!app.globalData.memberPoints[memberName]) {
        app.globalData.memberPoints[memberName] = 0
        wx.setStorageSync('memberPoints', app.globalData.memberPoints)
      }
      
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } else {
      wx.showToast({
        title: result.message || '添加失败',
        icon: 'none'
      })
    }
  }
})