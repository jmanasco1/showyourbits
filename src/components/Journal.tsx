import React, { useState, useEffect } from 'react';
import { Book, Plus, Trash2, Edit2, Save, X, Calendar } from 'lucide-react';
import { collection, addDoc, query, where, orderBy, deleteDoc, doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface JournalEntry {
  id: string;
  content: string;
  createdAt: any;
  updatedAt: any;
  userId: string;
}

export default function Journal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'journal_entries'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const journalData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as JournalEntry));
        setEntries(journalData);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading journal entries:', err);
        setError('Failed to load journal entries');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !newEntry.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const entryData = {
        content: newEntry.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: user.uid
      };

      await addDoc(collection(db, 'journal_entries'), entryData);
      setNewEntry('');
    } catch (err) {
      console.error('Error adding entry:', err);
      setError('Failed to add entry');
    }

    setSubmitting(false);
  };

  const handleUpdateEntry = async (id: string) => {
    if (!editContent.trim()) return;

    try {
      setError(null);
      await updateDoc(doc(db, 'journal_entries', id), {
        content: editContent.trim(),
        updatedAt: serverTimestamp()
      });
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      console.error('Error updating entry:', err);
      setError('Failed to update entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      setError(null);
      await deleteDoc(doc(db, 'journal_entries', id));
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError('Failed to delete entry');
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-4 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Comedy Journal</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Keep track of your comedy journey. Write about your performances, ideas, and lessons learned.
        </p>
      </div>

      {error && (
        <div className="bg-red-400/10 border border-red-400 text-red-400 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
        <form onSubmit={handleAddEntry} className="space-y-4">
          <textarea
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="Write about your day, performance, or thoughts..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
          />
          <button
            type="submit"
            disabled={!newEntry.trim() || submitting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            <span>{submitting ? 'Adding...' : 'Add Entry'}</span>
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {entries.map(entry => (
          <div key={entry.id} className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            {editingId === entry.id ? (
              <div className="space-y-4">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleUpdateEntry(entry.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Save size={20} />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditContent('');
                    }}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                  >
                    <X size={20} />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Calendar size={16} />
                    <span className="text-sm">
                      {entry.createdAt?.seconds ? 
                        formatDistanceToNow(new Date(entry.createdAt.seconds * 1000), { addSuffix: true }) :
                        'Just now'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingId(entry.id);
                        setEditContent(entry.content);
                      }}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-100 whitespace-pre-wrap">{entry.content}</p>
                {entry.updatedAt?.seconds !== entry.createdAt?.seconds && (
                  <p className="mt-2 text-sm text-gray-400">
                    (edited {formatDistanceToNow(new Date(entry.updatedAt.seconds * 1000), { addSuffix: true })})
                  </p>
                )}
              </>
            )}
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No journal entries yet. Start writing about your comedy journey!
          </div>
        )}
      </div>
    </div>
  );
}