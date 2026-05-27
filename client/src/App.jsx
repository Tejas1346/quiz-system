import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import GameRoom from './pages/GameRoom'
import CreateQuiz from './pages/CreateQuiz'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background font-sans antialiased text-slate-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/game/:quizId" element={<GameRoom />} />
          <Route path="/create" element={<CreateQuiz />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
