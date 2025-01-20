import React, { useState, useEffect } from 'react';
import { Lightbulb, Plus, Trash2, Edit2, Save, X, Tag, Mic, MicOff } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Idea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  userId: string;
}

export default function IdeaBank() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    tags: [] as string[],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    ideaId: string | null;
    ideaTitle: string;
  }>({
    isOpen: false,
    ideaId: null,
    ideaTitle: ''
  });

  // Fetch user's ideas from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchIdeas = async () => {
      try {
        const q = query(
          collection(db, 'ideas'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const ideasData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Idea[];
        setIdeas(ideasData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching ideas:', err);
        setError('Failed to load your ideas');
        setLoading(false);
      }
    };

    fetchIdeas();
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
        
        setNewIdea(prev => ({
          ...prev,
          description: prev.description + ' ' + transcript
        }));
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const handleSaveIdea = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!user || !newIdea.title.trim()) {
      console.log('Cannot save: no user or empty title');
      return;
    }

    try {
      console.log('Attempting to save idea:', { ...newIdea, userId: user.uid });
      
      // Create the idea document
      const ideaData = {
        title: newIdea.title.trim(),
        description: newIdea.description.trim(),
        tags: newIdea.tags,
        userId: user.uid,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'ideas'), ideaData);
      console.log('Idea saved successfully with ID:', docRef.id);

      // Add to local state with client timestamp for immediate display
      const newIdeaWithId = {
        id: docRef.id,
        ...ideaData,
        createdAt: new Date().toISOString() // Use local timestamp for UI
      };

      setIdeas(prev => [newIdeaWithId, ...prev]);

      // Clear the form
      setNewIdea({
        title: '',
        description: '',
        tags: []
      });
      setNewTag('');
      
      // Clear any previous errors
      setError(null);
    } catch (err) {
      console.error('Error saving idea:', err);
      setError(err instanceof Error ? err.message : 'Failed to save your idea');
    }
  };

  const handleUpdateIdea = async (id: string, updates: Partial<Idea>) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'ideas', id), updates);
      setIdeas(prev => prev.map(idea => 
        idea.id === id ? { ...idea, ...updates } : idea
      ));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating idea:', err);
      setError('Failed to update idea');
    }
  };

  const handleDeleteClick = (idea: Idea) => {
    setDeleteModal({
      isOpen: true,
      ideaId: idea.id,
      ideaTitle: idea.title
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.ideaId) return;

    try {
      await deleteDoc(doc(db, 'ideas', deleteModal.ideaId));
      setIdeas(prev => prev.filter(idea => idea.id !== deleteModal.ideaId));
      setDeleteModal({ isOpen: false, ideaId: null, ideaTitle: '' });
    } catch (err) {
      console.error('Error deleting idea:', err);
      setError('Failed to delete idea');
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Please log in to access your ideas.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">Loading your ideas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Idea Bank</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Store your comedy ideas, premises, and potential bits. Keep track of your creative sparks
          and develop them into full routines.
        </p>
      </div>

      <div className="bg-navy-800 rounded-lg shadow-xl p-6 border border-navy-700">
        <form onSubmit={handleSaveIdea} className="space-y-4">
          <div>
            <input
              type="text"
              value={newIdea.title}
              onChange={(e) => setNewIdea(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Idea title"
              className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <div className="relative">
            <textarea
              value={newIdea.description}
              onChange={(e) => setNewIdea(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your idea..."
              rows={4}
              className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none pr-12"
            />
            {recognition && (
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`absolute right-2 top-2 p-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-navy-600 hover:bg-navy-500 text-white'
                }`}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {newIdea.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-navy-700 text-gray-300"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setNewIdea(prev => ({
                    ...prev,
                    tags: prev.tags.filter(t => t !== tag)
                  }))}
                  className="ml-1 text-gray-400 hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newTag.trim() && !newIdea.tags.includes(newTag.trim())) {
                    setNewIdea(prev => ({
                      ...prev,
                      tags: [...prev.tags, newTag.trim()]
                    }));
                    setNewTag('');
                  }
                }
              }}
              placeholder="Add tags..."
              className="flex-1 bg-navy-700 border border-navy-600 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => {
                if (newTag.trim() && !newIdea.tags.includes(newTag.trim())) {
                  setNewIdea(prev => ({
                    ...prev,
                    tags: [...prev.tags, newTag.trim()]
                  }));
                  setNewTag('');
                }
              }}
              className="px-4 py-2 bg-navy-700 text-gray-300 rounded-lg hover:bg-navy-600 transition-colors"
            >
              Add Tag
            </button>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={() => {
                setNewIdea({ title: '', description: '', tags: [] });
                setNewTag('');
              }}
              className="px-4 py-2 bg-navy-700 text-gray-300 rounded-lg hover:bg-navy-600 transition-colors flex items-center space-x-2"
            >
              <X size={20} />
              <span>Clear</span>
            </button>
            <button
              type="submit"
              disabled={!newIdea.title.trim()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              <span>Save Idea</span>
            </button>
          </div>
          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}
        </form>
      </div>

      <div className="space-y-4">
        {ideas.map(idea => (
          <div key={idea.id} className="bg-navy-800 rounded-lg shadow-lg p-6 border border-navy-700">
            {editingId === idea.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateIdea(idea.id, {
                    title: (e.currentTarget.elements.namedItem('title') as HTMLInputElement).value,
                    description: (e.currentTarget.elements.namedItem('description') as HTMLTextAreaElement).value,
                  });
                }}
                className="space-y-4"
              >
                <input
                  name="title"
                  defaultValue={idea.title}
                  className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <textarea
                  name="description"
                  defaultValue={idea.description}
                  rows={4}
                  className="w-full bg-navy-700 border border-navy-600 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 bg-navy-700 text-gray-300 rounded-lg hover:bg-navy-600 transition-colors flex items-center space-x-2"
                  >
                    <X size={20} />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-navy-700 text-white rounded-lg hover:bg-navy-600 transition-colors flex items-center space-x-2"
                  >
                    <Save size={20} />
                    <span>Save</span>
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">{idea.title}</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingId(idea.id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(idea)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-300 whitespace-pre-wrap mb-4">{idea.description}</p>
                {idea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {idea.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-navy-700 text-gray-300"
                      >
                        <Tag size={12} className="mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 text-sm text-gray-400">
                  Created: {new Date(idea.createdAt).toLocaleDateString()}
                </div>
              </>
            )}
          </div>
        ))}
        {ideas.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No ideas yet. Start capturing your comedy inspirations!
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-navy-900 rounded-lg p-6 max-w-md w-full mx-4 border border-navy-700">
            <h2 className="text-xl font-bold text-white mb-4">Delete Idea</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "{deleteModal.ideaTitle}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, ideaId: null, ideaTitle: '' })}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}