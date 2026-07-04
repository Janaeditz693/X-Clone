import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import PostCard from '../components/post/PostCard';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Bookmarks() {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchBookmarks = async () => {
      try {
        setLoading(true);
        const bookmarksRef = collection(db, 'bookmarks');
        const q = query(
          bookmarksRef,
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setPosts([]);
          setLoading(false);
          return;
        }

        const postPromises = snapshot.docs.map(async (bDoc) => {
          const bookmark = bDoc.data();
          const postRef = doc(db, 'posts', bookmark.postId);
          const postSnap = await getDoc(postRef);
          
          if (postSnap.exists()) {
            return { id: postSnap.id, ...postSnap.data() };
          }
          return null;
        });

        const postResults = await Promise.all(postPromises);
        setPosts(postResults.filter(p => p !== null));
      } catch (err) {
        console.error("Error fetching bookmarks:", err);
        toast.error(`Could not load bookmarks: ${err.code || err.message || err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [currentUser]);

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <Layout mobileTitle="Bookmarks">
      <div className="sticky top-0 bg-white/90 dark:bg-brand-darkBg/90 backdrop-blur-md px-4 py-3 select-none border-b border-divider z-10">
        <h2 className="font-extrabold text-brand-text dark:text-brand-darkText text-lg">Bookmarks</h2>
        <p className="text-xs text-brand-muted dark:text-brand-darkMuted">Saved posts</p>
      </div>

      <div className="divide-y divide-divider">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                  <div className="h-3 w-full bg-gray-200 dark:bg-zinc-800 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDeleteSuccess={handlePostDelete}
            />
          ))
        ) : (
          <div className="p-12 text-center select-none max-w-sm mx-auto mt-8">
            <h3 className="font-extrabold text-xl mb-1 text-brand-text dark:text-brand-darkText">Save posts for later</h3>
            <p className="text-sm text-brand-muted dark:text-brand-darkMuted">
              Don’t let the good ones fly away! Bookmark posts to easily find them again here.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
