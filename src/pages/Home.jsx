import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import TweetBox from '../components/post/TweetBox';
import PostCard from '../components/post/PostCard';
import { collection, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Home() {
  const { userData } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);

  const fetchPosts = async (isFirstLoad = false) => {
    try {
      if (isFirstLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const postsRef = collection(db, 'posts');
      let q;

      if (isFirstLoad || !lastDoc) {
        q = query(postsRef, orderBy('createdAt', 'desc'), limit(10));
      } else {
        q = query(postsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(10));
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        if (isFirstLoad) {
          setPosts([]);
        }
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(lastVisible);

      if (snapshot.docs.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (isFirstLoad) {
        setPosts(list);
      } else {
        setPosts((prev) => [...prev, ...list]);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      toast.error("Could not load posts.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(true);
  }, []);

  const handlePostSuccess = () => {
    setLastDoc(null);
    setHasMore(true);
    fetchPosts(true);
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  useEffect(() => {
    if (loading || !hasMore) return;

    const option = {
      root: null,
      rootMargin: '20px',
      threshold: 1.0
    };

    const handleObserver = (entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loadingMore) {
        fetchPosts(false);
      }
    };

    const observer = new IntersectionObserver(handleObserver, option);
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [loading, lastDoc, hasMore, loadingMore]);

  return (
    <Layout mobileTitle="Home">
      {userData && (
        <TweetBox onPostSuccess={handlePostSuccess} placeholder="What's happening?!" />
      )}

      <div className="divide-y divide-divider">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 rounded-full skeleton-shimmer animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse"></div>
                  <div className="h-3 w-full rounded bg-gray-200 dark:bg-zinc-800 animate-pulse"></div>
                  <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDeleteSuccess={handlePostDelete}
              />
            ))}

            {hasMore && (
              <div ref={observerRef} className="p-4 flex justify-center">
                {loadingMore && (
                  <div className="h-6 w-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center select-none text-brand-muted dark:text-brand-darkMuted">
            <h3 className="font-bold text-lg mb-1">Welcome to X Clone!</h3>
            <p className="text-sm">Be the first to share a post and start the conversation.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
