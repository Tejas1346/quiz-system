const redis = require('../config/redis');

function registerGameHandlers(io){
    io.on("connection",(socket)=>{
        console.log("User connected:",socket.id);
        socket.on("join-room",async({quizId})=>{
            if(!quizId) return;
            socket.quizId=quizId;
            socket.join(quizId);
            const name = socket.displayName;
            await redis.sadd(`players:${quizId}`,name);
            const players= await redis.smembers(`players:${quizId}`);
            io.to(quizId).emit('update-players',players);
            console.log(`${bane} joined ${quizId}`);
        })
    
        socket.on("submit_answer",async({quizId,isCorrect,timeRemaining})=>{
            const username=socket.displayName;
            if(isCorrect){
                const points = 100+timeRemaining*10;
                await redis.zincrby(`leaderboard:${quizId}`,points,username);
                
            }
            const answeredCount= await redis.incr(`answered_count:${quizId}`);
            io.to(quizId).emit('player_answered',{count:answeredCount});
    
        })
        socket.on("disconnect",async ()=>{
            if(!socket.quizId) return;
            console.log('User disconnected');
            await redis.srem(`players:${socket.quizId}`,socket.displayName);
            const players= await redis.smembers(`players:${quizId}`);
            io.to(socket.quizId).emit('update-players',players);
        })
    })
}

module.exports = registerGameHandlers;