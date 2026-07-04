import React, { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { compressImage } from '../../utils/imageCompressor';
import { uploadFileWithProgress } from '../../services/storage';
import { RiImageLine, RiCloseLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function TweetBox({ onPostSuccess, placeholder = "What's happening?!" }) {
  const { userData } = useAuth();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const maxChars = 280;
  const charsRemaining = maxChars - content.length;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return toast.error("Format not supported. Use JPG, PNG or WEBP.");
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Image size must be smaller than 5MB.");
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;
    if (content.length > maxChars) return toast.error("Post exceeds character limit!");

    try {
      setUploading(true);
      let mediaURL = '';

      if (selectedFile) {
        setProgress(15);
        const compressed = await compressImage(selectedFile);
        setProgress(40);
        mediaURL = await uploadFileWithProgress(
          compressed,
          `posts/${userData.uid}/post_${Date.now()}`,
          (p) => setProgress(40 + Math.round(p * 0.55))
        );
      }

      setProgress(95);

      const postDoc = {
        userId: userData.uid,
        content: content.trim(),
        mediaURL,
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        reportsCount: 0,
        author: {
          displayName: userData.displayName,
          username: userData.username,
          photoURL: userData.photoURL
        }
      };

      await addDoc(collection(db, 'posts'), postDoc);
      setProgress(100);

      toast.success("Posted successfully!");
      setContent('');
      handleRemoveImage();
      if (onPostSuccess) onPostSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Failed to share post.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <form onSubmit={handlePost} className="p-4 border-b border-divider flex gap-3 select-none">
      <img
        src={userData?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userData?.uid}`}
        alt="Avatar"
        className="w-10 h-10 rounded-full object-cover bg-gray-150 dark:bg-zinc-800"
      />
      <div className="flex-1 flex flex-col">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={maxChars + 20}
          className="w-full bg-transparent text-sm text-brand-text dark:text-brand-darkText placeholder-brand-muted dark:placeholder-brand-darkMuted resize-none outline-none focus:ring-0 mt-1 py-1"
          disabled={uploading}
        />

        {uploading && progress > 0 && (
          <div className="w-full bg-gray-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden mb-3">
            <div className="bg-brand-blue h-1 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        {previewUrl && (
          <div className="relative mt-2 mb-4 rounded-xl overflow-hidden max-h-72 border border-divider">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1.5 bg-black/75 hover:bg-black/90 text-white rounded-full transition"
              disabled={uploading}
            >
              <RiCloseLine className="text-lg" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-divider pt-3 mt-2 select-none">
          <div className="flex items-center gap-1.5 text-brand-blue">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-brand-blue/10 rounded-full transition animate-pulse"
              disabled={uploading}
              title="Add Image"
            >
              <RiImageLine className="text-lg" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              disabled={uploading}
            />
          </div>

          <div className="flex items-center gap-3">
            {content.length > 0 && (
              <span className={`text-xs font-bold ${
                charsRemaining < 0
                  ? 'text-red-500'
                  : charsRemaining <= 20
                    ? 'text-yellow-500'
                    : 'text-brand-muted dark:text-brand-darkMuted'
              }`}>
                {charsRemaining}
              </span>
            )}
            
            <button
              type="submit"
              disabled={(!content.trim() && !selectedFile) || uploading || charsRemaining < 0}
              className="bg-brand-blue hover:bg-brand-blueHover text-white px-5 py-1.5 font-bold rounded-full text-xs shadow transition disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
