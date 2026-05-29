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

async function loadQuizState(accessCode, userId) {
    try {
        const keys = getSessionKeys(accessCode);
        const status = (await redis.get(keys.status)) || "LOBBY";
        const players = await redis.smembers(keys.players);
        const quiz = await loadQuizByAccessCode(accessCode);

        let state = {
            gameState: status.toUpperCase(),
            players,
        };

        // If the status is GAMEOVER or leaderboard but there are no players, or it's just very old, consider it LOBBY
        // For now, let's treat GAMEOVER as stale if someone is just joining a "new" room session.
        // Actually, the best indicator is if the host is there and if it's been a long time.
        
        if (status === "question") {
            const questionIndexRaw = await redis.get(keys.questionIndex);
            if (questionIndexRaw === null) return { gameState: "LOBBY", players };
            
            const questionIndex = parseInt(questionIndexRaw);
            const question = quiz?.questions[questionIndex];
            if (!question) return { gameState: "LOBBY", players };

            const startedAtRaw = await redis.get(`session:${accessCode}:${questionIndex}:startedAt`);
            const startedAt = parseInt(startedAtRaw);
            
            // If startedAt is more than 2 hours ago, it's definitely stale
            if (!startedAt || (Date.now() - startedAt) > 2 * 60 * 60 * 1000) {
                return { gameState: "LOBBY", players };
            }

            const timeTaken = (Date.now() - startedAt) / 1000;
            const timeRemaining = Math.max(
                0,
                Math.floor(question.duration - timeTaken)
            );
            const answeredCount =
                parseInt(await redis.get(`answered_count:${accessCode}`)) || 0;
            const hasAnswered = await redis.sismember(
                `answered:${accessCode}:${questionIndex}`,
                userId
            );

            state = {
                ...state,
                currentQuestion: {
                    questionIndex,
                    questionText: question.questionText,
                    questionDuration: question.duration,
                    options: question.options,
                },
                questionNumber: questionIndex + 1,
                timer: timeRemaining,
                answeredCount,
                hasAnswered: !!hasAnswered,
            };
        } else if (status === "leaderboard") {
            const leaderboard = await getLeaderboard(accessCode);
            state = {
                ...state,
                leaderboard,
            };
        } else if (status === "GAMEOVER") {
            // GAMEOVER is almost always stale when joining a "new" room
            return { gameState: "LOBBY", players };
        }

        return state;
    } catch (error) {
        console.log("error while loading quiz state", error);
        return { gameState: "LOBBY", players: [] };
    }
}

module.exports = {
    loadQuizByAccessCode,
    isHost,
    getSessionKeys,
    emitQuestion,
    clearSessionForNewGame,
    getLeaderboard,
    loadQuizState,
};