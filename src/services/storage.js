import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebaseConfig";

/**
 * Uploads a file to Firebase Storage (fallback).
 */
const uploadFirebaseWithProgress = (blob, path, onProgress) => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error("Storage upload failed:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

/**
 * Uploads a file to Cloudinary or falls back to Firebase Storage if credentials are not configured.
 * 
 * @param {Blob|File} blob File payload to upload
 * @param {string} path Destination path inside Firebase Storage (used for fallback)
 * @param {Function} onProgress Callback receiving completion percentage (0 - 100)
 * @returns {Promise<string>} Secure URL of the uploaded resource
 */
export const uploadFileWithProgress = async (blob, path, onProgress) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Fallback to Firebase Storage if Cloudinary credentials are not defined
  if (!cloudName || !uploadPreset) {
    console.warn("Cloudinary configuration missing in .env. Falling back to Firebase Storage.");
    return uploadFirebaseWithProgress(blob, path, onProgress);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(Math.round(percentComplete));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch (e) {
          reject(new Error("Failed to parse Cloudinary response"));
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          reject(new Error(response.error?.message || "Cloudinary upload failed"));
        } catch (e) {
          reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error occurred during Cloudinary upload"));
    };

    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", uploadPreset);
    xhr.send(formData);
  });
};

