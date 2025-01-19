import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { FirebaseOptions } from 'firebase/app';

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyAeCb7WSFLzISLhHJYxXPLapzSW4oSOTis",
  authDomain: "activity-stream-d29c5.firebaseapp.com",
  projectId: "activity-stream-d29c5",
  storageBucket: "activity-stream-d29c5.appspot.com",
  messagingSenderId: "645726731459",
  appId: "1:645726731459:web:832d548c2e2723820a3676"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };