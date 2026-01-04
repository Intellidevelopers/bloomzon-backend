const express = require('express');
const router = express.Router();
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
  updateProductStatus,
} = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../config/multerConfig');

// ============================================
// DROPDOWN DATA ROUTES
// ============================================

/**
 * @route   GET /api/v1/products/dropdown-data
 * @desc    Get all dropdown data for product forms
 * @access  Public
 */
router.get('/dropdown-data', getDropdownData);

/**
 * @route   POST /api/v1/products/dropdown-data/category
 * @desc    Add new category (Admin only)
 * @access  Private/Admin
 */
router.post('/dropdown-data/category', protect, addCategory);

// ============================================
// PRODUCT CREATION STEPS
// ============================================

/**
 * @route   POST /api/v1/products/step1/details
 * @desc    Save product details (Step 1)
 * @access  Private
 */
router.post('/step1/details', protect, saveProductDetails);

/**
 * @route   POST /api/v1/products/step2/variation-types
 * @desc    Save variation types (Step 2)
 * @access  Private
 */
router.post('/step2/variation-types', protect, saveVariationTypes);

/**
 * @route   POST /api/v1/products/step3/variations
 * @desc    Save product variations with images (Step 3)
 * @access  Private
 */
router.post('/step3/variations', protect, upload.array('variationImages', 20), saveProductVariations);

/**
 * @route   POST /api/v1/products/step4/offers
 * @desc    Save product offers and pricing (Step 4)
 * @access  Private
 */
router.post('/step4/offers', protect, saveProductOffers);

/**
 * @route   POST /api/v1/products/step5/gallery
 * @desc    Upload product images (Step 5)
 * @access  Private
 */
router.post('/step5/gallery', protect, upload.array('productImages', 10), uploadProductGallery);

/**
 * @route   POST /api/v1/products/step6/description
 * @desc    Save product description (Step 6)
 * @access  Private
 */
router.post('/step6/description', protect, saveProductDescription);

/**
 * @route   POST /api/v1/products/step7/keywords
 * @desc    Save keywords and complete product (Step 7)
 * @access  Private
 */
router.post('/step7/keywords', protect, saveProductKeywords);

/**
 * @route   POST /api/v1/products/complete
 * @desc    Complete product creation (all steps at once)
 * @access  Private
 */
router.post('/complete', protect, upload.array('images', 15), completeProductCreation);

// ============================================
// PRODUCT CRUD OPERATIONS
// ============================================

/**
 * @route   GET /api/v1/products
 * @desc    Get all products with filters
 * @access  Public
 */
router.get('/', getAllProducts);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/:id', getProductById);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private
 */
router.put('/:id', protect, upload.array('newImages', 10), updateProduct);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product
 * @access  Private
 */
router.delete('/:id', protect, deleteProduct);

/**
 * @route   PATCH /api/v1/products/:id/status
 * @desc    Update product status
 * @access  Private
 */
router.patch('/:id/status', protect, updateProductStatus);

module.exports = router;