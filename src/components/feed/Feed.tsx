import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, limit, startAfter, where, doc, getDoc } from 'firebase/firestore';
import { Search, Loader } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import CreatePost from './CreatePost';
import PostItem from './PostItem';
import { useSearchParams } from 'react-router-dom';

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

interface FeedProps {
  onProfileClick: (userId: string) => void;
}

export function Feed({ onProfileClick }: FeedProps) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPost, setLastPost] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const POSTS_PER_PAGE = 10;
  
  const observer = useRef<IntersectionObserver>();
  const isInitialLoad = useRef(true);
  const targetPostRef = useRef<HTMLDivElement>(null);

  // Setup real-time listener for initial posts and updates
  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('Please log in to view posts');
      return;
    }

    setLoading(true);
    setPosts([]);
    setLastPost(null);
    setHasMore(true);
    setPage(0);
    isInitialLoad.current = true;

    try {
      let q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(POSTS_PER_PAGE)
      );

      if (searchTerm) {
        q = query(
          collection(db, 'posts'),
          where('content', '>=', searchTerm),
          where('content', '<=', searchTerm + '\uf8ff'),
          orderBy('content'),
          orderBy('createdAt', 'desc'),
          limit(POSTS_PER_PAGE)
        );
      }

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const postData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              content: data.content || '',
              authorId: data.authorId || '',
              authorName: data.authorName || '',
              authorPhoto: data.authorPhoto || '',
              mediaUrls: data.mediaUrls || [],
              mediaTypes: data.mediaTypes || [],
              likes: data.likes || 0,
              comments: data.comments || 0,
              shares: data.shares || 0,
              likedBy: data.likedBy || [],
              createdAt: data.createdAt
            } as Post;
          });

          if (isInitialLoad.current) {
            setPosts(postData);
            isInitialLoad.current = false;
          } else {
            // Update existing posts while preserving pagination
            setPosts(prevPosts => {
              const firstPageIds = new Set(postData.map(post => post.id));
              const remainingPosts = prevPosts.filter(post => !firstPageIds.has(post.id));
              return [...postData, ...remainingPosts];
            });
          }

          setLastPost(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(postData.length === POSTS_PER_PAGE);
          setLoading(false);
          setError(null);
        }, 
        (error) => {
          console.error('Error loading posts:', error);
          setError('Error loading posts: ' + error.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up posts listener:', err);
      setError('Error setting up posts listener: ' + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  }, [user, searchTerm]);

  // Load more posts when scrolling
  const loadMorePosts = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const nextPage = page + 1;

      let q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastPost),
        limit(POSTS_PER_PAGE)
      );

      if (searchTerm) {
        q = query(
          collection(db, 'posts'),
          where('content', '>=', searchTerm),
          where('content', '<=', searchTerm + '\uf8ff'),
          orderBy('content'),
          orderBy('createdAt', 'desc'),
          startAfter(lastPost),
          limit(POSTS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setHasMore(false);
        return;
      }

      const postData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          content: data.content || '',
          authorId: data.authorId || '',
          authorName: data.authorName || '',
          authorPhoto: data.authorPhoto || '',
          mediaUrls: data.mediaUrls || [],
          mediaTypes: data.mediaTypes || [],
          likes: data.likes || 0,
          comments: data.comments || 0,
          shares: data.shares || 0,
          likedBy: data.likedBy || [],
          createdAt: data.createdAt
        } as Post;
      });

      setPosts(prev => [...prev, ...postData]);
      setLastPost(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(postData.length === POSTS_PER_PAGE);
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading more posts:', error);
      setError('Failed to load more posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, lastPost, searchTerm, page]);

  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    }, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMorePosts]);

  // Handle scrolling to specific post
  useEffect(() => {
    const postId = searchParams.get('postId');
    if (!postId || !posts.length) return;

    const postElement = document.getElementById(`post-${postId}`);
    if (postElement) {
      postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      postElement.classList.add('bg-navy-800/50');
      setTimeout(() => {
        postElement.classList.remove('bg-navy-800/50');
      }, 2000);
    } else {
      // If post not found in current set, fetch it specifically
      const fetchPost = async () => {
        try {
          const postDoc = await getDoc(doc(db, 'posts', postId));
          if (postDoc.exists()) {
            const postData = { id: postDoc.id, ...postDoc.data() } as Post;
            setPosts(prev => {
              if (prev.some(p => p.id === postId)) return prev;
              return [postData, ...prev];
            });
          }
        } catch (err) {
          console.error('Error fetching specific post:', err);
        }
      };
      fetchPost();
    }
  }, [searchParams, posts]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <CreatePost onPostCreated={() => {
          // No need to reset posts here since onSnapshot will handle it
        }} />
      </div>

      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-navy-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </div>

      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-4">
        {posts.map((post) => (
          <div key={post.id} id={`post-${post.id}`} className="transition-colors duration-500">
            <PostItem post={post} onProfileClick={onProfileClick} />
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-4">
          <Loader className="animate-spin text-blue-500" size={24} />
        </div>
      )}

      {!loading && !hasMore && posts.length > 0 && (
        <div className="text-center text-gray-400 mt-8 py-4 bg-navy-800/50 rounded-lg">
          You've reached the end!
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center text-gray-400 mt-8 py-8 bg-navy-800/50 rounded-lg">
          {searchTerm ? 'No posts found matching your search.' : 'No posts yet. Be the first to post!'}
        </div>
      )}
    </div>
  );
}