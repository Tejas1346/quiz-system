const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    creator: { type: mongoose.Schema.ObjectId, ref:'User',required:true },
    accessCode:{type: String,unique:true,required:true},
    questions: [{
        questionText: String,
        options: [String], // Array of 4 strings
        correctAnswerIndex: Number, // 0, 1, 2, or 3
        duration: { type: Number, default: 15 } // Seconds to answer
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', QuizSchema);