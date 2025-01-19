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

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      const username = userData?.username || user.email?.split('@')[0] || 'Anonymous';

      const mediaUrls: string[] = [];
      const mediaTypes: string[] = [];

      for (const file of selectedFiles) {
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        mediaUrls.push(url);
        mediaTypes.push(file.type.startsWith('image/') ? 'image' : 'video');
      }

      await addDoc(collection(db, 'posts'), {
        content: newPost.trim(),
        authorId: user.uid,
        authorName: username,
        authorPhoto: user.photoURL || '',
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : [],
        mediaTypes: mediaTypes.length > 0 ? mediaTypes : [],
        likes: 0,
        comments: 0,
        shares: 0,
        likedBy: [],
        createdAt: serverTimestamp()
      });

      setNewPost('');
      setSelectedFiles([]);
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-navy-400 rounded-lg shadow-xl p-6 border border-navy-500">
      <form onSubmit={handleSubmit} className="space-y-4">
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
              className="px-4 py-2 bg-navy-500 text-white rounded-lg hover:bg-navy-800 transition-colors flex items-center space-x-2"
            >
              <Image size={20} />
              <span>Add Media</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || (!newPost.trim() && selectedFiles.length === 0)}
            className="px-6 py-2 bg-navy-500 text-white rounded-lg hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}