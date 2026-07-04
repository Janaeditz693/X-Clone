import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { compressImage } from '../../utils/imageCompressor';
import { uploadFileWithProgress } from '../../services/storage';
import { RiCloseLine, RiCameraLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function EditProfileModal({ isOpen, onClose, userProfile, onUpdate }) {
  const [displayName, setDisplayName] = useState(userProfile.displayName || '');
  const [bio, setBio] = useState(userProfile.bio || '');
  const [location, setLocation] = useState(userProfile.location || '');
  const [website, setWebsite] = useState(userProfile.website || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(userProfile.photoURL || '');
  const [coverPreview, setCoverPreview] = useState(userProfile.coverURL || '');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const validateImage = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Format not supported. Use JPG, PNG or WEBP.");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return false;
    }
    return true;
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && validateImage(file)) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file && validateImage(file)) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      return toast.error("Display name cannot be empty.");
    }
    try {
      setUploading(true);
      let newAvatarUrl = userProfile.photoURL || '';
      let newCoverUrl = userProfile.coverURL || '';

      if (avatarFile) {
        setProgress(10);
        const compressedAvatar = await compressImage(avatarFile);
        setProgress(30);
        newAvatarUrl = await uploadFileWithProgress(
          compressedAvatar,
          `users/${userProfile.uid}/avatar_${Date.now()}`,
          (p) => setProgress(30 + Math.round(p * 0.35))
        );
      }

      if (coverFile) {
        setProgress(avatarFile ? 65 : 10);
        const compressedCover = await compressImage(coverFile);
        setProgress(avatarFile ? 75 : 30);
        newCoverUrl = await uploadFileWithProgress(
          compressedCover,
          `users/${userProfile.uid}/cover_${Date.now()}`,
          (p) => setProgress((avatarFile ? 75 : 30) + Math.round(p * 0.20))
        );
      }

      setProgress(95);

      const userRef = doc(db, 'users', userProfile.uid);
      const updatedFields = {
        displayName,
        bio,
        location,
        website,
        photoURL: newAvatarUrl,
        coverURL: newCoverUrl
      };

      await updateDoc(userRef, updatedFields);
      setProgress(100);
      
      toast.success("Profile updated successfully!");
      if (onUpdate) onUpdate(updatedFields);
      onClose();
    } catch (err) {
      console.error("Profile Save Error:", err);
      toast.error(`Failed to update profile: ${err.code || err.message || err}`);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-brand-darkBgLight w-full max-w-lg rounded-2xl shadow-2xl border border-gray-150 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-divider select-none">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full text-brand-text dark:text-brand-darkText"
              disabled={uploading}
            >
              <RiCloseLine className="text-2xl" />
            </button>
            <span className="font-bold text-brand-text dark:text-brand-darkText text-base">Edit Profile</span>
          </div>
          
          <button
            onClick={handleSave}
            disabled={uploading}
            className="py-1.5 px-6 bg-brand-text dark:bg-brand-darkText text-brand-bg dark:text-brand-darkBg font-bold text-sm rounded-full transition disabled:opacity-50"
          >
            Save
          </button>
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="w-full bg-gray-100 dark:bg-zinc-800 h-1">
            <div className="bg-brand-blue h-1 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        {/* Scrollable Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Cover Image Upload Area */}
          <div className="relative h-36 bg-gray-200 dark:bg-zinc-800 rounded-xl overflow-hidden group select-none">
            {coverPreview && (
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-70 group-hover:opacity-100 transition">
              <label className="cursor-pointer p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition">
                <RiCameraLine className="text-xl" />
                <input type="file" onChange={handleCoverChange} className="hidden" accept="image/*" disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Avatar Image Upload Area */}
          <div className="relative -mt-16 ml-4 w-24 h-24 rounded-full border-4 border-white dark:border-brand-darkBgLight overflow-hidden group select-none shadow">
            <img
              src={avatarPreview || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userProfile.uid}`}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-70 group-hover:opacity-100 transition">
              <label className="cursor-pointer p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition">
                <RiCameraLine className="text-lg" />
                <input type="file" onChange={handleAvatarChange} className="hidden" accept="image/*" disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Text Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-brand-muted dark:text-brand-darkMuted">
                Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="w-full px-3 py-2 rounded border border-divider bg-transparent text-sm text-brand-text dark:text-brand-darkText focus:outline-none focus:ring-1 focus:ring-brand-blue"
                disabled={uploading}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-brand-muted dark:text-brand-darkMuted flex justify-between">
                <span>Bio</span>
                <span>{bio.length}/160</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={3}
                className="w-full px-3 py-2 rounded border border-divider bg-transparent text-sm text-brand-text dark:text-brand-darkText resize-none focus:outline-none focus:ring-1 focus:ring-brand-blue"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-brand-muted dark:text-brand-darkMuted">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={30}
                className="w-full px-3 py-2 rounded border border-divider bg-transparent text-sm text-brand-text dark:text-brand-darkText focus:outline-none focus:ring-1 focus:ring-brand-blue"
                placeholder="e.g. San Francisco, CA"
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-brand-muted dark:text-brand-darkMuted">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 rounded border border-divider bg-transparent text-sm text-brand-text dark:text-brand-darkText focus:outline-none focus:ring-1 focus:ring-brand-blue"
                placeholder="e.g. https://mywebsite.com"
                disabled={uploading}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
