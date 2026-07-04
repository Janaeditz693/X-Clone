/**
 * Compresses an image file client-side using HTML5 Canvas to optimize storage and upload speeds.
 * 
 * @param {File} file The original file from input
 * @param {Object} options Configuration parameters for resizing and output quality
 * @returns {Promise<Blob>} Resolves with a compressed image Blob
 */
export const compressImage = (file, { maxWidth = 1000, maxHeight = 1000, quality = 0.75 } = {}) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error("Invalid file type: File must be an image."));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Apply dimensions constraints maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert the canvas drawing back into a compressed file-like Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas image compression failed."));
            }
          },
          file.type,
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
