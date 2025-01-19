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
      // Create system user profile
      await setDoc(doc(db, 'users', 'system'), {
        username: 'Show Your Bits',
        bio: 'Official system account'
      });

      for (const post of samplePosts) {
        await addDoc(postsRef, post);
      }
      console.log('Sample posts initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing posts:', error);
  }
}