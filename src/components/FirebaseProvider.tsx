import React, { useEffect } from 'react';
import { app, auth, db, storage } from '../lib/firebase';
import { initializePosts } from '../lib/initializeFirebase';

interface FirebaseContextValue {
  app: typeof app;
  auth: typeof auth;
  db: typeof db;
  storage: typeof storage;
}

export const FirebaseContext = React.createContext<FirebaseContextValue>({
  app,
  auth,
  db,
  storage
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Firebase collections
    initializePosts();
  }, []);

  const value = {
    app,
    auth,
    db,
    storage
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}