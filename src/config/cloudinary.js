// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for Products
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bloomzon/products', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // Optional: resize images
    public_id: (req, file) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `product-${uniqueSuffix}`;
    },
  },
});

// Configure Cloudinary storage for Profile Images
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'bloomzon/profiles', // Separate folder for profile images
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 500, height: 500, crop: 'limit' }, // Smaller size for profiles
      { quality: 'auto' } // Auto quality optimization
    ],
    public_id: (req, file) => {
      // Generate unique filename with user ID
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `profile-${req.user.id}-${uniqueSuffix}`;
    },
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = filetypes.test(file.mimetype);
  
  if (mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed! (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer for Products with Cloudinary storage
const upload = multer({
  storage: productStorage,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter,
});

// Configure multer for Profile Images with Cloudinary storage
const uploadProfile = multer({
  storage: profileStorage,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter,
});

// Helper function to delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('🗑️ Deleted from Cloudinary:', publicId, result);
    return result;
  } catch (error) {
    console.error('❌ Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/bloomzon/products/product-123456.jpg
  // Extract: bloomzon/products/product-123456
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex !== -1 && parts.length > uploadIndex + 1) {
    // Get everything after 'upload/v123456789/' and remove file extension
    const pathParts = parts.slice(uploadIndex + 2);
    return pathParts.join('/').replace(/\.[^/.]+$/, '');
  }
  return null;
};

module.exports = {
  upload,              // For products (existing)
  uploadProfile,       // For profile images (new)
  cloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
};