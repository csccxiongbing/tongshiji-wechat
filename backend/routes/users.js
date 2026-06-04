const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Family = require('../models/Family');

router.post('/register', async (req, res) => {
  try {
    const { phone, nickname, role } = req.body;
    
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.json({ success: false, message: '该手机号已注册' });
    }
    
    const newUser = new User({
      phone,
      nickname,
      role,
    });
    
    await newUser.save();
    
    res.json({ success: true, user: newUser });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
    
    const user = await User.findOne({ phone });
    if (!user) {
      return res.json({ success: false, message: '该手机号未注册' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('familyId');
    if (!user) {
      return res.json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nickname, role, familyId } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.json({ success: false, message: '用户不存在' });
    }
    
    if (nickname !== undefined) user.nickname = nickname;
    if (role !== undefined) user.role = role;
    if (familyId !== undefined) user.familyId = familyId;
    
    await user.save();
    
    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
