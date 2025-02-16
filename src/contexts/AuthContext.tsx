import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfilePhoto: (photoURL: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid} logged in` : 'No user');
      setUser(user);
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  async function signup(email: string, password: string) {
    try {
      console.log('Attempting signup...');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Signup successful:', result.user.uid);
      
      const username = email.split('@')[0];
      
      // Set display name in Firebase Auth
      await updateProfile(result.user, {
        displayName: username
      });
      
      // Create initial user profile in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        username: username,
        displayName: username,
        bio: '',
        userId: result.user.uid,
        photoURL: result.user.photoURL || '',
        socialLinks: {},
        createdAt: new Date().toISOString()
      });
      
      console.log('Created user profile in Firestore');
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      console.log('Attempting login...');
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', result.user.uid);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      console.log('Attempting logout...');
      await signOut(auth);
      console.log('Logout successful');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async function resetPassword(email: string) {
    try {
      console.log('Attempting password reset...');
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent');
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  async function updateProfilePhoto(photoURL: string) {
    if (!user) throw new Error('No user logged in');
    
    try {
      // Update the user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { photoURL }, { merge: true });
      
      // Update the auth user profile
      await updateProfile(user, { photoURL });
      
      console.log('Profile photo updated successfully');
    } catch (error: any) {
      console.error('Profile photo update error:', error);
      throw error;
    }
  }

  async function updateDisplayName(displayName: string) {
    if (!user) throw new Error('No user logged in');
    
    try {
      // Update the user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { displayName }, { merge: true });
      
      // Update the auth user profile
      await updateProfile(user, { displayName });
      
      console.log('Display name updated successfully');
    } catch (error: any) {
      console.error('Display name update error:', error);
      throw error;
    }
  }

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    updateProfilePhoto,
    updateDisplayName
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}