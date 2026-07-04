import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  increment,
  serverTimestamp, 
  addDoc 
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { RiSearchLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { userData, currentUser } = useAuth();
  const [followingIds, setFollowingIds] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchFollowing = async () => {
      try {
        const followingRef = collection(db, 'following');
        const q = query(followingRef, where('followerId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        setFollowingIds(snapshot.docs.map(doc => doc.data().followingId));
      } catch (err) {
        console.error(err);
      }
    };
    fetchFollowing();
  }, [currentUser]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (!searchTerm.trim()) {
        setResults([]);
        return;
      }
      
      const searchUsers = async () => {
        try {
          setLoading(true);
          const val = searchTerm.trim().toLowerCase();
          const rawVal = searchTerm.trim();
          const usersRef = collection(db, 'users');
          
          const qUsername = query(
            usersRef,
            where('username', '>=', val),
            where('username', '<=', val + '\uf8ff'),
            limit(15)
          );

          const qDisplay = query(
            usersRef,
            where('displayName', '>=', rawVal),
            where('displayName', '<=', rawVal + '\uf8ff'),
            limit(15)
          );
          
          const [snapUsername, snapDisplay] = await Promise.all([
            getDocs(qUsername),
            getDocs(qDisplay)
          ]);

          const mergedUsers = new Map();
          
          snapUsername.forEach((doc) => {
            const user = { uid: doc.id, ...doc.data() };
            if (user.uid !== currentUser?.uid && user.status !== 'banned') {
              mergedUsers.set(user.uid, user);
            }
          });

          snapDisplay.forEach((doc) => {
            const user = { uid: doc.id, ...doc.data() };
            if (user.uid !== currentUser?.uid && user.status !== 'banned') {
              mergedUsers.set(user.uid, user);
            }
          });
          
          setResults(Array.from(mergedUsers.values()).slice(0, 15));
        } catch (err) {
          console.error("Search error:", err);
        } finally {
          setLoading(false);
        }
      };

      searchUsers();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, currentUser]);

  const handleFollowToggle = async (targetUser) => {
    if (!currentUser) return toast.error("Please login to follow users");
    const isFollowing = followingIds.includes(targetUser.uid);
    const followId = `${currentUser.uid}_${targetUser.uid}`;
    
    try {
      const targetUserRef = doc(db, 'users', targetUser.uid);
      const currentUserRef = doc(db, 'users', currentUser.uid);

      if (isFollowing) {
        await deleteDoc(doc(db, 'following', followId));
        await deleteDoc(doc(db, 'followers', followId));

        // Atomically decrement counts in Firestore
        await updateDoc(targetUserRef, {
          followersCount: increment(-1)
        });
        await updateDoc(currentUserRef, {
          followingCount: increment(-1)
        });

        setFollowingIds(prev => prev.filter(id => id !== targetUser.uid));
        toast.success(`Unfollowed @${targetUser.username}`);
      } else {
        await setDoc(doc(db, 'following', followId), {
          followerId: currentUser.uid,
          followingId: targetUser.uid,
          createdAt: serverTimestamp()
        });
        await setDoc(doc(db, 'followers', followId), {
          followerId: currentUser.uid,
          followingId: targetUser.uid,
          createdAt: serverTimestamp()
        });

        // Atomically increment counts in Firestore
        await updateDoc(targetUserRef, {
          followersCount: increment(1)
        });
        await updateDoc(currentUserRef, {
          followingCount: increment(1)
        });

        await addDoc(collection(db, 'notifications'), {
          senderId: currentUser.uid,
          receiverId: targetUser.uid,
          type: 'follow',
          senderName: userData.displayName || userData.email.split('@')[0],
          senderUsername: userData.username || '',
          senderPhoto: userData.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.uid}`,
          read: false,
          createdAt: serverTimestamp()
        });

        setFollowingIds(prev => [...prev, targetUser.uid]);
        toast.success(`Followed @${targetUser.username}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    }
  };

  return (
    <Layout mobileTitle="Search">
      <div className="sticky top-0 bg-white/95 dark:bg-brand-darkBg/95 backdrop-blur-md px-4 py-3 border-b border-divider z-10 select-none">
        <div className="relative">
          <RiSearchLine className="absolute left-4 top-3 text-brand-muted dark:text-brand-darkMuted text-xl" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by username..."
            className="w-full pl-12 pr-4 py-2.5 bg-gray-100 dark:bg-zinc-900 border border-transparent rounded-full focus:bg-transparent focus:border-brand-blue focus:outline-none text-sm text-brand-text dark:text-brand-darkText transition"
            autoFocus={!queryParam}
          />
        </div>
      </div>

      <div className="divide-y divide-divider">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 items-center animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                  <div className="h-3 w-40 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          results.map((user) => {
            const following = followingIds.includes(user.uid);
            return (
              <div key={user.uid} className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-zinc-950/10 transition">
                <Link to={`/profile/${user.username}`} className="flex items-center gap-3 overflow-hidden flex-1">
                  <img
                    src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover bg-gray-150 dark:bg-zinc-850"
                  />
                  <div className="flex flex-col text-left leading-tight text-xs overflow-hidden">
                    <span className="font-bold text-brand-text dark:text-brand-darkText hover:underline text-sm truncate">
                      {user.displayName}
                    </span>
                    <span className="text-brand-muted dark:text-brand-darkMuted truncate mb-1">
                      @{user.username}
                    </span>
                    {user.bio && (
                      <span className="text-brand-text dark:text-brand-darkText truncate max-w-xs">{user.bio}</span>
                    )}
                  </div>
                </Link>

                <button
                  onClick={() => handleFollowToggle(user)}
                  className={`py-1.5 px-4 font-bold text-xs rounded-full transition select-none ${
                    following
                      ? 'bg-transparent border border-divider hover:border-red-500 hover:text-red-500 text-brand-text dark:text-brand-darkText'
                      : 'bg-brand-text dark:bg-brand-darkText text-brand-bg dark:text-brand-darkBg hover:opacity-90'
                  }`}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })
        ) : searchTerm.trim() ? (
          <div className="p-12 text-center select-none text-brand-muted dark:text-brand-darkMuted">
            <h3 className="font-extrabold text-xl mb-1">No results for "{searchTerm}"</h3>
            <p className="text-sm">Try searching for other keywords or usernames.</p>
          </div>
        ) : (
          <div className="p-12 text-center select-none text-brand-muted dark:text-brand-darkMuted max-w-xs mx-auto mt-6">
            <h3 className="font-extrabold text-xl mb-1">Search for users</h3>
            <p className="text-sm">Find friends, explore other accounts and connect on X Clone.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
