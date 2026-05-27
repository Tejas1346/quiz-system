const redis = require("../config/redis");
const {
    getSessionKeys,
    loadQuizByAccessCode,
    isHost,
    emitQuestion,
    clearSessionForNewGame,
    getLeaderboard,
} = require("./gameSession");

function registerGameHandlers(io) {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id, socket.displayName);

        socket.on("join-room", async ({ quizId }) => {
            // quizId here is actually the accessCode from the frontend
            const accessCode = quizId;
            if (!accessCode) return;

            socket.accessCode = accessCode;
            socket.join(accessCode);

            const name = socket.displayName;
            await redis.sadd(`players:${accessCode}`, name);
            const players = await redis.smembers(`players:${accessCode}`);
            io.to(accessCode).emit("update-players", players);
            console.log(`${name} joined room ${accessCode}`);
        });

        socket.on("start-game", async ({ quizId }) => {
            const accessCode = quizId;
            const quiz = await loadQuizByAccessCode(accessCode);
            if (!quiz || !(await isHost(socket, quiz))) {
                console.log("start-game rejected: not host or quiz not found");
                return;
            }

            await clearSessionForNewGame(accessCode);
            await emitQuestion(io, accessCode, 0);
            console.log(`Game started for room ${accessCode}`);
        });

        socket.on("next-question", async ({ quizId }) => {
            const accessCode = quizId;
            const quiz = await loadQuizByAccessCode(accessCode);
            if (!quiz || !(await isHost(socket, quiz))) return;

            const currentIndex = parseInt(
                await redis.get(`session:${accessCode}:questionIndex`)
            );
            const nextIndex = currentIndex + 1;

            if (nextIndex < quiz.questions.length) {
                await emitQuestion(io, accessCode, nextIndex);
            } else {
                const leaderboard = await getLeaderboard(accessCode);
                io.to(accessCode).emit("game-over", { leaderboard });
            }
        });

        socket.on("submit_answer", async ({ quizId, selectedIndex }) => {
            const accessCode = quizId;
            const quiz = await loadQuizByAccessCode(accessCode);
            if (!quiz) return;

            const questionIndex = await redis.get(
                `session:${accessCode}:questionIndex`
            );
            const status = await redis.get(`session:${accessCode}:status`);

            if (status !== "question" || questionIndex === null) return;

            const qIndex = parseInt(questionIndex);
            const keys = getSessionKeys(accessCode, qIndex);

            const alreadyAnswered = await redis.sismember(
                keys.answered,
                socket.userId
            );
            if (alreadyAnswered) return;

            await redis.sadd(keys.answered, socket.userId);

            const question = quiz.questions[qIndex];
            const startedAt = parseInt(await redis.get(keys.startedAt));
            const timeTaken = (Date.now() - startedAt) / 1000;
            const timeRemaining = Math.max(0, question.duration - timeTaken);

            if (selectedIndex === question.correctAnswerIndex) {
                const points = Math.floor(100 + timeRemaining * 10);
                await redis.zincrby(
                    keys.leaderboard,
                    points,
                    socket.displayName
                );
            }

            const answeredCount = await redis.incr(
                `answered_count:${accessCode}`
            );
            io.to(accessCode).emit("player_answered", {
                count: answeredCount,
            });
        });

        socket.on("request-leaderboard", async ({ quizId }) => {
            const accessCode = quizId;
            // Set status to leaderboard so no more answers are accepted
            await redis.set(`session:${accessCode}:status`, "leaderboard");
            const leaderboard = await getLeaderboard(accessCode);
            io.to(accessCode).emit("leaderboard-update", { leaderboard });
        });

        socket.on("disconnect", async () => {
            if (!socket.accessCode) return;
            console.log("User disconnected:", socket.displayName);
            await redis.srem(
                `players:${socket.accessCode}`,
                socket.displayName
            );
            const players = await redis.smembers(
                `players:${socket.accessCode}`
            );
            io.to(socket.accessCode).emit("update-players", players);
        });
    });
}

module.exports = registerGameHandlers;