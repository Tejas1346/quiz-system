const express = require('express');
const verifyToken=require('../middleware/auth');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

router.post('/register', async (req,res)=>{
    try {
        const {email,displayName,password,role}= req.body;
        const hashedPassword = await bcrypt.hash(password,12);
        const user = new User({email,password:hashedPassword,role:role||'player',displayName});
        await user.save();
        res.status(201).json({message:"User registered succesfully"});
    } catch (error) {
        res.status(400).json({error:"error while registering user"});    
        console.log(error);
    }
})

router.post('/login', async (req,res)=>{
    try {
        const {email,password}=req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({error:"Authentication Failed"});
        }
        const isMatching = await bcrypt.compare(password,user.password);
        if(!isMatching){
            return res.status(401).json({message:"Login Failed"});
        }
        const token = jwt.sign({userId:user._id},JWT_SECRET,{expiresIn:'1h'});
        res.status(200).json({token});

    } catch (error) {
        res.status(500).json({error:'Login failed'});        
    }
})

router.get('/me',verifyToken,async(req,res)=>{
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json({
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        });
        
    } catch (error) {
        res.status(500).json({error:'Failed to fetch user'});
    }
})

module.exports = router;