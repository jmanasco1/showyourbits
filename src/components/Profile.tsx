import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { User, Edit2, Save, X, Facebook, Twitter, Instagram, Camera } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

interface UserProfile {
  username: string;
  bio: string;
  userId: string;
  photoURL?: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { userId } = useParams();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ 
    username: '', 
    bio: '', 
    userId: '',
    socialLinks: {} 
  });
  const [editedProfile, setEditedProfile] = useState<UserProfile>({ 
    username: '', 
    bio: '', 
    userId: '',
    socialLinks: {} 
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId || !db) {
      setLoading(false);
      return;
    }

    console.log('Setting up profile for user:', userId);
    setLoading(true);
    setError(null);

    const getProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          setProfile(userData);
          setEditedProfile(userData);
        } else {
          setError('Profile not found');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      }
      setLoading(false);
    };

    getProfile();
  }, [userId, db, user]);

  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        username: editedProfile.username,
        bio: editedProfile.bio,
        userId: userId,
        socialLinks: editedProfile.socialLinks
      });

      setProfile(editedProfile);
      setEditing(false);
      setError(null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      setError(null);

      // Upload image to Firebase Storage
      const storageRef = ref(storage, `profile-pictures/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Update auth profile
      await updateProfile(user, { photoURL });

      // Update Firestore profile
      await updateDoc(doc(db, 'users', userId), {
        photoURL
      });

      setProfile({ ...profile, photoURL });
      setEditedProfile({ ...editedProfile, photoURL });
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setError('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Please log in to view your profile and messages.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg relative mb-4">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="absolute top-0 right-0 p-4"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="bg-navy-400 rounded-lg shadow-xl p-6 border border-navy-500">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Profile</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center text-orange-500 hover:text-orange-400"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleProfileUpdate}
                className="flex items-center text-green-500 hover:text-green-400"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditedProfile(profile);
                }}
                className="flex items-center text-red-500 hover:text-red-400"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-navy-500 flex items-center justify-center overflow-hidden">
                {profile.photoURL ? (
                  <img 
                    src={profile.photoURL} 
                    alt={profile.username} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={64} className="text-orange-500" />
                )}
              </div>
              {editing && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-orange-500 rounded-full text-white hover:bg-orange-400 transition-colors"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            {editing ? (
              <input
                type="text"
                value={editedProfile.username}
                onChange={(e) => setEditedProfile({ ...editedProfile, username: e.target.value })}
                className="w-full bg-navy-500 border border-navy-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            ) : (
              <p className="text-white px-4 py-2">{profile.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
            {editing ? (
              <textarea
                value={editedProfile.bio}
                onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                rows={3}
                className="w-full bg-navy-500 border border-navy-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            ) : (
              <p className="text-white px-4 py-2">{profile.bio || 'No bio yet'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">Social Media Links</label>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Facebook className="h-5 w-5 text-blue-500" />
                {editing ? (
                  <input
                    type="url"
                    placeholder="Facebook profile URL"
                    value={editedProfile.socialLinks?.facebook || ''}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      socialLinks: { ...editedProfile.socialLinks, facebook: e.target.value }
                    })}
                    className="flex-1 bg-navy-500 border border-navy-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : profile.socialLinks?.facebook ? (
                  <a 
                    href={profile.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    {profile.socialLinks.facebook}
                  </a>
                ) : (
                  <p className="text-gray-400">No Facebook profile linked</p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <Twitter className="h-5 w-5 text-sky-500" />
                {editing ? (
                  <input
                    type="url"
                    placeholder="Twitter/X profile URL"
                    value={editedProfile.socialLinks?.twitter || ''}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      socialLinks: { ...editedProfile.socialLinks, twitter: e.target.value }
                    })}
                    className="flex-1 bg-navy-500 border border-navy-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : profile.socialLinks?.twitter ? (
                  <a 
                    href={profile.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-500 hover:text-sky-400 transition-colors"
                  >
                    {profile.socialLinks.twitter}
                  </a>
                ) : (
                  <p className="text-gray-400">No Twitter/X profile linked</p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <Instagram className="h-5 w-5 text-pink-500" />
                {editing ? (
                  <input
                    type="url"
                    placeholder="Instagram profile URL"
                    value={editedProfile.socialLinks?.instagram || ''}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      socialLinks: { ...editedProfile.socialLinks, instagram: e.target.value }
                    })}
                    className="flex-1 bg-navy-500 border border-navy-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : profile.socialLinks?.instagram ? (
                  <a 
                    href={profile.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-500 hover:text-pink-400 transition-colors"
                  >
                    {profile.socialLinks.instagram}
                  </a>
                ) : (
                  <p className="text-gray-400">No Instagram profile linked</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}