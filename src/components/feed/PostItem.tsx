import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Edit2, Trash2, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  increment, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  getDocs,
  getDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import ReactPlayer from 'react-player';
import CommentModal from '../modals/CommentModal';
import DeleteModal from '../modals/DeleteModal';
import { format, formatDistanceToNow } from 'date-fns';

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
      try {
        console.log('Fetching comments for post:', post.id);
        const commentsRef = collection(db, `posts/${post.id}/comments`);
        const snapshot = await getDocs(commentsRef);
        console.log('Comments snapshot size:', snapshot.size);
        
        if (post.comments !== snapshot.size) {
          console.log('Updating comment count from', post.comments, 'to', snapshot.size);
          const postRef = doc(db, 'posts', post.id);
          await updateDoc(postRef, {
            comments: snapshot.size
          });
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    };
    getCommentCount();
  }, [post.id, post.comments]);

  const handleLike = async () => {
    if (!user) return;

    try {
      console.log('Handling like...', { currentUser: user.uid, postAuthor: post.authorId });
      const postRef = doc(db, 'posts', post.id);
      const isLiked = post.likedBy?.includes(user.uid);

      if (isLiked) {
        console.log('Removing like...');
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: arrayRemove(user.uid)
        });
      } else {
        console.log('Adding like...');
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: arrayUnion(user.uid)
        });

        // Only create notification if the post is not by the current user
        if (user.uid !== post.authorId) {
          console.log('Creating like notification...');
          // Get user data for the notification
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.exists() ? userDoc.data() : null;
          const username = userData?.username || user.email?.split('@')[0] || 'Anonymous';

          const notificationData = {
            type: 'like',
            postId: post.id,
            fromUserId: user.uid,
            fromUserName: username,
            toUserId: post.authorId,
            read: false,
            createdAt: serverTimestamp()
          };

          console.log('Notification data:', notificationData);
          const notificationRef = await addDoc(collection(db, 'notifications'), notificationData);
          console.log('Notification created with ID:', notificationRef.id);
        } else {
          console.log('No notification created - user liked their own post');
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInYears > 0) return `${diffInYears}y ago`;
    if (diffInMonths > 0) return `${diffInMonths}m ago`;
    if (diffInWeeks > 0) return `${diffInWeeks}w ago`;
    if (diffInDays > 0) return `${diffInDays}d ago`;
    if (diffInHours > 0) return `${diffInHours}h ago`;
    if (diffInMinutes > 0) return `${diffInMinutes}m ago`;
    return 'just now';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center mb-4">
        <img
          src={post.authorPhoto || '/default-avatar.png'}
          alt={`${post.authorName}'s avatar`}
          className="w-10 h-10 rounded-full object-cover mr-3 cursor-pointer"
          onClick={() => onProfileClick(post.authorId)}
        />
        <div className="flex-1">
          <h3 
            className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:underline"
            onClick={() => onProfileClick(post.authorId)}
          >
            {post.authorName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {post.createdAt?.toDate() && (
              <>
                {format(post.createdAt.toDate(), 'MMM d, yyyy')} · {formatTimeAgo(post.createdAt.toDate())}
              </>
            )}
          </p>
        </div>
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
            className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            rows={4}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(post.content);
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <X size={20} />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleUpdatePost}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <Save size={20} />
              <span>Save</span>
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap mb-4">{post.content}</p>
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

      <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
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