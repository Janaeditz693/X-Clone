import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  limit, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc,
  increment,
  serverTimestamp, 
  addDoc 
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { RiSearchLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function RightSidebar() {
  const { userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) return;
    
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(10));
        const querySnapshot = await getDocs(q);
        const list = [];
        
        const followingRef = collection(db, 'following');
        const followingQuery = query(followingRef, where('followerId', '==', userData.uid));
        const followingSnapshot = await getDocs(followingQuery);
        const followingIds = followingSnapshot.docs.map(doc => doc.data().followingId);
        
        querySnapshot.forEach((doc) => {
          const user = doc.data();
          if (user.uid !== userData.uid && !followingIds.includes(user.uid) && user.status !== 'banned') {
            list.push(user);
          }
        });
        
        setSuggestedUsers(list.slice(0, 3));
      } catch (err) {
        console.error("Error loading suggestions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [userData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleFollow = async (targetUser) => {
    if (!userData) return;
    try {
      const followId = `${userData.uid}_${targetUser.uid}`;
      
      const targetUserRef = doc(db, 'users', targetUser.uid);
      const currentUserRef = doc(db, 'users', userData.uid);

      await setDoc(doc(db, 'following', followId), {
        followerId: userData.uid,
        followingId: targetUser.uid,
        createdAt: serverTimestamp()
      });
      
      await setDoc(doc(db, 'followers', followId), {
        followerId: userData.uid,
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

      // Add follow notification
      await addDoc(collection(db, 'notifications'), {
        senderId: userData.uid,
        receiverId: targetUser.uid,
        type: 'follow',
        senderName: userData.displayName || userData.email.split('@')[0],
        senderUsername: userData.username || '',
        senderPhoto: userData.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userData.uid}`,
        read: false,
        createdAt: serverTimestamp()
      });

      setSuggestedUsers(prev => prev.filter(u => u.uid !== targetUser.uid));
      toast.success(`Followed @${targetUser.username}`);
    } catch (err) {
      console.error(err);
      toast.error("Could not follow user");
    }
  };

  return (
    <div className="hidden lg:flex flex-col w-80 h-screen sticky top-0 py-4 px-4 gap-4 overflow-y-auto border-l border-gray-150 dark:border-zinc-800 select-none">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <RiSearchLine className="absolute left-4 top-3 text-brand-muted dark:text-brand-darkMuted text-xl" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search user..."
          className="w-full pl-12 pr-4 py-2.5 bg-gray-100 dark:bg-zinc-900 border border-transparent rounded-full focus:bg-transparent focus:border-brand-blue focus:outline-none text-sm text-brand-text dark:text-brand-darkText transition"
        />
      </form>

      {/* Suggested Users List */}
      {userData && (
        <div className="bg-gray-50 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-900 rounded-2xl p-4">
          <h3 className="font-extrabold text-brand-text dark:text-brand-darkText text-base mb-3">
            Who to follow
          </h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full skeleton-shimmer"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-20 rounded-md skeleton-shimmer"></div>
                    <div className="h-2 w-12 rounded-md skeleton-shimmer"></div>
                  </div>
                  <div className="h-7 w-16 rounded-full skeleton-shimmer"></div>
                </div>
              ))}
            </div>
          ) : suggestedUsers.length > 0 ? (
            <div className="space-y-4">
              {suggestedUsers.map((user) => (
                <div key={user.uid} className="flex items-center justify-between gap-2">
                  <Link to={`/profile/${user.username}`} className="flex items-center gap-2 overflow-hidden flex-1">
                    <img
                      src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-zinc-800"
                    />
                    <div className="flex flex-col text-left leading-tight text-xs overflow-hidden">
                      <span className="font-bold text-brand-text dark:text-brand-darkText hover:underline truncate">
                        {user.displayName}
                      </span>
                      <span className="text-brand-muted dark:text-brand-darkMuted truncate">
                        @{user.username}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleFollow(user)}
                    className="py-1.5 px-4 bg-brand-text dark:bg-brand-darkText hover:opacity-90 text-brand-bg dark:text-brand-darkBg font-bold text-xs rounded-full transition"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-brand-muted dark:text-brand-darkMuted text-center py-2">
              No suggestions available
            </p>
          )}
        </div>
      )}

      {/* Footer Meta */}
      <div className="text-xs text-brand-muted dark:text-brand-darkMuted px-2 flex flex-wrap gap-x-2 gap-y-1">
        <a href="#" className="hover:underline">Terms</a>
        <a href="#" className="hover:underline">Privacy</a>
        <a href="#" className="hover:underline">Cookies</a>
        <a href="#" className="hover:underline">Ads info</a>
        <span>© 2026 X Clone.</span>
      </div>
    </div>
  );
}
