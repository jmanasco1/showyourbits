import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, limit, startAfter, where } from 'firebase/firestore';
import { Search, Loader } from 'lucide-react';
import { db } from '../../lib/firebase';
import CreatePost from './CreatePost';
import PostItem from './PostItem';

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

  // Setup real-time listener for initial posts and updates
  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setLastPost(null);
    setHasMore(true);
    setPage(0);
    isInitialLoad.current = true;

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

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
    }, (error) => {
      console.error('Error loading posts:', error);
      setError('Failed to load posts. Please try again later.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [searchTerm]);

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

      <div className="space-y-6 min-h-[400px]">
        {posts.map((post, index) => (
          <div
            key={post.id}
            ref={index === posts.length - 1 ? lastPostElementRef : undefined}
            className={`transition-opacity duration-300 ${loading && index === posts.length - 1 ? 'opacity-50' : 'opacity-100'}`}
          >
            <PostItem
              post={post}
              onProfileClick={onProfileClick}
            />
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