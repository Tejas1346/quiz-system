const authRouter = require('./routes/auth')
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB= require('./config/db');
const registerGameHandlers = require('./socket/gameHandler');
const {PORT} = require('./config/env');
const { registerSocketAuth } = require('./socket/socketAuth');
const app = express();
const quizRouter = require('./routes/quizzes')
app.use(cors());
app.use(express.json());
app.use('/api/auth',authRouter);
app.use('/api/quizzes',quizRouter);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:3000" } 
});
registerSocketAuth(io);
registerGameHandlers(io);

async function startServer(){
    await connectDB();
    server.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
}

startServer().catch(console.error);


