import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Mail } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import MessageModal from './modals/MessageModal';

interface UserProfileProps {
  userId: string;
  onBack: () => void;
}

interface UserData {
  userId: string;
  username: string;
  bio: string;
  photoURL?: string;
}

interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  mediaTypes: string[];
  likes: number;
  comments: number;
  shares: number;
  createdAt: any;
}

export default function UserProfile({ userId, onBack }: UserProfileProps) {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user data
        const userSnapshot = await getDoc(doc(db, 'users', userId));
        if (!userSnapshot.exists()) {
          setError('User not found');
          return;
        }

        setUserData(userSnapshot.data() as UserData);

        // Get user's posts
        const postsQuery = query(
          collection(db, 'posts'),
          where('authorId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        const posts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        
        setUserPosts(posts);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center text-gray-400">
        Loading profile...
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
          {error || 'User not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <button
        onClick={onBack}
        className="mb-4 flex items-center text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Back to Feed
      </button>

      <div className="bg-[#1a2847] rounded-lg shadow-xl p-6 border border-[#2a3b61]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {userData.photoURL ? (
              <img
                src={userData.photoURL}
                alt={userData.username}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-[#243356] flex items-center justify-center text-orange-500 text-3xl font-semibold">
                {userData.username[0].toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">@{userData.userId}</h2>
              <p className="text-xl text-gray-300">{userData.username}</p>
              {userData.bio && (
                <p className="text-gray-400 mt-2">{userData.bio}</p>
              )}
            </div>
          </div>
          
          {user && user.uid !== userId && (
            <button
              onClick={() => setShowMessageModal(true)}
              className="px-4 py-2 bg-navy-500 text-white rounded-lg hover:bg-navy-600 transition-colors flex items-center space-x-2"
            >
              <Mail size={20} />
              <span>Message</span>
            </button>
          )}
        </div>

        <div className="border-t border-[#2a3b61] pt-6">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Posts</h3>
          <div className="space-y-4">
            {userPosts.map(post => (
              <div key={post.id} className="bg-[#243356] rounded-lg p-4 border border-[#2a3b61]">
                <p className="text-gray-100 whitespace-pre-wrap">{post.content}</p>
                <div className="text-sm text-gray-400 mt-2">
                  {post.createdAt?.toDate().toLocaleDateString()}
                </div>
              </div>
            ))}
            {userPosts.length === 0 && (
              <p className="text-gray-400 text-center py-4">
                No posts yet
              </p>
            )}
          </div>
        </div>
      </div>

      {showMessageModal && (
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          recipientId={userId}
          recipientName={userData.username}
        />
      )}
    </div>
  );
}