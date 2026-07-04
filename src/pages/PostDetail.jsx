import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PostCard from '../components/post/PostCard';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  increment,
  onSnapshot, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { RiArrowLeftLine, RiSendPlane2Line, RiDeleteBin7Line } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function PostDetail() {
  const { postId } = useParams();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    if (!postId) return;

    // 1. Fetch Post details real-time
    const postRef = doc(db, 'posts', postId);
    const unsubscribePost = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() });
      } else {
        setPost(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error loading post:", err);
      toast.error("Could not load post details.");
      setLoading(false);
    });

    // 2. Fetch real-time comments (sorted client-side to prevent missing index crashes)
    const commentsRef = collection(db, 'comments');
    const q = query(commentsRef, where('postId', '==', postId));
    const unsubscribeComments = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort client-side by createdAt ascending (earliest comments first)
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });
      setComments(list);
    }, (err) => {
      console.error("Error loading comments:", err);
    });

    return () => {
      unsubscribePost();
      unsubscribeComments();
    };
  }, [postId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || commenting || !currentUser) return;

    try {
      setCommenting(true);
      const newComment = {
        postId,
        userId: currentUser.uid,
        displayName: userData?.displayName || currentUser.email.split('@')[0],
        username: userData?.username || currentUser.email.split('@')[0],
        photoURL: userData?.photoURL || currentUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.uid}`,
        content: commentText.trim(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'comments'), newComment);
      
      // Atomically increment commentsCount on the parent post document
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentsCount: increment(1)
      });

      // Add comment notification for the post owner if it's not the current user
      if (post && post.userId !== currentUser.uid) {
        await addDoc(collection(db, 'notifications'), {
          senderId: currentUser.uid,
          receiverId: post.userId,
          type: 'comment',
          senderName: userData?.displayName || currentUser.email.split('@')[0],
          senderUsername: userData?.username || '',
          senderPhoto: userData?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.uid}`,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      setCommentText('');
      toast.success("Reply posted!");
    } catch (err) {
      console.error("Error posting comment:", err);
      toast.error("Failed to post reply.");
    } finally {
      setCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    try {
      const commentRef = doc(db, 'comments', commentId);
      await deleteDoc(commentRef);
      
      // Atomically decrement commentsCount on parent post
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentsCount: increment(-1)
      });
      toast.success("Reply deleted.");
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error("Failed to delete reply.");
    }
  };

  return (
    <Layout mobileTitle="Post">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 dark:bg-brand-darkBg/90 backdrop-blur-md px-4 py-3 select-none border-b border-divider z-10 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full text-brand-text dark:text-brand-darkText transition"
        >
          <RiArrowLeftLine className="text-xl" />
        </button>
        <div>
          <h2 className="font-extrabold text-brand-text dark:text-brand-darkText text-lg">Post</h2>
        </div>
      </div>

      {loading ? (
        <div className="p-4 space-y-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-3 w-full bg-gray-200 dark:bg-zinc-800 rounded"></div>
            </div>
          </div>
        </div>
      ) : post ? (
        <div>
          {/* Active Post Card */}
          <PostCard post={post} />

          {/* Reply Composition Box */}
          <form onSubmit={handlePostComment} className="p-4 border-y border-divider flex gap-3 bg-gray-50/10 dark:bg-zinc-900/10">
            <img
              src={userData?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser?.uid}`}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover select-none"
            />
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Post your reply"
                className="w-full bg-transparent border-0 text-brand-text dark:text-brand-darkText placeholder-brand-muted dark:placeholder-brand-darkMuted resize-none outline-hidden text-base min-h-[60px]"
                maxLength={280}
                disabled={commenting}
              ></textarea>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-divider/40">
                <span className="text-xs text-brand-muted dark:text-brand-darkMuted select-none">
                  {280 - commentText.length} characters left
                </span>
                <button
                  type="submit"
                  disabled={!commentText.trim() || commenting}
                  className="px-4 py-1.5 bg-brand-blue hover:bg-brand-blueHover text-white font-bold rounded-full text-sm transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RiSendPlane2Line />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="divide-y divide-divider">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="p-4 flex gap-3 hover:bg-gray-50/30 dark:hover:bg-zinc-950/10 transition">
                  <Link to={`/profile/${comment.username}`} className="shrink-0">
                    <img
                      src={comment.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${comment.userId}`}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover select-none"
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5 text-xs select-none">
                        <Link to={`/profile/${comment.username}`} className="font-bold text-brand-text dark:text-brand-darkText hover:underline">
                          {comment.displayName}
                        </Link>
                        <span className="text-brand-muted dark:text-brand-darkMuted">@{comment.username}</span>
                      </div>
                      
                      {/* Delete button (only for comment owner or admin) */}
                      {(currentUser?.uid === comment.userId || userData?.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-brand-muted hover:text-red-500 rounded-full transition"
                          title="Delete reply"
                        >
                          <RiDeleteBin7Line className="text-sm" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm mt-1 text-brand-text dark:text-brand-darkText break-words whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-brand-muted dark:text-brand-darkMuted select-none text-sm">
                No replies yet. Be the first to reply!
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center select-none">
          <h3 className="font-extrabold text-xl text-brand-text dark:text-brand-darkText">This post does not exist</h3>
          <p className="text-sm text-brand-muted dark:text-brand-darkMuted mt-1">
            Try searching for another post or return home.
          </p>
        </div>
      )}
    </Layout>
  );
}
