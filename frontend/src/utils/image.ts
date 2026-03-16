export const MIN_IMAGE_SIZE = 1024; // 1KB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

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
