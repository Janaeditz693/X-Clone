import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, increment, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { RiCloseLine, RiDeleteBin7Line } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function CommentModal({ isOpen, onClose, post }) {
  const { userData } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !post?.id) return;

    setLoading(true);
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('postId', '==', post.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(list);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return unsubscribe;
  }, [isOpen, post?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !userData) return;

    try {
      setSubmitting(true);
      
      const newComment = {
        postId: post.id,
        userId: userData.uid,
        content: commentText.trim(),
        createdAt: serverTimestamp(),
        author: {
          displayName: userData.displayName,
          username: userData.username,
          photoURL: userData.photoURL
        }
      };

      await addDoc(collection(db, 'comments'), newComment);

      // Increment comments count count on post
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        commentsCount: increment(1)
      });

      // Write notification (if comment writer is not post author)
      if (post.userId !== userData.uid) {
        await addDoc(collection(db, 'notifications'), {
          senderId: userData.uid,
          receiverId: post.userId,
          type: 'comment',
          postId: post.id,
          senderName: userData.displayName,
          senderUsername: userData.username || '',
          senderPhoto: userData.photoURL,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      setCommentText('');
      toast.success("Comment added!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      
      // Decrement comments count count on post
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        commentsCount: increment(-1)
      });
      
      toast.success("Comment deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Could not delete comment.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white dark:bg-brand-darkBgLight w-full max-w-lg rounded-2xl shadow-2xl border border-gray-150 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[80vh] animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-divider">
          <span className="font-bold text-brand-text dark:text-brand-darkText">Comments</span>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-150 dark:hover:bg-zinc-900 rounded-full text-brand-text dark:text-brand-darkText"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        {/* Post Preview Summary */}
        <div className="p-4 bg-gray-50/50 dark:bg-zinc-900/10 border-b border-divider flex gap-3">
          <img
            src={post.author?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${post.userId}`}
            alt="Avatar"
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-brand-muted dark:text-brand-darkMuted">
              <span className="font-bold text-brand-text dark:text-brand-darkText">{post.author?.displayName}</span>
              <span>@{post.author?.username}</span>
            </div>
            <p className="text-sm mt-1 text-brand-text dark:text-brand-darkText truncate">{post.content}</p>
          </div>
        </div>

        {/* Scrollable Comments List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-divider space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-2 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-24 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                    <div className="h-3 w-full bg-gray-200 dark:bg-zinc-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => {
              const isCommentOwner = userData?.uid === comment.userId;
              return (
                <div key={comment.id} className="pt-3 pb-1 flex gap-3 group">
                  <img
                    src={comment.author?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${comment.userId}`}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover bg-gray-150"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-brand-text dark:text-brand-darkText">{comment.author?.displayName}</span>
                        <span className="text-brand-muted dark:text-brand-darkMuted">@{comment.author?.username}</span>
                      </div>
                      
                      {isCommentOwner && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-brand-muted hover:text-red-500 p-1 rounded-full transition opacity-0 group-hover:opacity-100"
                          title="Delete Comment"
                        >
                          <RiDeleteBin7Line className="text-xs" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm mt-1 text-brand-text dark:text-brand-darkText break-words whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-xs text-brand-muted dark:text-brand-darkMuted py-8">
              No comments yet. Start the conversation!
            </p>
          )}
        </div>

        {/* Comment Input Footer */}
        {userData && (
          <form onSubmit={handleSubmit} className="p-4 border-t border-divider flex items-center gap-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Post your reply"
              className="flex-1 px-4 py-2 border border-divider rounded-full bg-transparent text-sm text-brand-text dark:text-brand-darkText focus:outline-none focus:border-brand-blue"
              maxLength={200}
              disabled={submitting}
              required
            />
            <button
              type="submit"
              disabled={!commentText.trim() || submitting}
              className="py-1.5 px-5 bg-brand-blue hover:bg-brand-blueHover text-white font-bold text-xs rounded-full disabled:opacity-50 transition"
            >
              Reply
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
