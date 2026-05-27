const express = require('express');
const verifyToken = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();
const crypto = require('crypto');
const Quiz = require('../models/Quiz');
const isOwner=require('../middleware/isOwner');

router.post('/',verifyToken,async(req,res)=>{
    try {
        const user = await User.findById(req.userId);
        const code = String(crypto.randomInt(100000, 1000000));
        
        if(!user||user.role!=='host'){
            return res.status(403).json({ error: 'Only hosts can create quizzes' });
        }
        const newQuiz = new Quiz ({
            title:req.body.title,
            questions:req.body.questions,
            creator:req.userId,
            accessCode:code 
        });
        await newQuiz.save();
        res.status(201).json({
            quizId:newQuiz._id,
            message: 'Quiz created successfully',
            accessCode: code
        });
    } catch (error) {
        console.error("error while creating a quiz",error); 
        res.status(500).json({
            error: 'Error while creating quiz'
        });
    }
})

router.get('/',verifyToken,async(req,res)=>{
    try {
        
        const user = await User.findById(req.userId);

        if (!user || user.role !== 'host') {

            return res.status(403).json({
                error: 'Unauthorized'
            });

        }
        const quizzes = await Quiz.find({creator:req.userId});
        res.status(201).json({
            quizzes:quizzes
        })
    } catch (error) {
        console.error("error while getting quizzes");
        res.status(500).json({
            error:'Error while getting quizzes'
        });
    }
})

router.get('/join/:accessCode', verifyToken, async (req, res) => {

    try {
        const quiz = await Quiz.findOne({
            accessCode: req.params.accessCode
        });
        if (!quiz) {
            return res.status(404).json({
                error: 'Quiz not found'
            });

        }
        res.status(200).json({
            quizId: quiz._id,
            title: quiz.title,
            creator: quiz.creator.toString(),
            accessCode: quiz.accessCode
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: 'Failed to join quiz'
        });

    }

});

router.get('/:id',verifyToken,isOwner,async(req,res)=>{
    try {
        res.status(200).json(req.quiz); 
    } catch (error) {
        return res.status(500).json({error:"an error occured"}); 
    }
})

router.delete('/:id',verifyToken,isOwner,async(req,res)=>{
    try {
        await Quiz.findByIdAndDelete(req.params.id);
        res.status(200).json({message:"Quiz deleted succesfully"})
    } catch (error) {
        res.status(500).json({message:"Eroor while deleting",error}); 
    }
})

router.get('/:id/play', verifyToken, async (req, res) => {

    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({
                error: 'Quiz not found'
            });

        }
        const strippedQuestions = quiz.questions.map((question) => {

            return {
                questionText: question.questionText,
                options: question.options,
                duration:question.duration
            };

        });
        res.status(200).json({
            quizId: quiz._id,
            title: quiz.title,
            questions: strippedQuestions
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to fetch quiz'
        });

    }

});



module.exports = router

