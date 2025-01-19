import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Edit2, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc, deleteDoc, increment, arrayUnion, arrayRemove, collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import ReactPlayer from 'react-player';
import CommentModal from '../modals/CommentModal';
import DeleteModal from '../modals/DeleteModal';

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
  likedBy: string[];
  createdAt: any;
}

interface PostItemProps {
  post: Post;
  onProfileClick: (userId: string) => void;
}

export default function PostItem({ post, onProfileClick }: PostItemProps) {
  const { user } = useAuth();
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  useEffect(() => {
    // Get initial comment count
    const getCommentCount = async () => {
      const commentsRef = collection(db, `posts/${post.id}/comments`);
      const snapshot = await getDocs(commentsRef);
      if (post.comments !== snapshot.size) {
        const postRef = doc(db, 'posts', post.id);
        await updateDoc(postRef, {
          comments: snapshot.size
        });
      }
    };
    getCommentCount();
  }, [post.id]);

  const handleLike = async () => {
    if (!user) return;

    try {
      const postRef = doc(db, 'posts', post.id);
      const isLiked = post.likedBy?.includes(user.uid);

      if (isLiked) {
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: arrayUnion(user.uid)
        });

        // Only create notification if the post is not by the current user
        if (user.uid !== post.authorId) {
          const notificationData = {
            type: 'like',
            postId: post.id,
            fromUserId: user.uid,
            fromUserName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
            toUserId: post.authorId,
            read: false,
            createdAt: serverTimestamp()
          };

          await addDoc(collection(db, 'notifications'), notificationData);
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleUpdatePost = async () => {
    if (!user || !editContent.trim()) return;

    try {
      await updateDoc(doc(db, 'posts', post.id), {
        content: editContent.trim()
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating post:', err);
    }
  };

  const handleDeletePost = async () => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'posts', post.id));
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  return (
    <div className="bg-navy-400 rounded-lg shadow-lg p-6 border border-navy-500">
      <div className="flex justify-between items-start mb-4">
        <button
          onClick={() => onProfileClick(post.authorId)}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity text-left"
        >
          {post.authorPhoto ? (
            <img
              src={post.authorPhoto}
              alt={post.authorName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-navy-500 flex items-center justify-center text-orange-500 font-semibold">
              {post.authorName[0].toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-white">{post.authorName}</h3>
            <p className="text-sm text-gray-400">
              {post.createdAt?.toDate().toLocaleDateString()}
            </p>
          </div>
        </button>

        {user?.uid === post.authorId && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Edit2 size={20} />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-navy-500 border border-navy-500 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            rows={4}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
              }}
              className="px-4 py-2 bg-navy-500 text-gray-300 rounded-lg hover:bg-navy-600 transition-colors flex items-center space-x-2"
            >
              <X size={20} />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleUpdatePost}
              className="px-4 py-2 bg-navy-500 text-white rounded-lg hover:bg-navy-600 transition-colors flex items-center space-x-2"
            >
              <Save size={20} />
              <span>Save</span>
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-100 whitespace-pre-wrap mb-4">{post.content}</p>
      )}

      {post.mediaUrls?.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {post.mediaUrls.map((url, index) => (
            <div key={index} className="relative aspect-square">
              {post.mediaTypes[index] === 'image' ? (
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <ReactPlayer
                  url={url}
                  width="100%"
                  height="100%"
                  controls
                  className="rounded-lg overflow-hidden"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 border-t border-navy-500">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 ${
              user && post.likedBy?.includes(user.uid)
                ? 'text-red-500'
                : 'text-gray-400 hover:text-red-500'
            } transition-colors`}
          >
            <Heart size={20} />
            <span>{post.likes || 0}</span>
          </button>
          <button
            onClick={() => setShowCommentModal(true)}
            className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
          >
            <MessageCircle size={20} />
            <span>{Math.max(post.comments || 0, 0)}</span>
          </button>
        </div>
      </div>

      {showCommentModal && (
        <CommentModal
          isOpen={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          post={post}
        />
      )}

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeletePost}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
      />
    </div>
  );
}