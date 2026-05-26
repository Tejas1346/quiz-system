const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../models/User');

function registerSocketAuth(io){

    io.use(async (socket,next)=>{
        try {
            const token = socket.handshake.auth.token;
            if(!token){
                return next(new Error('Unauthorized'));
            }
            const decoded= jwt.verify(token,JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            if(!user){
                return next(new Error('Unauthorized'));
            }
            socket.userId=user._id.toString();
            socket.displayName=user.displayName;
            socket.userRole=user.role;
            next();
        } catch (error) {
            next(new Error('Unatuthorized')); 
        }
    })
}
module.exports={registerSocketAuth};