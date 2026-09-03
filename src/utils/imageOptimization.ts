/**
 * 图片优化工具函数
 */

/**
 * 验证图片文件大小
 */
export const validateImageSize = (file: File, maxSizeMB = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * 验证图片文件类型
 */
export const validateImageType = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
};

/**
 * 压缩图片
 * @param file 图片文件
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @param quality 压缩质量 (0-1)
 * @returns base64 字符串
 */
export const compressImage = async (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 验证文件类型
    if (!validateImageType(file)) {
      reject(new Error('Invalid image type. Only JPEG, PNG, GIF, and WebP are supported.'));
      return;
    }

    // 验证文件大小
    if (!validateImageSize(file, 10)) {
      reject(new Error('Image file is too large. Maximum size is 10MB.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // 计算缩放比例
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 base64
        try {
          const compressed = canvas.toDataURL('image/jpeg', quality);

          // 检查压缩后的大小
          const sizeInBytes = Math.round((compressed.length * 3) / 4);
          const sizeInMB = sizeInBytes / (1024 * 1024);

          if (sizeInMB > 2) {
            // 如果压缩后仍然太大，降低质量
            const lowerQuality = quality * 0.7;
            const recompressed = canvas.toDataURL('image/jpeg', lowerQuality);
            resolve(recompressed);
          } else {
            resolve(compressed);
          }
        } catch {
          reject(new Error('Failed to compress image'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
