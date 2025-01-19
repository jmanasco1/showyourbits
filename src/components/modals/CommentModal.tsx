import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  where
} from 'firebase/firestore';
import { MessageCircle, X, CornerDownRight, Edit2, Trash2, Heart } from 'lucide-react';
import DeleteModal from './DeleteModal';

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  createdAt: any;
  parentId: string | null;
  replyToName: string | null;
  likes: number;
  likedBy: string[];
}

interface Post {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  mediaUrls: string[];
  mediaTypes: string[];
  likes: number;
  comments: number;
  shares: number;
  createdAt: any;
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

export default function CommentModal({ isOpen, onClose, post }: CommentModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean; comment: Comment | null}>({
    isOpen: false,
    comment: null
  });

  useEffect(() => {
    if (!isOpen) return;

    const q = query(
      collection(db, `posts/${post.id}/comments`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const commentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentData);

      // Update post's comment count to match reality
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        comments: snapshot.size
      });
    });

    return () => unsubscribe();
  }, [isOpen, post.id]);

  const handleLikeComment = async (comment: Comment) => {
    if (!user) return;

    try {
      const commentRef = doc(db, `posts/${post.id}/comments`, comment.id);
      const isLiked = comment.likedBy?.includes(user.uid);

      await updateDoc(commentRef, {
        likes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || loading) return;

    setLoading(true);
    const commentContent = newComment.trim();
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;
      const username = userData?.username || user.email?.split('@')[0] || 'Anonymous';

      const commentData = {
        content: commentContent,
        authorId: user.uid,
        authorName: username,
        authorPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
        parentId: replyTo?.id || null,
        replyToName: replyTo?.authorName || null,
        likes: 0,
        likedBy: []
      };

      await addDoc(collection(db, `posts/${post.id}/comments`), commentData);
      
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        comments: increment(1)
      });

      setNewComment('');
      setReplyTo(null);
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComment = async (comment: Comment) => {
    if (!user || !editContent.trim() || loading) return;

    setLoading(true);

    try {
      await updateDoc(doc(db, `posts/${post.id}/comments`, comment.id), {
        content: editContent.trim()
      });

      setEditingComment(null);
      setEditContent('');
    } catch (err) {
      console.error('Error updating comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, `posts/${post.id}/comments`, comment.id));
      
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        comments: increment(-1)
      });

      setDeleteModal({ isOpen: false, comment: null });
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-navy-900 rounded-lg p-6 max-w-2xl w-full mx-4 border border-navy-700 max-h-[80vh] flex flex-col relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Comments</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors rounded-lg p-1 hover:bg-navy-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {comments.map(comment => {
            const isReply = comment.parentId !== null;
            const isLiked = comment.likedBy?.includes(user?.uid || '');
            
            return (
              <div 
                key={comment.id} 
                className={`relative ${isReply ? 'ml-8 before:content-[""] before:absolute before:left-[-16px] before:top-[20px] before:h-[calc(100%-20px)] before:w-[2px] before:bg-navy-700' : ''}`}
              >
                <div className={`bg-navy-800/50 rounded-lg p-4 ${isReply ? 'border-l-2 border-l-navy-700' : ''}`}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3 flex-1 min-w-0">
                      {comment.authorPhoto ? (
                        <img
                          src={comment.authorPhoto}
                          alt={comment.authorName}
                          className={`${isReply ? 'h-6 w-6' : 'h-8 w-8'} rounded-full object-cover flex-shrink-0`}
                        />
                      ) : (
                        <div className={`${isReply ? 'h-6 w-6 text-sm' : 'h-8 w-8 text-base'} rounded-full bg-navy-600 flex items-center justify-center text-orange-500 font-semibold flex-shrink-0`}>
                          {comment.authorName[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-white">{comment.authorName}</h4>
                          {comment.replyToName && (
                            <span className="text-sm text-gray-400 flex items-center gap-1">
                              <CornerDownRight size={14} />
                              <span>@{comment.replyToName}</span>
                            </span>
                          )}
                        </div>
                        
                        {editingComment?.id === comment.id ? (
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdateComment(comment);
                          }}>
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full mt-2 px-3 py-2 bg-navy-900 border border-navy-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              rows={2}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingComment(null);
                                  setEditContent('');
                                }}
                                className="px-3 py-1 text-sm text-gray-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={!editContent.trim() || loading}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                Save
                              </button>
                            </div>
                          </form>
                        ) : (
                          <p className="text-gray-200 mt-1 break-words">{comment.content}</p>
                        )}
                        
                        {!editingComment && (
                          <div className="flex items-center gap-4 mt-2">
                            <button
                              onClick={() => handleLikeComment(comment)}
                              className={`text-sm flex items-center gap-1 transition-colors ${
                                isLiked 
                                  ? 'text-red-500 hover:text-red-600' 
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                            >
                              <Heart 
                                size={14} 
                                className={isLiked ? 'fill-current' : ''} 
                              />
                              <span>{comment.likes || 0}</span>
                            </button>
                            <button
                              onClick={() => setReplyTo(comment)}
                              className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                            >
                              <MessageCircle size={14} />
                              <span>Reply</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {user?.uid === comment.authorId && !editingComment && (
                      <div className="relative group">
                        <button
                          onClick={() => setEditingComment(comment)}
                          className="p-1 text-gray-400 hover:text-white rounded hover:bg-navy-700"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, comment })}
                          className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-navy-700 ml-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="relative mt-auto">
          {replyTo && (
            <div className="absolute -top-8 left-0 right-0 flex items-center justify-between bg-navy-800/50 px-4 py-2 rounded-t-lg border-t border-x border-navy-700">
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <CornerDownRight size={14} />
                Replying to @{replyTo.authorName}
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          <div className={`flex gap-4 ${replyTo ? 'bg-navy-800/50 px-4 py-3 rounded-b-lg border-b border-x border-navy-700' : ''}`}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.email || 'User'}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-navy-600 flex items-center justify-center text-orange-500 font-semibold">
                {user?.email?.[0].toUpperCase() || 'A'}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-4 py-2 bg-navy-800 border border-navy-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || loading}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                !newComment.trim() || loading
                  ? 'bg-navy-800 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <MessageCircle size={20} />
              <span>Send</span>
            </button>
          </div>
        </form>

        <DeleteModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, comment: null })}
          onConfirm={() => deleteModal.comment && handleDeleteComment(deleteModal.comment)}
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This action cannot be undone."
        />
      </div>
    </div>
  );
}