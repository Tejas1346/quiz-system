import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket, connectSocket, disconnectSocket } from '@/lib/socket';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, Users, Trophy, Play, ChevronRight, Home } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

const OPTION_COLORS = [
  'border-red-300 hover:bg-red-50 hover:border-red-500',
  'border-blue-300 hover:bg-blue-50 hover:border-blue-500',
  'border-green-300 hover:bg-green-50 hover:border-green-500',
  'border-yellow-300 hover:bg-yellow-50 hover:border-yellow-500',
];

export default function GameRoom() {
  const { quizId: accessCode } = useParams(); // this is the 6-digit access code
  const navigate = useNavigate();

  const [gameState, setGameState] = useState('LOBBY');
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timer, setTimer] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [error, setError] = useState('');
  const socketReady = useRef(false);

  // Initialize room
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    const initRoom = async () => {
      try {
        // Look up quiz by accessCode and get creator info
        const { data: quizInfo } = await api.get(`/quizzes/join/${accessCode}`);
        setQuizTitle(quizInfo.title);

        // Check if current user is the host
        const { data: user } = await api.get('/auth/me');
        if (quizInfo.creator === user.id) {
          setIsHost(true);
        }

        // Connect socket and join the room
        connectSocket(token);
        socketReady.current = true;

        socket.on('connect', () => {
          socket.emit('join-room', { quizId: accessCode });
        });

        // If already connected, emit immediately
        if (socket.connected) {
          socket.emit('join-room', { quizId: accessCode });
        }
      } catch (err) {
        console.error("Failed to init room", err);
        setError('Quiz not found or you are not logged in.');
      }
    };

    initRoom();

    // Socket event listeners
    socket.on('update-players', (playerList) => {
      setPlayers(playerList);
    });

    socket.on('sync-game-state', (state) => {
      if (state.gameState) setGameState(state.gameState);
      if (state.players) setPlayers(state.players);
      if (state.currentQuestion) {
        setCurrentQuestion(state.currentQuestion);
        setQuestionNumber(state.questionNumber);
        setTimer(state.timer);
        setAnsweredCount(state.answeredCount);
        setHasAnswered(state.hasAnswered);
      }
      if (state.leaderboard) {
        setLeaderboard(state.leaderboard);
      }
    });

    socket.on('question-start', (data) => {
      setCurrentQuestion(data);
      setQuestionNumber(data.questionIndex + 1);
      setTimer(data.questionDuration);
      setGameState('QUESTION');
      setAnsweredCount(0);
      setHasAnswered(false);
    });

    socket.on('player_answered', ({ count }) => {
      setAnsweredCount(count);
    });

    socket.on('leaderboard-update', ({ leaderboard: lb }) => {
      setLeaderboard(lb);
      setGameState('LEADERBOARD');
    });

    socket.on('game-over', ({ leaderboard: lb }) => {
      setLeaderboard(lb);
      setGameState('GAMEOVER');
    });

    return () => {
      socket.off('connect');
      socket.off('update-players');
      socket.off('sync-game-state');
      socket.off('question-start');
      socket.off('player_answered');
      socket.off('leaderboard-update');
      socket.off('game-over');
      disconnectSocket();
    };
  }, [accessCode, navigate]);

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'QUESTION') return;

    // If timer is already 0 (e.g. upon reload/sync), and we are the host, trigger leaderboard
    if (timer <= 0) {
      if (isHost) {
        socket.emit('request-leaderboard', { quizId: accessCode });
      }
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // request-leaderboard will be handled by the next effect run
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, timer <= 0, isHost, accessCode]);

  const handleStartGame = () => {
    socket.emit('start-game', { quizId: accessCode });
  };

  const handleNextQuestion = () => {
    socket.emit('next-question', { quizId: accessCode });
  };

  const handleAnswer = (index) => {
    if (hasAnswered || timer === 0) return;
    socket.emit('submit_answer', { quizId: accessCode, selectedIndex: index });
    setHasAnswered(true);
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen pt-24 pb-10 bg-slate-50 flex flex-col items-center justify-center px-4">
        <Card className="p-10 text-center max-w-md space-y-4">
          <h2 className="text-2xl font-bold text-red-600">Oops!</h2>
          <p className="text-slate-600">{error}</p>
          <Button onClick={() => navigate('/')} className="gap-2">
            <Home className="w-4 h-4" /> Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-10 bg-slate-50 flex flex-col items-center px-4">

      {/* HUD Bar */}
      <div className="w-full max-w-4xl flex flex-wrap justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="px-3 py-1 gap-1">
            <Users className="w-3 h-3" /> {players.length} Players
          </Badge>
          <Badge variant="outline" className="px-3 py-1 font-mono">
            Code: {accessCode}
          </Badge>
          {quizTitle && (
            <span className="font-bold text-slate-700 hidden sm:inline">
              {quizTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {gameState === 'QUESTION' && (
            <div
              className={`flex items-center gap-2 font-mono text-xl font-bold transition-colors ${
                timer <= 5 ? 'text-red-500 animate-pulse' : 'text-indigo-600'
              }`}
            >
              <Timer className="w-5 h-5" /> {timer}s
            </div>
          )}
          {isHost && gameState === 'LOBBY' && (
            <Button
              onClick={handleStartGame}
              size="sm"
              className="bg-green-600 hover:bg-green-700 gap-2 text-white"
            >
              <Play className="w-4 h-4" /> Start Game
            </Button>
          )}
          {isHost && gameState === 'LEADERBOARD' && (
            <Button
              onClick={handleNextQuestion}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 gap-2 text-white"
            >
              <ChevronRight className="w-4 h-4" /> Next Question
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── LOBBY ── */}
        {gameState === 'LOBBY' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center space-y-8 w-full max-w-2xl"
          >
            <div className="space-y-4">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-10 h-10 text-indigo-600 animate-bounce" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900">
                {isHost ? 'Press Start when ready!' : 'Waiting for host...'}
              </h1>
              <p className="text-slate-500 text-lg">
                {players.length > 0
                  ? `${players.length} player${players.length > 1 ? 's' : ''} in the arena`
                  : 'The arena is filling up!'}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {players.map((player, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={player}
                  className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center font-medium hover:scale-105 transition-transform"
                >
                  {player}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── QUESTION ── */}
        {gameState === 'QUESTION' && currentQuestion && (
          <motion.div
            key={`question-${questionNumber}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-3xl space-y-8"
          >
            <Card className="p-10 text-center shadow-xl border-none bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Trophy className="w-20 h-20" />
              </div>
              <Badge className="bg-white/20 text-white border-white/30 mb-4">
                Question {questionNumber}
              </Badge>
              <h2 className="text-3xl font-bold leading-tight relative z-10">
                {currentQuestion.questionText}
              </h2>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Button
                    disabled={hasAnswered || timer === 0}
                    onClick={() => handleAnswer(i)}
                    variant="outline"
                    className={`w-full h-24 text-xl font-semibold border-2 transition-all shadow-sm ${
                      hasAnswered
                        ? 'opacity-40 grayscale cursor-not-allowed'
                        : `${OPTION_COLORS[i]} active:scale-[0.97]`
                    }`}
                  >
                    {option}
                  </Button>
                </motion.div>
              ))}
            </div>

            <div className="text-center font-medium text-slate-500 bg-white py-4 rounded-xl border border-slate-100">
              {hasAnswered
                ? '✓ Answer submitted! Waiting for others...'
                : `${answeredCount} / ${players.length} players have answered`}
            </div>
          </motion.div>
        )}

        {/* ── LEADERBOARD / GAME OVER ── */}
        {(gameState === 'LEADERBOARD' || gameState === 'GAMEOVER') && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-2xl space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-4xl font-bold text-slate-900">
                {gameState === 'GAMEOVER' ? '🏆 Final Podium' : 'Rankings'}
              </h2>
            </div>

            <Card className="overflow-hidden border-slate-200 shadow-xl bg-white/80 backdrop-blur-sm">
              <div className="divide-y divide-slate-100">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry, i) => (
                    <motion.div
                      key={entry.username}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-5">
                        <span
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                            i === 0
                              ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-lg shadow-yellow-200'
                              : i === 1
                              ? 'bg-slate-200 text-slate-700'
                              : i === 2
                              ? 'bg-orange-200 text-orange-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="font-bold text-xl text-slate-800">
                          {entry.username}
                        </span>
                      </div>
                      <span className="font-mono text-2xl font-black text-indigo-600">
                        {entry.score}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-10 text-center text-slate-400">
                    No scores yet!
                  </div>
                )}
              </div>
            </Card>

            {gameState === 'GAMEOVER' && (
              <Button
                onClick={() => navigate('/')}
                className="w-full h-14 text-lg gap-2"
              >
                <Home className="w-5 h-5" /> Back to Home
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
