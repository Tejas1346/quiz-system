import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { data } = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
        });
        if (!data.token) {
          alert("Login failed");
          return;
        }
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        await api.post('/auth/register', formData);
        alert('Account created! You can now log in.');
        setIsLogin(true);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-2xl border-slate-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-slate-500 mt-2">
              {isLogin ? 'Log in to your account to continue' : 'Join the arena and start quizzing'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Display Name</label>
                <Input
                  required
                  placeholder="John Doe"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <Input
                required
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Input
                required
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <Button
              disabled={loading}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 mt-4"
            >
              {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 hover:underline text-sm font-medium"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
