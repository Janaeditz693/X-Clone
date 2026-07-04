import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { RiCloseLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function ReportModal({ isOpen, onClose, post }) {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !post) return null;

  const reasons = [
    'Spam',
    'Harassment',
    'Violence',
    'Fake News',
    'Copyright',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return toast.error("Please select a reason.");
    if (!currentUser) return toast.error("Please sign in to report posts.");

    try {
      setSubmitting(true);

      const reportDoc = {
        postId: post.id,
        reporterId: currentUser.uid,
        reason,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
        postContent: post.content,
        authorUsername: post.author?.username || 'unknown',
        status: 'pending'
      };

      await addDoc(collection(db, 'reports'), reportDoc);

      // Increment reports count count on post
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        reportsCount: increment(1)
      });

      toast.success("Post reported. The admin team will review it.");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to report post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white dark:bg-brand-darkBgLight w-full max-w-md rounded-2xl shadow-2xl border border-gray-150 dark:border-zinc-800 p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-divider">
          <h3 className="font-bold text-brand-text dark:text-brand-darkText text-base">Report Post</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full text-brand-text dark:text-brand-darkText"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brand-muted dark:text-brand-darkMuted mb-2">
              Why are you reporting this post?
            </label>
            <div className="space-y-2">
              {reasons.map((r) => (
                <label 
                  key={r} 
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-divider hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer text-sm text-brand-text dark:text-brand-darkText transition"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-brand-blue"
                    disabled={submitting}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-muted dark:text-brand-darkMuted mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              maxLength={150}
              placeholder="Provide context..."
              className="w-full px-3 py-2 border border-divider rounded bg-transparent text-sm text-brand-text dark:text-brand-darkText resize-none focus:outline-none focus:border-brand-blue"
              disabled={submitting}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-4 border border-divider rounded-full font-bold text-xs hover:bg-gray-50 dark:hover:bg-zinc-900 text-brand-text dark:text-brand-darkText"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reason}
              className="py-1.5 px-5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-full disabled:opacity-50 transition"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
