import React, { useEffect, useState } from 'react';
import { app, auth, db, storage } from '../lib/firebase';
import { initializePosts, initializeFirebaseFunctions } from '../lib/initializeFirebase';

interface FirebaseContextValue {
  app: typeof app;
  auth: typeof auth;
  db: typeof db;
  storage: typeof storage;
  isInitialized: boolean;
  error: Error | null;
}

export const FirebaseContext = React.createContext<FirebaseContextValue>({
  app,
  auth,
  db,
  storage,
  isInitialized: false,
  error: null
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initialize Firebase collections
    const initialize = async () => {
      try {
        await initializePosts();
        initializeFirebaseFunctions();
        setIsInitialized(true);
      } catch (err) {
        console.error("Firebase initialization error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        // Still mark as initialized so the app can continue with limited functionality
        setIsInitialized(true);
      }
    };
    
    initialize();
  }, []);

  const value = {
    app,
    auth,
    db,
    storage,
    isInitialized,
    error
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}