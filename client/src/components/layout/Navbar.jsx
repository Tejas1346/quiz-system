import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button"
import { Sparkles, LogOut, User as UserIcon } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (error) {
        setUser(null);
      }
    };
    if (localStorage.getItem('token')) fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/auth');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/60 backdrop-blur-md border-b">
      <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="text-white w-6 h-6" />
        </div>
        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
          QuizMaster
        </span>
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
              <UserIcon className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{user.displayName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-500 hover:text-red-500">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <>
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => navigate('/auth')}>Log In</Button>
            <Button 
               onClick={() => navigate('/auth')}
               className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-purple-200 border-none transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Get Started
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
