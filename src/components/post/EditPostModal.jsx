import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { RiCloseLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function EditPostModal({ isOpen, onClose, post, onUpdateSuccess }) {
  const [content, setContent] = useState(post?.content || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !post) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!content.trim()) return toast.error("Content cannot be empty!");
    if (content.length > 280) return toast.error("Post exceeds 280 characters.");

    try {
      setLoading(true);
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        content: content.trim()
      });

      toast.success("Post updated!");
      if (onUpdateSuccess) onUpdateSuccess(post.id, content.trim());
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white dark:bg-brand-darkBgLight w-full max-w-md rounded-2xl shadow-2xl border border-gray-150 dark:border-zinc-800 p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-divider">
          <h3 className="font-bold text-brand-text dark:text-brand-darkText text-base">Edit Post</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full text-brand-text dark:text-brand-darkText"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={280}
              className="w-full px-3 py-2 border border-divider rounded bg-transparent text-sm text-brand-text dark:text-brand-darkText resize-none focus:outline-none focus:border-brand-blue"
              required
              disabled={loading}
            />
            <div className="flex justify-between text-xs text-brand-muted mt-1 select-none">
              <span>{content.length}/280</span>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-4 border border-divider rounded-full font-bold text-xs hover:bg-gray-50 dark:hover:bg-zinc-900 text-brand-text dark:text-brand-darkText"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="py-1.5 px-5 bg-brand-blue hover:bg-brand-blueHover text-white font-bold text-xs rounded-full disabled:opacity-50 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
