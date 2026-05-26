const Quiz = require('../models/Quiz');
async function isOwner(req,res,next){
    try {
        const quiz = await Quiz.findById(req.params.id);
        if(!quiz){
            return res.status(404).json({message:"Not found"});
        }
        if(quiz.creator.toString()!==req.userId){
            return res.status(403).json({message:"Not Authorized"});
        }
        req.quiz=quiz;
        next();
    } catch (error) {
        res.status(500).json({error:"error checking host"});
    }
}
module.exports=isOwner