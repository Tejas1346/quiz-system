import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Save, ChevronLeft } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0, duration: 15 }
  ]);
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0, duration: 15 }]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (!title || questions.some(q => !q.questionText)) {
      alert("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/quizzes', { title, questions });
      // Navigate directly to the game room so host can start
      navigate(`/game/${data.accessCode}`);
    } catch (error) {
      alert(error.response?.data?.error || "Only hosts can create quizzes. Make sure your role is 'host'.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-50 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Create New Quiz</h1>
          <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 gap-2 shadow-lg shadow-indigo-100">
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Quiz'}
          </Button>
        </div>

        <Card className="p-6 shadow-sm border-slate-200">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Quiz Title</label>
            <Input 
              placeholder="e.g. Science Bowl 2024" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold h-14"
            />
          </div>
        </Card>

        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={qIndex}
            >
              <Card className="p-6 shadow-md border-slate-200 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <div className="flex justify-between items-start">
                  <span className="text-sm font-black text-indigo-200">QUESTION #{qIndex + 1}</span>
                  {questions.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(qIndex)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <Input 
                    placeholder="Enter your question here..." 
                    value={q.questionText} 
                    onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                    className="h-12 font-medium"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <div 
                          onClick={() => updateQuestion(qIndex, 'correctAnswerIndex', oIndex)}
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all flex items-center justify-center ${
                            q.correctAnswerIndex === oIndex ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                          }`}
                        >
                          {q.correctAnswerIndex === oIndex && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <Input 
                          placeholder={`Option ${oIndex + 1}`} 
                          value={opt}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          className={q.correctAnswerIndex === oIndex ? 'border-indigo-200 bg-indigo-50/30' : ''}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                    <span className="text-sm font-medium text-slate-500">Duration (seconds):</span>
                    <Input 
                      type="number" 
                      value={q.duration} 
                      onChange={(e) => updateQuestion(qIndex, 'duration', parseInt(e.target.value))}
                      className="w-24"
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <Button onClick={addQuestion} variant="outline" className="w-full h-16 border-dashed border-2 hover:bg-white hover:border-indigo-400 hover:text-indigo-600 gap-2 transition-all">
          <Plus className="w-5 h-5" /> Add Another Question
        </Button>
      </div>
    </div>
  );
}
