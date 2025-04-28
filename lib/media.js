/**
 * Media handling utilities using Cloudinary
 */

/**
 * Get Cloudinary upload signature for authenticated uploads
 * This should be used client-side to securely upload directly to Cloudinary
 *
 * @returns {Object} Upload params including signature
 */
export function getCloudinaryUploadSignature() {
  // Note: In a real implementation, this should be a call to your backend API
  // which would generate the signature server-side for security

  // For now, we're returning placeholder values that the client code can use
  return {
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    timestamp: Math.round(new Date().getTime() / 1000),
    signature: "generated_signature_would_go_here",
    folder: "user_uploads",
  };
}

/**
 * Generate Cloudinary URL with transformations
 *
 * @param {string} publicId - Cloudinary public ID of the image
 * @param {Object} options - Transformation options
 * @returns {string} Transformed image URL
 */
export function getCloudinaryUrl(publicId, options = {}) {
  if (!publicId) return "";

  const {
    width,
    height,
    crop = "fill",
    gravity = "faces",
    quality = "auto",
    format = "auto",
  } = options;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  // Base URL
  let url = `https://res.cloudinary.com/${cloudName}/image/upload/`;

  // Add transformations
  const transformations = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (gravity) transformations.push(`g_${gravity}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);

  if (transformations.length > 0) {
    url += transformations.join(",") + "/";
  }

  // Add public ID
  url += publicId;

  return url;
}

/**
 * Get profile image URL with proper transformations
 *
 * @param {string} publicId - Cloudinary public ID or full URL
 * @param {string} size - Size of image (sm, md, lg)
 * @returns {string} Profile image URL
 */
export function getProfileImageUrl(publicId, size = "md") {
  if (!publicId) return "/images/default-avatar.png";

  // If it's already a full URL (e.g. from Firebase Storage), return as is
  if (publicId.startsWith("http")) {
    return publicId;
  }

  // Size mapping
  const dimensions = {
    sm: { width: 40, height: 40 },
    md: { width: 100, height: 100 },
    lg: { width: 200, height: 200 },
  };

  const { width, height } = dimensions[size] || dimensions.md;

  return getCloudinaryUrl(publicId, {
    width,
    height,
    crop: "fill",
    gravity: "faces",
  });
}

/**
 * Upload file to Cloudinary (for server-side uploads)
 * Note: In a real implementation, use the official Cloudinary SDK
 *
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} folder - Folder to upload to
 * @returns {Promise<Object>} Upload result with public ID and URL
 */
export async function uploadToCloudinary(fileBuffer, folder = "uploads") {
  // This is a mock implementation for the starter code
  // In a real implementation, use the Cloudinary SDK server-side

  console.log("[MEDIA] Simulating Cloudinary upload");

  // Return a mock response
  return {
    publicId: `${folder}/example_${Date.now()}`,
    url: "https://example.com/placeholder-image.jpg",
    secureUrl: "https://example.com/placeholder-image.jpg",
    format: "jpg",
    width: 500,
    height: 500,
  };
}
