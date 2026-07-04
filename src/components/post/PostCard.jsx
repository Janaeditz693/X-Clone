import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, doc, getDoc, setDoc, deleteDoc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { 
  RiHeartFill, 
  RiHeartLine, 
  RiChat1Line, 
  RiBookmarkFill, 
  RiBookmarkLine, 
  RiDeleteBin7Line, 
  RiEdit2Line, 
  RiFlagLine,
  RiRepeatLine,
  RiShareLine,
  RiCloseLine
} from 'react-icons/ri';
import CommentModal from './CommentModal';
import ReportModal from './ReportModal';
import EditPostModal from './EditPostModal';
import toast from 'react-hot-toast';

export default function PostCard({ post, onDeleteSuccess }) {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [postContent, setPostContent] = useState(post.content);
  
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const isOwner = userData?.uid === post.userId;
  const isAdmin = userData?.role === 'admin';

  const likeDocId = currentUser ? `${currentUser.uid}_${post.id}` : null;
  const bookmarkDocId = currentUser ? `${currentUser.uid}_${post.id}` : null;

  useEffect(() => {
    if (!currentUser) return;

    const checkLikedAndBookmarked = async () => {
      try {
        const likeRef = doc(db, 'likes', likeDocId);
        const likeSnap = await getDoc(likeRef);
        setLiked(likeSnap.exists());

        const bookmarkRef = doc(db, 'bookmarks', bookmarkDocId);
        const bookmarkSnap = await getDoc(bookmarkRef);
        setBookmarked(bookmarkSnap.exists());
      } catch (err) {
        console.error(err);
      }
    };

    checkLikedAndBookmarked();
  }, [currentUser, post.id, likeDocId, bookmarkDocId]);

  useEffect(() => {
    if (post.commentsCount !== undefined) {
      setCommentsCount(post.commentsCount);
    }
  }, [post.commentsCount]);

  const handleLike = async () => {
    if (!currentUser) return toast.error("Please login to like posts.");

    const likeRef = doc(db, 'likes', likeDocId);
    const postRef = doc(db, 'posts', post.id);

    try {
      if (liked) {
        setLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));

        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
      } else {
        setLiked(true);
        setLikesCount(prev => prev + 1);

        await setDoc(likeRef, {
          userId: currentUser.uid,
          postId: post.id,
          createdAt: serverTimestamp()
        });
        await updateDoc(postRef, { likesCount: increment(1) });

        if (post.userId !== currentUser.uid) {
          await addDoc(collection(db, 'notifications'), {
            senderId: currentUser.uid,
            receiverId: post.userId,
            type: 'like',
            postId: post.id,
            senderName: userData.displayName,
            senderUsername: userData.username || '',
            senderPhoto: userData.photoURL,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (err) {
      console.error(err);
      setLiked(!liked);
      setLikesCount(post.likesCount);
      toast.error("Could not complete like action.");
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) return toast.error("Please login to bookmark posts.");

    const bookmarkRef = doc(db, 'bookmarks', bookmarkDocId);

    try {
      if (bookmarked) {
        setBookmarked(false);
        await deleteDoc(bookmarkRef);
        toast.success("Bookmark removed");
      } else {
        setBookmarked(true);
        await setDoc(bookmarkRef, {
          userId: currentUser.uid,
          postId: post.id,
          createdAt: serverTimestamp()
        });
        toast.success("Bookmark saved");
      }
    } catch (err) {
      console.error(err);
      setBookmarked(!bookmarked);
      toast.error("Could not update bookmark.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await deleteDoc(doc(db, 'posts', post.id));
      toast.success("Post deleted.");
      if (onDeleteSuccess) onDeleteSuccess(post.id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete post.");
    }
  };

  const handleUpdateSuccess = (id, newContent) => {
    setPostContent(newContent);
  };

  const timeAgo = post.createdAt?.toDate 
    ? new Date(post.createdAt.toDate()).toLocaleDateString()
    : 'Just now';

  const handleCardClick = (e) => {
    if (
      e.target.closest('button') || 
      e.target.closest('a') || 
      e.target.closest('svg')
    ) {
      return;
    }
    navigate(`/post/${post.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="p-4 flex gap-3 hover:bg-gray-50/40 dark:hover:bg-zinc-950/10 transition border-b border-divider animate-fade-in cursor-pointer"
    >
      <Link to={`/profile/${post.author?.username}`}>
        <img
          src={post.author?.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${post.userId}`}
          alt="Avatar"
          className="w-10 h-10 rounded-full object-cover bg-gray-250 dark:bg-zinc-800"
        />
      </Link>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between select-none">
          <div className="flex items-center gap-1.5 text-xs truncate max-w-[85%]">
            <Link to={`/profile/${post.author?.username}`} className="font-bold text-brand-text dark:text-brand-darkText hover:underline truncate">
              {post.author?.displayName}
            </Link>
            <span className="text-brand-muted dark:text-brand-darkMuted truncate">@{post.author?.username}</span>
            <span className="text-brand-muted dark:text-brand-darkMuted">·</span>
            <span className="text-brand-muted dark:text-brand-darkMuted whitespace-nowrap">{timeAgo}</span>
          </div>

          <div className="flex items-center gap-1">
            {isOwner && (
              <button 
                onClick={() => setIsEditOpen(true)}
                className="p-1.5 text-brand-muted dark:text-brand-darkMuted hover:text-brand-blue rounded-full hover:bg-brand-blue/10 transition"
                title="Edit Post"
              >
                <RiEdit2Line className="text-sm" />
              </button>
            )}
            {(isOwner || isAdmin) && (
              <button 
                onClick={handleDelete}
                className="p-1.5 text-brand-muted dark:text-brand-darkMuted hover:text-red-500 rounded-full hover:bg-red-500/10 transition"
                title="Delete Post"
              >
                <RiDeleteBin7Line className="text-sm" />
              </button>
            )}
          </div>
        </div>

        <p className="text-sm mt-1 text-brand-text dark:text-brand-darkText break-words whitespace-pre-wrap">
          {postContent}
        </p>

        {post.mediaURL && (
          <div 
            onClick={(e) => { e.stopPropagation(); setIsImageModalOpen(true); }}
            className="mt-3 rounded-xl overflow-hidden max-h-80 border border-divider cursor-zoom-in"
          >
            <img src={post.mediaURL} alt="Attachment" className="w-full h-full object-cover hover:opacity-95 transition" />
          </div>
        )}

        <div className="flex items-center justify-between text-brand-muted dark:text-brand-darkMuted mt-3 max-w-md select-none text-xs">
          {/* Comment */}
          <button 
            onClick={() => setIsCommentOpen(true)}
            className="flex items-center text-brand-muted hover:text-brand-blue group transition select-none outline-hidden"
            title="Comments"
          >
            <span className="w-8.5 h-8.5 rounded-full flex items-center justify-center group-hover:bg-brand-blue/10 transition duration-200 -ml-2">
              <RiChat1Line className="text-base" />
            </span>
            <span className="ml-1 leading-none">{commentsCount}</span>
          </button>

          {/* Repost */}
          <button 
            onClick={(e) => { e.stopPropagation(); toast.success("Reposted!"); }}
            className="flex items-center text-brand-muted hover:text-green-500 group transition select-none outline-hidden"
            title="Repost"
          >
            <span className="w-8.5 h-8.5 rounded-full flex items-center justify-center group-hover:bg-green-500/10 transition duration-200">
              <RiRepeatLine className="text-base" />
            </span>
            <span className="ml-1 leading-none">0</span>
          </button>
          
          {/* Like */}
          <button 
            onClick={handleLike}
            className={`flex items-center group transition select-none outline-hidden ${liked ? 'text-red-500 font-bold' : 'text-brand-muted hover:text-red-500'}`}
            title={liked ? "Unlike" : "Like"}
          >
            <span className="w-8.5 h-8.5 rounded-full flex items-center justify-center group-hover:bg-red-500/10 transition duration-200">
              {liked ? <RiHeartFill className="text-base" /> : <RiHeartLine className="text-base" />}
            </span>
            <span className="ml-1 leading-none">{likesCount}</span>
          </button>
          
          {/* Bookmark */}
          <button 
            onClick={handleBookmark}
            className={`flex items-center group transition select-none outline-hidden ${bookmarked ? 'text-brand-blue font-bold' : 'text-brand-muted hover:text-brand-blue'}`}
            title="Bookmark"
          >
            <span className="w-8.5 h-8.5 rounded-full flex items-center justify-center group-hover:bg-brand-blue/10 transition duration-200">
              {bookmarked ? <RiBookmarkFill className="text-base" /> : <RiBookmarkLine className="text-base" />}
            </span>
          </button>

          {/* Share */}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`); 
              toast.success("Post link copied to clipboard!"); 
            }}
            className="flex items-center text-brand-muted hover:text-brand-blue group transition select-none outline-hidden"
            title="Share"
          >
            <span className="w-8.5 h-8.5 rounded-full flex items-center justify-center group-hover:bg-brand-blue/10 transition duration-200">
              <RiShareLine className="text-base" />
            </span>
          </button>
          
          {/* Report */}
          {!isOwner && (
            <button 
              onClick={() => setIsReportOpen(true)}
              className="flex items-center text-brand-muted hover:text-yellow-600 group transition select-none outline-hidden"
              title="Report"
            >
              <span className="w-8.5 h-8.5 rounded-full flex items-center justify-center group-hover:bg-yellow-600/10 transition duration-200 -mr-2">
                <RiFlagLine className="text-base" />
              </span>
            </button>
          )}
        </div>
      </div>

      {isCommentOpen && (
        <CommentModal
          isOpen={isCommentOpen}
          onClose={() => setIsCommentOpen(false)}
          post={{ ...post, commentsCount }}
        />
      )}
      {isReportOpen && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          post={post}
        />
      )}
      {isEditOpen && (
        <EditPostModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          post={post}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
      {isImageModalOpen && (
        <div 
          onClick={(e) => { e.stopPropagation(); setIsImageModalOpen(false); }}
          className="fixed inset-0 bg-black/90 backdrop-blur-xs flex items-center justify-center z-[100] p-4 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img 
              src={post.mediaURL} 
              alt="Fullscreen Attachment" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
            />
            <button 
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition"
            >
              <RiCloseLine className="text-2xl" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
