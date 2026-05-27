const redis = require("../config/redis");
const Quiz = require("../models/Quiz");

async function loadQuizByAccessCode(accessCode) {
    try {
        const quiz = await Quiz.findOne({ accessCode });
        return quiz;
    } catch (error) {
        console.log("error while fetching quiz", error);
        return null;
    }
}

async function isHost(socket, quiz) {
    try {
        return quiz.creator.toString() === socket.userId;
    } catch (error) {
        console.log("error while checking host", error);
        return false;
    }
}

function getSessionKeys(accessCode, questionIndex = null) {
    return {
        status: `session:${accessCode}:status`,
        questionIndex: `session:${accessCode}:questionIndex`,
        startedAt: `session:${accessCode}:${questionIndex}:startedAt`,
        leaderboard: `leaderboard:${accessCode}`,
        players: `players:${accessCode}`,
        answered:
            questionIndex !== null
                ? `answered:${accessCode}:${questionIndex}`
                : null,
    };
}

async function emitQuestion(io, accessCode, index) {
    const quiz = await loadQuizByAccessCode(accessCode);
    if (!quiz) return;
    const question = quiz.questions[index];
    io.to(accessCode).emit("question-start", {
        questionIndex: index,
        questionText: question.questionText,
        questionDuration: question.duration,
        options: question.options,
    });
    const keys = getSessionKeys(accessCode, index);
    await redis.set(keys.status, "question");
    await redis.set(keys.questionIndex, index);
    await redis.set(keys.startedAt, Date.now());
    await redis.del(`answered_count:${accessCode}`);
}

async function getLeaderboard(accessCode) {
    try {
        const topPlayers = await redis.zrevrange(
            `leaderboard:${accessCode}`,
            0,
            9,
            "WITHSCORES"
        );
        const formatted = [];
        for (let i = 0; i < topPlayers.length; i += 2) {
            formatted.push({
                username: topPlayers[i],
                score: parseInt(topPlayers[i + 1]),
            });
        }
        return formatted;
    } catch (error) {
        console.log("error while getting leaderboard", error);
        return [];
    }
}

async function clearSessionForNewGame(accessCode) {
    const quiz = await loadQuizByAccessCode(accessCode);
    if (!quiz) return;
    const keys = getSessionKeys(accessCode);
    const deleteKeys = [
        keys.status,
        keys.questionIndex,
        keys.leaderboard,
    ];
    // Clean up all startedAt and answered keys for each question
    const totalQuestions = quiz.questions.length;
    for (let i = 0; i < totalQuestions; i++) {
        deleteKeys.push(`session:${accessCode}:${i}:startedAt`);
        deleteKeys.push(`answered:${accessCode}:${i}`);
    }
    deleteKeys.push(`answered_count:${accessCode}`);
    await redis.del(...deleteKeys);
}

module.exports = {
    loadQuizByAccessCode,
    isHost,
    getSessionKeys,
    emitQuestion,
    clearSessionForNewGame,
    getLeaderboard,
};