const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

function verifyToken(req,res,next){
    const token = req.header('Authorization')?.replace(/^Bearer\s+/i,'');
    if(!token){
        return res.status(401).json({message:'Unauthorized'});
    }

    try {
        const decoded = jwt.verify(token,JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({message:'Unauthorized'});
    }
}
module.exports = verifyToken
