import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trophy, Users, Zap, Globe } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const [joinCode, setJoinCode] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (joinCode.length === 6) {
      navigate(`/game/${joinCode}`);
    }
  };

  return (
    <div className="relative min-h-screen pt-24 pb-20 overflow-hidden bg-slate-50">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      <main className="container mx-auto px-6 relative">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
          
          {/* Left: Hero Text */}
          <div className="w-full lg:w-1/2 text-left space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Quiz Night <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  Made Epic.
                </span>
              </h1>
              <p className="mt-6 text-xl text-slate-600 max-w-lg leading-relaxed">
                Experience real-time multiplayer puzzles with friends. Compete, climb the leaderboard, and claim your glory.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
                <Users className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-slate-700">10k+ Players</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-slate-700">Daily Rewards</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Join Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="w-full lg:w-[450px]"
          >
            <Card className="p-8 shadow-2xl shadow-indigo-500/10 border-slate-200/60 backdrop-blur-sm bg-white/80">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">Join a Game</h2>
                  <p className="text-slate-500">Enter your 6-digit access code</p>
                </div>
                
                <div className="space-y-4">
                  <Input
                    placeholder="e.g. 123456"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="text-center text-2xl tracking-[0.5em] font-mono h-16 border-2 focus:ring-purple-500"
                    maxLength={6}
                  />
                  <Button 
                    onClick={handleJoin}
                    disabled={joinCode.length !== 6}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                  >
                    Join Arena
                  </Button>
                </div>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Or host your own</span></div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => navigate('/create')}
                  className="w-full h-14 border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 active:scale-[0.98]"
                >
                  Create New Quiz
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Features Bottom */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Zap, title: "Zero Lag", desc: "Real-time sync powered by Socket.io and Redis." },
            { icon: Globe, title: "Global Play", desc: "Join rooms from anywhere in the world instantly." },
            { icon: Trophy, title: "Live Ranks", desc: "Watch the leaderboard shift as every second counts." }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
