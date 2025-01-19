import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
}

export default function MessageModal({ isOpen, onClose, recipientId, recipientName }: MessageModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const senderDoc = await getDoc(doc(db, 'users', user.uid));
      const senderData = senderDoc.exists() ? senderDoc.data() : null;
      const senderName = senderData?.username || user.email?.split('@')[0] || 'Anonymous';

      await addDoc(collection(db, 'messages'), {
        content: message.trim(),
        senderId: user.uid,
        senderName,
        recipientId,
        recipientName,
        createdAt: serverTimestamp(),
        read: false
      });

      setMessage('');
      onClose();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-navy-400 rounded-lg p-6 max-w-lg w-full mx-4 border border-navy-500">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Message {recipientName}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500 rounded-lg p-3 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message..."
            className="w-full bg-navy-500 border border-navy-500 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            rows={4}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="px-4 py-2 bg-navy-500 text-white rounded-lg hover:bg-navy-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
              <span>{loading ? 'Sending...' : 'Send Message'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}