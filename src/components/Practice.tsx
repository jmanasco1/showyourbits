import React, { useState, useEffect } from 'react';
import { Mic, Play, ThumbsUp, Timer, Download, Share2 } from 'lucide-react';
import { collection, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
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
  const [shareModal, setShareModal] = useState({
    isOpen: false
  });

  useEffect(() => {
    if (user) {
      // Debug: Log user data when component mounts
      console.log('Current user from Firebase Auth:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });

      // Debug: Check Firestore user data
      const checkUserData = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        console.log('Firestore user data:', userDoc.exists() ? userDoc.data() : 'No user document');
      };
      checkUserData();

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

  const handleShare = async () => {
    try {
      if (!currentExercise || !writing || !user) {
        console.log('Missing required data:', { currentExercise, writing, user });
        return;
      }

      // Get user data exactly like Write.tsx does
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      console.log('Raw userDoc:', userDoc);
      
      const userData = userDoc.exists() ? userDoc.data() : null;
      console.log('Raw userData:', userData);
      
      // Log each potential value separately
      console.log('Potential values:', {
        'userData?.username': userData?.username,
        'user.email': user.email,
        'user.email?.split("@")[0]': user.email?.split('@')[0]
      });

      const username = userData?.username || user.email?.split('@')[0] || 'Anonymous';
      console.log('Selected username:', username);

      const postData = {
        content: `Exercise: ${currentExercise.title}\n\n${writing}`,
        authorId: user.uid,
        authorName: username, // Use username directly like Write.tsx does
        authorPhoto: user.photoURL || '',
        mediaUrls: [],
        mediaTypes: [],
        likes: 0,
        comments: [],
        tags: ['practice'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Final post data:', postData);

      const postRef = collection(db, 'posts');
      const newPost = await addDoc(postRef, postData);
      console.log('Post created with ID:', newPost.id);

      setShareModal({ isOpen: false });
    } catch (err) {
      console.error('Error sharing to feed:', err);
      setError('Failed to share to feed');
    }
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

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShareModal({ isOpen: true })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    disabled={!writing}
                  >
                    <Share2 size={20} />
                    <span>Share to Feed</span>
                  </button>
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
      {/* Share Confirmation Modal */}
      {shareModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-navy-800 rounded-lg p-6 max-w-md w-full border border-navy-700">
            <h3 className="text-lg font-semibold mb-4 text-white">Share to Public Feed</h3>
            <p className="mb-4 text-gray-300">
              Are you sure you want to share this practice writing to the public feed?
              Everyone will be able to see what you wrote.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShareModal({ isOpen: false })}
                className="px-4 py-2 text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}