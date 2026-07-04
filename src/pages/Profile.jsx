import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import EditProfileModal from '../components/profile/EditProfileModal';
import PostCard from '../components/post/PostCard';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  increment,
  serverTimestamp, 
  orderBy, 
  addDoc 
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { RiCalendar2Line, RiMapPin2Line, RiLink, RiArrowLeftLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function Profile() {
  const { username } = useParams();
  const { currentUser, userData } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        let uData = null;
        
        // 1. Fetch by username
        const qUsername = query(usersRef, where('username', '==', username));
        let snapshot = await getDocs(qUsername);
        
        if (!snapshot.empty) {
          const uDoc = snapshot.docs[0];
          uData = { uid: uDoc.id, ...uDoc.data() };
        } else {
          // 2. Fallback: Query by displayName (for older notifications linking via displayName)
          const qDisplay = query(usersRef, where('displayName', '==', username));
          snapshot = await getDocs(qDisplay);
          if (!snapshot.empty) {
            const uDoc = snapshot.docs[0];
            uData = { uid: uDoc.id, ...uDoc.data() };
          } else {
            // 3. Fallback: Lookup directly by UID
            try {
              const docRef = doc(db, 'users', username);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                uData = { uid: docSnap.id, ...docSnap.data() };
              }
            } catch (err) {
              console.warn("UID fallback check error:", err);
            }
          }
        }

        if (!uData) {
          setProfileUser(null);
          setLoading(false);
          return;
        }

        // Fetch actual counts dynamically for 100% accuracy
        let followersCount = 0;
        let followingCount = 0;

        try {
          const followersSnapshot = await getDocs(query(collection(db, 'followers'), where('followingId', '==', uData.uid)));
          followersCount = followersSnapshot.size;
        } catch (cErr) {
          console.error("Error loading followers count:", cErr);
        }

        try {
          const followingSnapshot = await getDocs(query(collection(db, 'following'), where('followerId', '==', uData.uid)));
          followingCount = followingSnapshot.size;
        } catch (cErr) {
          console.error("Error loading following count:", cErr);
        }

        setProfileUser({
          ...uData,
          followersCount,
          followingCount
        });

        if (currentUser && currentUser.uid !== uData.uid) {
          try {
            const followId = `${currentUser.uid}_${uData.uid}`;
            const followDoc = await getDoc(doc(db, 'following', followId));
            setIsFollowing(followDoc.exists());
          } catch (followErr) {
            console.error("Error loading follow state:", followErr);
          }
        }

        // Fetch user posts (requires index: userId == value, createdAt DESC)
        try {
          const postsRef = collection(db, 'posts');
          const pq = query(postsRef, where('userId', '==', uData.uid), orderBy('createdAt', 'desc'));
          const postSnapshot = await getDocs(pq);
          const pList = postSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPosts(pList);
        } catch (postErr) {
          console.error("Error loading user posts timeline (failed-precondition means index is missing):", postErr);
          toast.error("Could not load posts feed. If this is a new project, a composite index is required.", { id: 'posts-index-warn' });
        } finally {
          setPostsLoading(false);
        }
      } catch (err) {
        console.error("Error loading profile details:", err);
        toast.error(`Could not load user profile: ${err.code || err.message || err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error("Please login to follow users");
      return;
    }
    try {
      const followId = `${currentUser.uid}_${profileUser.uid}`;
      const followingDocRef = doc(db, 'following', followId);
      const followerDocRef = doc(db, 'followers', followId);

      const targetUserRef = doc(db, 'users', profileUser.uid);
      const currentUserRef = doc(db, 'users', currentUser.uid);

      if (isFollowing) {
        await deleteDoc(followingDocRef);
        await deleteDoc(followerDocRef);
        
        // Atomically decrement counts in Firestore
        await updateDoc(targetUserRef, {
          followersCount: increment(-1)
        });
        await updateDoc(currentUserRef, {
          followingCount: increment(-1)
        });

        setProfileUser(prev => ({
          ...prev,
          followersCount: Math.max(0, (prev.followersCount || 1) - 1)
        }));
        setIsFollowing(false);
        toast.success(`Unfollowed @${profileUser.username}`);
      } else {
        await setDoc(followingDocRef, {
          followerId: currentUser.uid,
          followingId: profileUser.uid,
          createdAt: serverTimestamp()
        });
        await setDoc(followerDocRef, {
          followerId: currentUser.uid,
          followingId: profileUser.uid,
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
          senderId: currentUser.uid,
          receiverId: profileUser.uid,
          type: 'follow',
          senderName: userData?.displayName || currentUser.displayName || currentUser.email.split('@')[0],
          senderUsername: userData?.username || '',
          senderPhoto: userData?.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.uid}`,
          read: false,
          createdAt: serverTimestamp()
        });

        setProfileUser(prev => ({
          ...prev,
          followersCount: (prev.followersCount || 0) + 1
        }));
        setIsFollowing(true);
        toast.success(`Followed @${profileUser.username}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating follow status");
    }
  };

  const handleProfileUpdate = (updatedFields) => {
    setProfileUser(prev => ({
      ...prev,
      ...updatedFields
    }));
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  if (loading) {
    return (
      <Layout mobileTitle="Profile">
        <div className="p-4 space-y-4 animate-pulse">
          <div className="h-32 rounded-xl bg-gray-200 dark:bg-zinc-800"></div>
          <div className="w-20 h-20 -mt-10 ml-4 rounded-full border-4 border-white bg-gray-200 dark:bg-zinc-800"></div>
          <div className="h-6 w-40 rounded bg-gray-200 dark:bg-zinc-800"></div>
          <div className="h-4 w-28 rounded bg-gray-200 dark:bg-zinc-800"></div>
          <div className="space-y-2 pt-4">
            <div className="h-4 w-full rounded bg-gray-200 dark:bg-zinc-800"></div>
            <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-zinc-800"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profileUser) {
    return (
      <Layout mobileTitle="Profile Not Found">
        <div className="flex flex-col items-center justify-center p-12 text-center select-none">
          <h2 className="text-xl font-bold mb-2">This account doesn’t exist</h2>
          <p className="text-sm text-brand-muted dark:text-brand-darkMuted mb-6">
            Try searching for another.
          </p>
          <Link to="/" className="py-2 px-6 bg-brand-blue hover:bg-brand-blueHover text-white font-bold rounded-full text-sm transition">
            Go Home
          </Link>
        </div>
      </Layout>
    );
  }

  const joinDate = profileUser.joinedAt?.toDate
    ? profileUser.joinedAt.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <Layout mobileTitle={profileUser.displayName}>
      <div className="relative border-b border-divider">
        <div className="sticky top-0 bg-white/90 dark:bg-brand-darkBg/90 backdrop-blur-md flex items-center gap-6 px-4 py-2 select-none z-10 border-b border-divider">
          <Link to="/" className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full text-brand-text dark:text-brand-darkText">
            <RiArrowLeftLine className="text-xl" />
          </Link>
          <div>
            <h2 className="font-extrabold text-brand-text dark:text-brand-darkText text-base leading-tight truncate">
              {profileUser.displayName}
            </h2>
            <p className="text-xs text-brand-muted dark:text-brand-darkMuted leading-tight">
              {posts.length} Posts
            </p>
          </div>
        </div>

        <div className="h-48 bg-gray-200 dark:bg-zinc-800">
          {profileUser.coverURL && (
            <img src={profileUser.coverURL} alt="Banner" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="px-4 pb-4 select-none relative">
          <div className="flex justify-between items-end relative -mt-16 mb-4">
            <img
              src={profileUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profileUser.uid}`}
              alt="Avatar"
              className="w-28 h-28 rounded-full border-4 border-white dark:border-brand-darkBg bg-white dark:bg-brand-darkBgLight object-cover shadow"
            />
            
            {currentUser && currentUser.uid === profileUser.uid ? (
              <button
                onClick={() => setIsEditOpen(true)}
                className="py-1.5 px-5 bg-transparent border border-divider hover:bg-gray-50 dark:hover:bg-zinc-900 text-brand-text dark:text-brand-darkText font-bold text-sm rounded-full transition"
              >
                Edit profile
              </button>
            ) : (
              <button
                onClick={handleFollowToggle}
                className={`py-1.5 px-6 font-bold text-sm rounded-full transition ${
                  isFollowing
                    ? 'bg-transparent border border-divider hover:border-red-600 hover:text-red-600 text-brand-text dark:text-brand-darkText'
                    : 'bg-brand-text dark:bg-brand-darkText text-brand-bg dark:text-brand-darkBg hover:opacity-90'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div>
            <h1 className="font-extrabold text-xl text-brand-text dark:text-brand-darkText leading-none truncate">
              {profileUser.displayName}
            </h1>
            <p className="text-sm text-brand-muted dark:text-brand-darkMuted mb-3 truncate">
              @{profileUser.username}
            </p>

            {profileUser.bio && (
              <p className="text-sm text-brand-text dark:text-brand-darkText mb-3 break-words">
                {profileUser.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-brand-muted dark:text-brand-darkMuted mb-3">
              {profileUser.location && (
                <span className="flex items-center gap-1">
                  <RiMapPin2Line />
                  {profileUser.location}
                </span>
              )}
              {profileUser.website && (
                <span className="flex items-center gap-1">
                  <RiLink />
                  <a href={profileUser.website} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                    {profileUser.website.replace(/(^\w+:|^)\/\//, '')}
                  </a>
                </span>
              )}
              <span className="flex items-center gap-1">
                <RiCalendar2Line />
                Joined {joinDate}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-brand-text dark:text-brand-darkText">
              <Link to="#" className="hover:underline">
                <strong className="font-bold">{profileUser.followingCount || 0}</strong>{' '}
                <span className="text-brand-muted dark:text-brand-darkMuted">Following</span>
              </Link>
              <Link to="#" className="hover:underline">
                <strong className="font-bold">{profileUser.followersCount || 0}</strong>{' '}
                <span className="text-brand-muted dark:text-brand-darkMuted">Followers</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex border-t border-divider text-sm font-bold select-none">
          <button className="flex-1 py-3 text-center border-b-2 border-brand-blue text-brand-text dark:text-brand-darkText">
            Posts
          </button>
        </div>
      </div>

      <div className="divide-y divide-divider">
        {postsLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 rounded-full skeleton-shimmer"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded skeleton-shimmer"></div>
                  <div className="h-3 w-full rounded skeleton-shimmer"></div>
                  <div className="h-3 w-5/6 rounded skeleton-shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => {
            const postWithAuthor = {
              ...post,
              author: {
                uid: profileUser.uid,
                displayName: profileUser.displayName,
                username: profileUser.username,
                photoURL: profileUser.photoURL
              }
            };
            return (
              <PostCard
                key={post.id}
                post={postWithAuthor}
                onDeleteSuccess={handlePostDelete}
              />
            );
          })
        ) : (
          <div className="p-12 text-center select-none text-brand-muted dark:text-brand-darkMuted">
            No posts from this user yet.
          </div>
        )}
      </div>

      {isEditOpen && (
        <EditProfileModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          userProfile={profileUser}
          onUpdate={handleProfileUpdate}
        />
      )}
    </Layout>
  );
}
