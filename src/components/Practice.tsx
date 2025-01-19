import React, { useState, useEffect } from 'react';
import { Mic, Play, ThumbsUp, Timer, Download } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Exercise {
  id: string;
  title: string;
}

export default function Practice() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [writing, setWriting] = useState('');
  const [savedWritings, setSavedWritings] = useState<{[key: string]: string}>(() => {
    const saved = localStorage.getItem('practice_writings');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    if (user) {
      fetchExercises();
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    localStorage.setItem('practice_writings', JSON.stringify(savedWritings));
  }, [savedWritings]);

  const fetchExercises = async () => {
    try {
      console.log('Fetching exercises with user:', user?.uid);
      setError(null);
      const querySnapshot = await getDocs(collection(db, 'exercises'));
      console.log('Got querySnapshot:', querySnapshot.size, 'documents');
      const exerciseData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Exercise[];
      console.log('Parsed exercise data:', exerciseData.length, 'exercises');
      setExercises(exerciseData);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching exercises:', error);
      setError(error?.message || 'Failed to load exercises');
      setLoading(false);
    }
  };

  const generateExercise = () => {
    console.log('Generating exercise from', exercises.length, 'exercises');
    if (exercises.length === 0) {
      setError('No exercises available');
      return;
    }
    const randomIndex = Math.floor(Math.random() * exercises.length);
    const newExercise = exercises[randomIndex];
    console.log('Selected exercise:', newExercise);
    setCurrentExercise(newExercise);
    setTimer(0);
    setIsTimerRunning(false);
    setWriting(savedWritings[newExercise.id] || '');
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!currentExercise || !writing) return;
    
    const element = document.createElement('a');
    const file = new Blob([
      `Exercise: ${currentExercise.title}\n\n${writing}`,
    ], { type: 'text/plain' });
    
    element.href = URL.createObjectURL(file);
    element.download = `writing-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center text-gray-400">
        Loading exercises...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg text-center">
          {error}
          <button
            onClick={fetchExercises}
            className="ml-4 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Practice Writing</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Get a random writing prompt to practice your comedy writing. Use these exercises
          to develop new material and sharpen your skills.
        </p>
      </div>

      <div className="bg-navy-800 rounded-lg shadow-xl p-6 border border-navy-700">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mic className="h-6 w-6 text-white" />
              <h2 className="text-xl font-semibold text-white">Writing Prompt</h2>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-100 text-lg mb-6">
              {currentExercise?.title || 'Click generate to get a writing prompt'}
            </p>

            <button
              onClick={generateExercise}
              className="px-6 py-3 bg-navy-700 text-white rounded-lg hover:bg-navy-600 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Play size={20} />
              <span>Generate Exercise</span>
            </button>
          </div>
          
          {currentExercise && (
            <>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={toggleTimer}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                    isTimerRunning 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-navy-700 hover:bg-navy-600'
                  } text-white transition-colors`}
                >
                  <Timer size={20} />
                  <span>{isTimerRunning ? 'Stop' : 'Start'} Timer</span>
                </button>
                <div className="text-xl font-mono text-orange-500">
                  {formatTime(timer)}
                </div>
              </div>

              <div className="space-y-4">
                <textarea
                  value={writing}
                  onChange={(e) => setWriting(e.target.value)}
                  placeholder="Write your material here..."
                  className="w-full h-64 bg-navy-700 border border-navy-600 rounded-lg p-4 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-navy-700 text-white rounded-lg hover:bg-navy-600 transition-colors flex items-center space-x-2"
                  >
                    <Download size={20} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-center">
            <div className="text-gray-400 text-sm flex items-center space-x-1">
              <ThumbsUp size={14} />
              <span>Write for at least 10 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}