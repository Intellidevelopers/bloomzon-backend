// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary'); // Updated import
const { protect } = require('../middlewares/authMiddleware');
const {
  getDropdownData,
  addCategory,
  saveProductDetails,
  saveVariationTypes,
  saveProductVariations,
  saveProductOffers,
  uploadProductGallery,
  saveProductDescription,
  saveProductKeywords,
  completeProductCreation,
  getProductById,
  getAllProducts,
  updateProduct,
  deleteProduct,
  updateProductStatus
} = require('../controllers/productController');

// ============================================
// PUBLIC ROUTES
// ============================================
router.get('/dropdown-data', getDropdownData);
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// ============================================
// PROTECTED ROUTES (Requires Authentication)
// ============================================

// Category management (Admin only - add protect middleware if needed)
router.post('/categories', protect, addCategory);

// Step-by-step product creation
router.post('/step1/details', protect, saveProductDetails);
router.post('/step2/variation-types', protect, saveVariationTypes);
router.post('/step3/variations', protect, upload.array('images', 10), saveProductVariations);
router.post('/step4/offers', protect, saveProductOffers);
router.post('/step5/gallery', protect, upload.array('images', 6), uploadProductGallery);
router.post('/step6/description', protect, saveProductDescription);
router.post('/step7/keywords', protect, saveProductKeywords);

// Complete product creation in one step
router.post('/complete', protect, upload.array('images', 10), completeProductCreation);

// Product management
router.put('/:id', protect, upload.array('images', 10), updateProduct);
router.delete('/:id', protect, deleteProduct);
router.patch('/:id/status', protect, updateProductStatus);

module.exports = router;