import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { LogOut, Shield, Sun, Moon, MessageCircle } from 'lucide-react';
import Write from './components/Write';
import Practice from './components/Practice';
import Goals from './components/Goals';
import IdeaBank from './components/IdeaBank';
import AdminPortal from './components/AdminPortal';
import Login from './components/Login';
import Profile from './components/Profile';
import { Feed } from './components/feed/Feed';
import FeedbackModal from './components/modals/FeedbackModal';
import { useAuth } from './contexts/AuthContext';
import logoImage from './assets/logo.png';
import Navigation from './components/Navigation';
import Layout from './components/Layout';
import Privacy from './components/Privacy';
import Terms from './components/Terms';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const { user, logout } = useAuth();
  const isAdmin = user?.email === 'admin@example.com';
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <Login />
      </div>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-navy-900' : 'bg-gray-100'} flex flex-col transition-colors duration-200`}>
        <header className={`${theme === 'dark' ? 'bg-navy-900 border-navy-800' : 'bg-white border-gray-200'} shadow-lg border-b transition-colors duration-200 py-2`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-24">
              <div className="flex-1 pl-8">
                <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: "'Dancing Script', cursive" }}>
                  Show Your Bits
                </h1>
              </div>
              <div className="flex-1 flex justify-center">
                <img 
                  src={logoImage}
                  alt="Show Your Bits"
                  className="h-[120px] w-[120px] object-contain"
                />
              </div>
              <div className="flex-1 flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className={`flex items-center px-4 py-2 rounded-lg ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:text-white hover:bg-navy-800' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  } transition-colors`}
                  aria-label="Feedback"
                >
                  <MessageCircle size={20} className="mr-2" />
                  <span>Feedback</span>
                </button>
                <button
                  onClick={toggleTheme}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:text-white hover:bg-navy-800' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  } transition-colors`}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-white hover:bg-navy-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <Shield size={20} className="mr-2" />
                    <span>Admin</span>
                  </button>
                )}
                <button
                  onClick={() => navigate(`/profile/${user.uid}`)}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-navy-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  } transition-colors`}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="h-6 w-6 rounded-full mr-2" />
                  ) : (
                    <div className={`h-6 w-6 rounded-full ${
                      theme === 'dark' ? 'bg-navy-700' : 'bg-gray-300'
                    } flex items-center justify-center mr-2`}>
                      <span className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {user.email?.[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span>Profile</span>
                </button>
                <button
                  onClick={logout}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-navy-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  } transition-colors`}
                >
                  <LogOut size={20} className="mr-2" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
          <Navigation />
        </header>

        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Feed onProfileClick={handleProfileClick} />} />
            <Route path="/feed" element={<Feed onProfileClick={handleProfileClick} />} />
            <Route path="/write" element={<Write />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/ideas" element={<IdeaBank />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route 
              path="/admin" 
              element={isAdmin ? <AdminPortal /> : <Feed onProfileClick={handleProfileClick} />} 
            />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
        </main>

        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
        />
      </div>
    </Layout>
  );
}