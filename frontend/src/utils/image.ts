export const MIN_IMAGE_SIZE = 1024; // 1KB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// Backend URL for serving images
const BACKEND_URL = '';

/**
 * Validates an image file's type and size.
 * Returns an error message string if invalid, or null if valid.
 */
export const validateImageFile = (file: File): string | null => {
  if (!file) return null;

  if (!file.type.startsWith('image/')) {
    return 'Please select a valid image file';
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Invalid image type. Only JPEG, PNG, and GIF are allowed (got ${file.type})`;
  }

  if (file.size < MIN_IMAGE_SIZE) {
    return `Image is too small. Minimum size is ${Math.round(MIN_IMAGE_SIZE / 1024)}KB.`;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return `Image is too large. Maximum size is ${Math.round(MAX_IMAGE_SIZE / 1024 / 1024)}MB.`;
  }

  return null; // Valid
};

/**
 * Converts an image path from the backend to a full URL.
 * - If the path is empty/null, returns the default image path
 * - If the path is already a full URL or data URI, returns as-is
 * - If the path starts with /uploads, prepends the backend URL
 * - Otherwise, returns as-is (for local assets like /default.jpg)
 */
export const getImageUrl = (path: string | undefined | null, defaultPath = '/default.jpg'): string => {
  if (!path) {
    return defaultPath;
  }

  // If it's already a data URI (base64) or full URL, return as-is
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If it's an uploads path, prepend backend URL
  if (path.startsWith('/uploads/')) {
    return `${BACKEND_URL}${path}`;
  }

  // Otherwise, return as-is (for local assets)
  return path;
};
