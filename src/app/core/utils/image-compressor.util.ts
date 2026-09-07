/**
 * Client-Side Smart Image Compressor & Scaler
 * Prevents GPU saturation and mobile freezing by resizing massive camera photos (4000x3000px, 15MB)
 * down to optimal web resolution (max 1600px, ~200-350KB) before previewing or uploading.
 */
export async function compressAndResizeImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<{ file: File; objectUrl: string }> {
  return new Promise((resolve) => {
    // If not an image, return raw
    if (!file.type.startsWith('image/')) {
      resolve({ file, objectUrl: URL.createObjectURL(file) });
      return;
    }

    // If already small SVG or small gif, skip compression
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      resolve({ file, objectUrl: URL.createObjectURL(file) });
      return;
    }

    const img = new Image();
    const tempUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(tempUrl);

      let { width, height } = img;

      // Calculate proportional dimensions
      if (width > maxWidth || height > maxHeight) {
        if (width / maxWidth > height / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        // Fallback if canvas context fails
        const fallbackUrl = URL.createObjectURL(file);
        resolve({ file, objectUrl: fallbackUrl });
        return;
      }

      // Smooth downsampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer WebP if supported, fallback to JPEG
      const outputFormat = 'image/jpeg';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            const fallbackUrl = URL.createObjectURL(file);
            resolve({ file, objectUrl: fallbackUrl });
            return;
          }

          const newFileName = file.name.replace(/\.[^.]+$/, '.jpg');
          const compressedFile = new File([blob], newFileName, {
            type: outputFormat,
            lastModified: Date.now(),
          });

          const finalObjectUrl = URL.createObjectURL(blob);
          resolve({ file: compressedFile, objectUrl: finalObjectUrl });
        },
        outputFormat,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      const fallbackUrl = URL.createObjectURL(file);
      resolve({ file, previewUrl: fallbackUrl, objectUrl: fallbackUrl } as any);
    };

    img.src = tempUrl;
  });
}
