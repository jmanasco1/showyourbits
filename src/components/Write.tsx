import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import DeleteModal from './modals/DeleteModal';
import BitEditor from './write/BitEditor';
import BitList from './write/BitList';
import { Bit } from '../types/bit';

export default function Write() {
  const { user } = useAuth();
  const [bits, setBits] = useState<Bit[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: '',
    title: ''
  });
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState({
    isOpen: false,
    bit: null as Bit | null
  });

  // Fetch user's bits from Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchBits = async () => {
      try {
        console.log('Fetching drafts for user:', user.uid);
        const q = query(
          collection(db, 'drafts'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        console.log('Fetched drafts:', snapshot.docs.length);
        const bitsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bit[];
        setBits(bitsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching bits:', err);
        setError('Failed to load your drafts. ' + (err instanceof Error ? err.message : String(err)));
        setLoading(false);
      }
    };

    fetchBits();
  }, [user]);

  // Speech recognition setup
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      
      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join(' ');
        
        if (editingId) {
          const bit = bits.find(b => b.id === editingId);
          if (bit) {
            handleUpdateBit(editingId, { content: bit.content + ' ' + transcript });
          }
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event);
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [editingId, bits]);

  const handleSaveBit = async (bit: Omit<Bit, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;

    try {
      const newBit = {
        ...bit,
        userId: user.uid,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'drafts'), newBit);
      
      setBits(prev => [{
        ...newBit,
        id: docRef.id
      }, ...prev]);
      
      setError(null);
    } catch (err) {
      console.error('Error saving bit:', err);
      setError('Failed to save draft');
    }
  };

  const handleUpdateBit = async (id: string, updates: Partial<Bit>) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'drafts', id), updates);
      setBits(prev => prev.map(bit => 
        bit.id === id ? { ...bit, ...updates } : bit
      ));
      setError(null);
    } catch (err) {
      console.error('Error updating bit:', err);
      setError('Failed to update draft');
    }
  };

  const handleDeleteBit = async (id: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'drafts', id));
      setBits(prev => prev.filter(bit => bit.id !== id));
      setDeleteModal({ isOpen: false, id: '', title: '' });
      setError(null);
    } catch (err) {
      console.error('Error deleting bit:', err);
      setError('Failed to delete draft');
    }
  };

  const handleShareClick = (bit: Bit) => {
    setShareModal({ isOpen: true, bit });
  };

  const handleShare = async () => {
    if (!user || !shareModal.bit) return;

    try {
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      const username = userData?.username || user.email?.split('@')[0] || 'Anonymous';

      // Create post from bit
      const postData = {
        content: `${shareModal.bit.title}\n\n${shareModal.bit.content}`,
        authorId: user.uid,
        authorName: username,
        authorPhoto: user.photoURL || '',
        mediaUrls: [],
        mediaTypes: [],
        likes: 0,
        comments: 0,
        shares: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
        tags: shareModal.bit.tags || []
      };

      await addDoc(collection(db, 'posts'), postData);
      console.log('Bit shared to feed successfully');
      setShareModal({ isOpen: false, bit: null });
    } catch (err) {
      console.error('Error sharing bit to feed:', err);
      setError('Failed to share to feed. ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const toggleSpeechRecognition = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
    setIsListening(!isListening);
  };

  const filteredBits = bits.filter(bit => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (bit.title || '').toLowerCase().includes(search) ||
      (bit.content || '').toLowerCase().includes(search) ||
      (bit.tags || []).some(tag => tag.toLowerCase().includes(search))
    );
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-center h-96">
          <p className="text-red-500">Please log in to access your drafts.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">Loading your drafts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search drafts..."
            className="w-full bg-gray-700 text-white px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}

      <BitEditor
        onSave={editingId ? 
          (updates) => {
            handleUpdateBit(editingId, updates);
            setEditingId(null);
          } : 
          handleSaveBit
        }
        isListening={isListening}
        onToggleSpeech={toggleSpeechRecognition}
        editingBit={editingId ? bits.find(b => b.id === editingId) : undefined}
        onCancelEdit={() => setEditingId(null)}
      />

      <BitList
        bits={filteredBits}
        onEdit={setEditingId}
        onDelete={(id, title) => setDeleteModal({ isOpen: true, id, title })}
        onShare={handleShareClick}
        sortBy={sortBy}
        onSort={setSortBy}
      />

      <DeleteModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        onConfirm={() => handleDeleteBit(deleteModal.id)}
        onClose={() => setDeleteModal({ isOpen: false, id: '', title: '' })}
      />

      {/* Share Modal */}
      {shareModal.isOpen && shareModal.bit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-navy-900 rounded-lg p-6 max-w-md w-full mx-4 border border-navy-700">
            <h2 className="text-xl font-bold text-white mb-4">Share to Feed</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to share "{shareModal.bit.title}" to your feed? This will be visible to all users.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShareModal({ isOpen: false, bit: null })}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}