import React, { useState, useEffect } from 'react';
import { Shield, Plus, Upload, UserX, UserCheck, Key, Trash2, Star, MessageSquare } from 'lucide-react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import exercises from '../data/exercises.json';
import { sendPasswordResetEmail } from 'firebase/auth';

interface User {
  id: string;
  username?: string;
  email?: string;
  disabled?: boolean;
  isAdmin?: boolean;
  createdAt: string;
}

interface Post {
  id: string;
  content: string;
  authorId: string;
  authorEmail: string;
  createdAt: string;
}

export default function AdminPortal() {
  const { user } = useAuth();
  const [newExercise, setNewExercise] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'exercises' | 'users' | 'posts'>('users');

  // Check if user is admin
  const isAdmin = user?.email === 'admin@example.com';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchPosts();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const usersQuery = query(collection(db, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      // Sort users by username
      usersData.sort((a, b) => {
        const usernameA = a.username || a.email?.split('@')[0] || a.id;
        const usernameB = b.username || b.email?.split('@')[0] || b.id;
        return usernameA.localeCompare(usernameB);
      });
      
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    }
  };

  const fetchPosts = async () => {
    try {
      const postsSnapshot = await getDocs(collection(db, 'posts'));
      const postsData = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to fetch posts');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean = false) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        disabled: !currentStatus
      });
      await fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      await fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const handleToggleAdminStatus = async (userId: string, currentStatus: boolean = false) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isAdmin: !currentStatus
      });
      await fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error toggling admin status:', err);
      setError('Failed to update admin status');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent successfully!');
    } catch (err) {
      console.error('Error sending password reset:', err);
      setError('Failed to send password reset email');
    }
  };

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newExercise.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'exercises'), {
        title: newExercise.trim(),
        createdAt: new Date().toISOString()
      });
      setNewExercise('');
    } catch (err) {
      console.error('Error adding exercise:', err);
      setError('Failed to add exercise. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadExercises = async () => {
    if (!isAdmin || loading) return;
    
    setLoading(true);
    setError(null);

    try {
      for (const exercise of exercises) {
        await addDoc(collection(db, 'exercises'), {
          title: exercise,
          createdAt: new Date().toISOString()
        });
      }
      alert('Exercises uploaded successfully!');
    } catch (err) {
      console.error('Error uploading exercises:', err);
      setError('Failed to upload exercises. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'posts', postId));
      await fetchPosts(); // Refresh the list
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post');
    }
  };

  const handleDeleteAllUserPosts = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to delete all posts by ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      const userPosts = posts.filter(post => post.authorId === userId);
      for (const post of userPosts) {
        await deleteDoc(doc(db, 'posts', post.id));
      }
      await fetchPosts(); // Refresh the list
      alert(`Successfully deleted all posts by ${userEmail}`);
    } catch (err) {
      console.error('Error deleting user posts:', err);
      setError('Failed to delete user posts');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center">
          <Shield className="mr-2" /> Admin Portal
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'posts'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'exercises'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Exercises
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {activeTab === 'users' ? (
        <div className="bg-navy-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-gray-400 font-medium mb-2">
              <div>USERNAME</div>
              <div>EMAIL</div>
              <div>USER ID</div>
            </div>
            
            {users.map(user => (
              <div 
                key={user.id} 
                className="grid grid-cols-3 gap-4 p-4 bg-navy-700 rounded-lg hover:bg-navy-600 transition-colors"
              >
                <div className="text-white font-medium">
                  {user.username || user.email?.split('@')[0] || 'Anonymous'}
                </div>
                <div className="text-gray-300">
                  {user.email || 'No email'}
                </div>
                <div className="text-gray-400 font-mono text-sm">
                  {user.id}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'posts' ? (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Post Management</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Content</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white line-clamp-2">{post.content}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">{post.authorEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete Post"
                      >
                        <Trash2 size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteAllUserPosts(post.authorId, post.authorEmail)}
                        className="text-yellow-400 hover:text-yellow-300"
                        title="Delete All Posts by this User"
                      >
                        <MessageSquare size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Exercise Management</h2>
          <form onSubmit={handleAddExercise} className="mb-6">
            <div className="flex space-x-4">
              <input
                type="text"
                value={newExercise}
                onChange={(e) => setNewExercise(e.target.value)}
                placeholder="Enter new exercise..."
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !newExercise.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Plus className="mr-2" size={20} />
                Add Exercise
              </button>
              <button
                type="button"
                onClick={handleUploadExercises}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Upload className="mr-2" size={20} />
                Upload All
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}