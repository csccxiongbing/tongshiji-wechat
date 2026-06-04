const express = require('express');
const router = express.Router();
const Family = require('../models/Family');
const User = require('../models/User');

const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

router.post('/create', async (req, res) => {
  try {
    const { name, members } = req.body;
    
    let inviteCode = generateInviteCode();
    while (await Family.findOne({ inviteCode })) {
      inviteCode = generateInviteCode();
    }
    
    const family = new Family({
      name,
      inviteCode,
      members: members || [],
    });
    
    await family.save();
    
    if (members && members.length > 0) {
      for (const member of members) {
        const user = await User.findOne({ phone: member.phone });
        if (user) {
          user.familyId = family._id;
          await user.save();
        }
      }
    }
    
    res.json({ success: true, family });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/join', async (req, res) => {
  try {
    const { inviteCode, phone, memberInfo } = req.body;
    
    const family = await Family.findOne({ inviteCode });
    if (!family) {
      return res.json({ success: false, message: '邀请码无效' });
    }
    
    const user = await User.findOne({ phone });
    if (!user) {
      return res.json({ success: false, message: '用户不存在' });
    }
    
    // 检查用户是否已经在这个家庭中
    if (user.familyId && user.familyId.toString() === family._id.toString()) {
      return res.json({ success: false, message: '已在此家庭中' });
    }
    
    // 检查用户是否已经是家庭成员
    const isMember = family.members.some(m => m.phone === phone);
    if (isMember) {
      user.familyId = family._id;
      await user.save();
      return res.json({ success: true, family });
    }
    
    user.familyId = family._id;
    await user.save();
    
    if (memberInfo) {
      family.members.push(memberInfo);
      await family.save();
    }
    
    res.json({ success: true, family });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) {
      return res.json({ success: false, message: '家庭不存在' });
    }
    res.json({ success: true, family });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/:id/members', async (req, res) => {
  try {
    const { member } = req.body;
    
    const family = await Family.findById(req.params.id);
    if (!family) {
      return res.json({ success: false, message: '家庭不存在' });
    }
    
    family.members.push(member);
    await family.save();
    
    res.json({ success: true, family });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.put('/:id/members/:memberIndex', async (req, res) => {
  try {
    const { memberIndex } = req.params;
    const { name, role, phone } = req.body;
    
    const family = await Family.findById(req.params.id);
    if (!family) {
      return res.json({ success: false, message: '家庭不存在' });
    }
    
    if (family.members[memberIndex]) {
      if (name) family.members[memberIndex].name = name;
      if (role) family.members[memberIndex].role = role;
      if (phone) family.members[memberIndex].phone = phone;
      await family.save();
    }
    
    res.json({ success: true, family });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.delete('/:id/members/:memberIndex', async (req, res) => {
  try {
    const { memberIndex } = req.params;
    
    const family = await Family.findById(req.params.id);
    if (!family) {
      return res.json({ success: false, message: '家庭不存在' });
    }
    
    family.members.splice(memberIndex, 1);
    await family.save();
    
    res.json({ success: true, family });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
