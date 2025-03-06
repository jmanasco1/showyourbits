import React, { useState, useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { MessageCircle, LogOut, Shield } from 'lucide-react';
import Goals from './components/Goals';
import Profile from './components/Profile';
import Practice from './components/Practice';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import AdminPortal from './components/AdminPortal';
import { Feed } from './components/feed/Feed';
import FeedbackModal from './components/modals/FeedbackModal';
import { useAuth } from './contexts/AuthContext';
import logoImage from './assets/logo.png';
import Navigation from './components/Navigation';
import Layout from './components/Layout';
import Write from './components/Write';
import IdeaBank from './components/IdeaBank';
import { FirebaseContext } from './components/FirebaseProvider';
import Login from './components/Login';

export default function App() {
  const navigate = useNavigate();
  const { user, loading, logout, isAdmin } = useAuth();
  const { error: firebaseError } = useContext(FirebaseContext);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const handleProfileClick = (userId: string) => {
    setSelectedProfileId(userId);
    navigate('/profile');
  };

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // If not logged in, show login page
  if (!user) {
    return (
      <div className="min-h-screen bg-navy-900">
        <Login />
      </div>
    );
  }

  // If there's a Firebase error, show a more user-friendly error message
  if (firebaseError) {
    return (
      <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-bold mb-4">Connection Issue</h1>
        <p className="mb-4">We're having trouble connecting to our servers. This could be due to:</p>
        <ul className="list-disc pl-5 mb-4">
          <li>Your internet connection</li>
          <li>Temporary server maintenance</li>
          <li>Firewall or network restrictions</li>
        </ul>
        <p>Please try again later or check your network connection.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-navy-900 flex flex-col">
        <header className="bg-navy-900 border-navy-800 shadow-lg border-b py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-24">
              <div className="flex-1 flex justify-end">
                <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "'Dancing Script', cursive" }}>
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
                  onClick={() => setFeedbackOpen(true)}
                  className="flex items-center px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-navy-800 transition-colors"
                  aria-label="Feedback"
                >
                  <MessageCircle size={20} className="mr-2" />
                  <span>Feedback</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="px-4 py-2 rounded-lg flex items-center text-gray-400 hover:text-white hover:bg-navy-800 transition-colors"
                  >
                    <Shield size={20} className="mr-2" />
                    <span>Admin</span>
                  </button>
                )}
                <button
                  onClick={() => navigate(`/profile/${user.uid}`)}
                  className="px-4 py-2 rounded-lg flex items-center text-gray-400 hover:text-white hover:bg-navy-800 transition-colors"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="h-6 w-6 rounded-full mr-2" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-navy-700 flex items-center justify-center mr-2">
                      <span className="text-sm font-medium text-white">
                        {user.email?.[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span>Profile</span>
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg flex items-center text-gray-400 hover:text-white hover:bg-navy-800 transition-colors"
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
          isOpen={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
        />
      </div>
    </Layout>
  );
}