import { collection, getDocs, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const samplePosts = [
  {
    content: "Welcome to Show Your Bits! Share your comedy journey with the community.",
    authorId: "system",
    authorName: "Show Your Bits", // Updated from "System"
    authorPhoto: "",
    mediaUrls: [],
    mediaTypes: [],
    likes: 0,
    comments: 0,
    shares: 0,
    createdAt: serverTimestamp()
  }
];

export async function initializePosts() {
  try {
    const postsRef = collection(db, 'posts');
    const snapshot = await getDocs(postsRef);
    
    // Only add sample posts if collection is empty
    if (snapshot.empty) {
      try {
        // Create system user profile
        await setDoc(doc(db, 'users', 'system'), {
          username: 'Show Your Bits',
          bio: 'Official system account'
        });
        
        // Add sample posts
        for (const post of samplePosts) {
          await addDoc(postsRef, post);
        }
        console.log('Sample posts added successfully');
      } catch (error) {
        console.log('Error adding sample data:', error);
        // Continue execution even if adding sample data fails
      }
    }
  } catch (error) {
    console.error('Error initializing posts:', error);
    // Don't throw the error, just log it to prevent app from crashing
  }
}

// Initialize Firebase Functions
export function initializeFirebaseFunctions() {
  try {
    // This function can be expanded to initialize other Firebase services
    console.log('Firebase Functions initialized');
  } catch (error) {
    console.error('Error initializing Firebase Functions:', error);
  }
}