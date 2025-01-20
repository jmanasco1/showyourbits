import React, { useState } from 'react';
import { Image, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../contexts/AuthContext';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function CreatePost() {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': [],
      'video/*': []
    },
    onDrop: acceptedFiles => {
      setSelectedFiles(prev => [...prev, ...acceptedFiles]);
    },
    maxFiles: 4
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!newPost.trim() && selectedFiles.length === 0) || loading) return;

    setLoading(true);
    setError(null); // Clear any previous errors

    try {
      console.log('Starting post creation...', { filesCount: selectedFiles.length });
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      const username = userData?.username || user.email?.split('@')[0] || 'Anonymous';
      const authorPhoto = userData?.photoURL || user.photoURL || '';  // Get user's photo URL

      const mediaUrls: string[] = [];
      const mediaTypes: string[] = [];

      for (const file of selectedFiles) {
        try {
          console.log('Starting file upload:', { fileName: file.name, fileType: file.type, fileSize: file.size });
          const bucket = 'activity-stream-d29c5.firebasestorage.app';
          const storageRef = ref(storage, `gs://${bucket}/posts/${Date.now()}-${file.name}`);
          
          console.log('Uploading file to storage...');
          const uploadResult = await uploadBytes(storageRef, file);
          console.log('File uploaded successfully:', uploadResult);
          
          console.log('Getting download URL...');
          const url = await getDownloadURL(storageRef);
          console.log('Got download URL:', url);
          
          mediaUrls.push(url);
          mediaTypes.push(file.type.startsWith('image/') ? 'image' : 'video');
        } catch (uploadErr) {
          console.error('Error uploading file:', file.name, uploadErr);
          throw new Error(`Failed to upload file ${file.name}: ${uploadErr.message}`);
        }
      }

      console.log('Creating Firestore document...');
      const postData = {
        content: newPost.trim(),
        authorId: user.uid,
        authorName: username,
        authorPhoto: authorPhoto,  // Include author's photo in the post
        mediaUrls,
        mediaTypes,
        likes: 0,
        comments: 0,
        shares: 0,
        likedBy: [],
        createdAt: serverTimestamp()
      };
      const postDoc = await addDoc(collection(db, 'posts'), postData);
      console.log('Post created successfully:', postDoc.id);

      setNewPost('');
      setSelectedFiles([]);
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-navy-400 rounded-lg shadow-xl p-6 border border-navy-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Share your thoughts..."
          className="w-full bg-navy-500 border border-navy-500 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          rows={3}
        />

        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="h-20 w-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div {...getRootProps()} className="cursor-pointer">
            <input {...getInputProps()} />
            <button
              type="button"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <Image size={20} />
              <span>Add Media</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || (!newPost.trim() && selectedFiles.length === 0)}
            className={`px-4 py-2 rounded-lg ${
              loading
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600'
            } text-white font-medium transition-colors`}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}