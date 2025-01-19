import React, { useState, useEffect } from 'react';
import { Target, Plus, Trash2, CheckCircle, Calendar, TrendingUp } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  category: string;
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('goals');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newGoal, setNewGoal] = useState({
    title: '',
    target: 0,
    period: 'monthly' as const,
    category: '',
  });

  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim() || newGoal.target <= 0) return;

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      target: newGoal.target,
      current: 0,
      period: newGoal.period,
      startDate: new Date().toISOString(),
      category: newGoal.category,
    };

    setGoals(prev => [...prev, goal]);
    setNewGoal({
      title: '',
      target: 0,
      period: 'monthly',
      category: '',
    });
  };

  const handleIncrement = (id: string) => {
    setGoals(prev =>
      prev.map(goal =>
        goal.id === id
          ? { ...goal, current: Math.min(goal.current + 1, goal.target) }
          : goal
      )
    );
  };

  const handleDecrement = (id: string) => {
    setGoals(prev =>
      prev.map(goal =>
        goal.id === id
          ? { ...goal, current: Math.max(goal.current - 1, 0) }
          : goal
      )
    );
  };

  const handleDeleteGoal = (id: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setGoals(prev => prev.filter(goal => goal.id !== id));
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.round((current / target) * 100);
  };

  const getTimeRemaining = (period: string, startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const periods = {
      weekly: 7,
      monthly: 30,
      yearly: 365,
    };
    const totalDays = periods[period as keyof typeof periods];
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(totalDays - elapsed, 0);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Goal Tracking</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Set and track your comedy goals. Whether it's open mics, writing sessions, or new bits,
          keep yourself accountable and measure your progress.
        </p>
      </div>

      <div className="bg-navy-800 rounded-lg shadow-xl p-6 border border-navy-700">
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Goal Title</label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="E.g., Open Mic Performances"
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Target Number</label>
              <input
                type="number"
                value={newGoal.target || ''}
                onChange={(e) => setNewGoal(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                min="1"
                placeholder="E.g., 150"
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Time Period</label>
              <select
                value={newGoal.period}
                onChange={(e) => setNewGoal(prev => ({ ...prev, period: e.target.value as Goal['period'] }))}
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <input
                type="text"
                value={newGoal.category}
                onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                placeholder="E.g., Performance"
                className="w-full bg-navy-700 border border-navy-600 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-navy-700 text-white rounded-lg hover:bg-navy-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Goal</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(goal => (
          <div key={goal.id} className="bg-navy-800 rounded-lg shadow-lg p-4 border border-navy-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Calendar size={14} />
                  <span className="capitalize">{goal.period}</span>
                  {goal.category && (
                    <>
                      <span>•</span>
                      <span>{goal.category}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteGoal(goal.id)}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-gray-300">
                <span>Progress: {goal.current} / {goal.target}</span>
                <span>{calculateProgress(goal.current, goal.target)}%</span>
              </div>
              <div className="w-full bg-navy-700 rounded-full h-2.5">
                <div
                  className="bg-orange-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProgress(goal.current, goal.target)}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDecrement(goal.id)}
                  className="px-2 py-1 bg-navy-700 text-white rounded hover:bg-navy-600 transition-colors"
                >
                  -
                </button>
                <button
                  onClick={() => handleIncrement(goal.id)}
                  className="px-2 py-1 bg-navy-700 text-white rounded hover:bg-navy-600 transition-colors"
                >
                  +
                </button>
              </div>
              <div className="text-sm text-gray-400">
                {getTimeRemaining(goal.period, goal.startDate)} days remaining
              </div>
            </div>
          </div>
        ))}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No goals set yet. Time to aim high!
        </div>
      )}
    </div>
  );
}