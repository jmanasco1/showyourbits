import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

const exercises = [
  "Write a bit about your most embarrassing moment",
  "Create a character based on someone you saw today",
  "Write about your worst date ever",
  "Describe your morning routine in a funny way",
  "Write about your pet's secret life",
  "Create a bit about technology frustrations",
  "Write about family holiday disasters",
  "Create a bit about grocery shopping adventures",
  "Write about gym experiences",
  "Describe your ideal day gone wrong"
];

export async function uploadExercises() {
  try {
    let added = 0;
    
    for (const exercise of exercises) {
      // Check if exercise already exists
      const q = query(collection(db, 'exercises'), where('title', '==', exercise));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await addDoc(collection(db, 'exercises'), {
          title: exercise,
          createdAt: new Date().toISOString()
        });
        added++;
      }
    }
    
    return { success: true, added };
  } catch (error) {
    console.error('Error uploading exercises:', error);
    throw error;
  }
}