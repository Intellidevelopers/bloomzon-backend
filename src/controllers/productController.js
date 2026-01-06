// controllers/productController.js
const {
  Product,
  ProductVariation,
  ProductImage,
  Category,
  Subcategory,
  DropdownData
} = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

// ============================================
// DROPDOWN DATA CONTROLLERS
// ============================================

const getDropdownData = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();

  const categoriesWithSubs = await Promise.all(
    categories.map(async (category) => {
      const subcategories = await Subcategory.find({
        categoryId: category._id,
        isActive: true
      }).sort({ order: 1 }).select('name slug').lean();

      return {
        id: category._id,
        name: category.name,
        slug: category.slug,
        subcategories
      };
    })
  );

  const dropdownTypes = [
    'productIdType', 'condition', 'closureType', 'outerMaterial',
    'style', 'gender', 'strapType', 'country', 'fulfillmentChannel'
  ];

  const dropdownData = {};
  for (const type of dropdownTypes) {
    dropdownData[type] = await DropdownData.find({ type, isActive: true })
      .sort({ order: 1 }).select('-__v -createdAt -updatedAt').lean();
  }

  res.status(200).json({
    success: true,
    data: {
      categories: categoriesWithSubs,
      productIdTypes: dropdownData.productIdType || [],
      conditions: dropdownData.condition || [],
      closureTypes: dropdownData.closureType || [],
      outerMaterials: dropdownData.outerMaterial || [],
      styles: dropdownData.style || [],
      genders: dropdownData.gender || [],
      strapTypes: dropdownData.strapType || [],
      countries: dropdownData.country || [],
      fulfillmentChannels: dropdownData.fulfillmentChannel || []
    }
  });
});

const addCategory = asyncHandler(async (req, res, next) => {
  const { name, description, subcategories } = req.body;
  if (!name) return next(new ErrorResponse('Category name is required', 400));

  const existingCategory = await Category.findOne({ name });
  if (existingCategory) return next(new ErrorResponse('Category already exists', 400));

  const category = await Category.create({
    name,
    description,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  });

  if (subcategories && Array.isArray(subcategories) && subcategories.length > 0) {
    const subcategoryDocs = subcategories.map((sub, index) => ({
      name: sub,
      slug: sub.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      categoryId: category._id,
      order: index + 1
    }));
    await Subcategory.insertMany(subcategoryDocs);
  }

  res.status(201).json({ success: true, message: 'Category created successfully', data: category });
});

const saveProductDetails = asyncHandler(async (req, res, next) => {
  const {
    productCategory, productSubCategory, productId, productIdType, productName,
    brandName, noBrand, modelNumber, closureType, outerMaterialType, style,
    gender, numberOfItems, strapType, bookingDate, shippingCountry
  } = req.body;

  if (!productCategory || !productSubCategory || !productName) {
    return next(new ErrorResponse('Product category, subcategory, and name are required', 400));
  }

  const generatedProductId = productId || `BL${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  const tempSellerSku = `${generatedProductId}-TEMP-${Date.now()}`;

  const product = await Product.create({
    productId: generatedProductId, productCategory, productSubCategory, productIdType,
    productName, brandName: noBrand ? null : brandName, noBrand, modelNumber, closureType,
    outerMaterialType, style, gender, numberOfItems: numberOfItems || 1, strapType,
    bookingDate, shippingCountry, sellerSku: tempSellerSku, sellerId: req.user._id,
    status: 'draft', currentStep: 1, condition: 'New', fulfillmentChannel: 'Bloomzon Pickup',
    pricing: { yourPrice: 0 }, quantity: 0, description: 'Pending'
  });

  res.status(201).json({
    success: true,
    message: 'Product details saved successfully',
    data: { id: product._id, productId: product.productId, productName: product.productName, currentStep: product.currentStep }
  });
});

const saveVariationTypes = asyncHandler(async (req, res, next) => {
  const { productId, variationTypes, colors, sizes, editions } = req.body;
  if (!productId) return next(new ErrorResponse('Product ID is required', 400));

  const product = await Product.findOne({ _id: productId, sellerId: req.user._id });
  if (!product) return next(new ErrorResponse('Product not found', 404));

  product.variationTypes = variationTypes || [];
  product.colors = variationTypes && variationTypes.includes('Color') ? colors : [];
  product.sizes = variationTypes && variationTypes.includes('Size') ? sizes : [];
  product.editions = variationTypes && variationTypes.includes('Edition') ? editions : [];
  product.currentStep = 2;
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Variation types saved successfully',
    data: {
      productId: product._id, variationTypes: product.variationTypes,
      colors: product.colors, sizes: product.sizes, editions: product.editions, currentStep: product.currentStep
    }
  });
});

const saveProductVariations = asyncHandler(async (req, res, next) => {
  const { productId, variations } = req.body;
  const parsedVariations = typeof variations === 'string' ? JSON.parse(variations) : variations;

  if (!productId || !parsedVariations || parsedVariations.length === 0) {
    return next(new ErrorResponse('Product ID and variations are required', 400));
  }

  const product = await Product.findOne({ _id: productId, sellerId: req.user._id });
  if (!product) return next(new ErrorResponse('Product not found', 404));

  // Delete old variations and their Cloudinary images
  const oldVariations = await ProductVariation.find({ productId: product._id });
  for (const variation of oldVariations) {
    if (variation.image) {
      const publicId = getPublicIdFromUrl(variation.image);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }
  }
  await ProductVariation.deleteMany({ productId: product._id });

  const variationDocs = parsedVariations.map((variation, index) => {
    const imageFile = req.files?.[index];

    return {
      productId: product._id,
      color: variation.color,
      size: variation.size,
      edition: variation.edition,
      sku: variation.sku || `${product.productId}-${variation.color || ''}-${variation.size || ''}`
        .toUpperCase()
        .replace(/\s/g, '-'),
      productIdValue: variation.productIdValue || variation.productId,
      productIdType: variation.productIdType,
      price: variation.price ? Number(variation.price) : null,
      quantity: variation.quantity ? Number(variation.quantity) : 0,
      condition: variation.condition,
      // Cloudinary stores the full URL in req.file.path
      image: imageFile ? imageFile.path : null,
    };
  });

  const createdVariations = await ProductVariation.insertMany(variationDocs);
  product.currentStep = 3;
  await product.save();

  res.status(200).json({
    success: true, 
    message: 'Product variations saved successfully',
    data: { 
      productId: product._id, 
      variations: createdVariations, 
      totalVariations: createdVariations.length, 
      currentStep: product.currentStep 
    }
  });
});

const saveProductOffers = asyncHandler(async (req, res, next) => {
  const { productId, sellerSku, yourPrice, listPrice, quantity, condition, countryOfRegion, maximumRetailPrice, fulfillmentChannel } = req.body;
  
  if (!productId || !sellerSku || !yourPrice || !quantity) {
    return next(new ErrorResponse('Product ID, seller SKU, price, and quantity are required', 400));
  }
  if (parseFloat(yourPrice) < 0 || parseFloat(listPrice || 0) < 0) {
    return next(new ErrorResponse('Prices must be positive values', 400));
  }
  if (parseInt(quantity) < 0) return next(new ErrorResponse('Quantity cannot be negative', 400));

  const product = await Product.findOne({ _id: productId, sellerId: req.user._id });
  if (!product) return next(new ErrorResponse('Product not found', 404));

  const existingSku = await Product.findOne({ sellerSku, _id: { $ne: product._id } });
  if (existingSku) return next(new ErrorResponse('Seller SKU already exists', 400));

  product.sellerSku = sellerSku;
  product.pricing = {
    yourPrice: parseFloat(yourPrice),
    listPrice: listPrice ? parseFloat(listPrice) : null,
    maximumRetailPrice: maximumRetailPrice ? parseFloat(maximumRetailPrice) : null
  };
  product.quantity = parseInt(quantity);
  product.condition = condition;
  product.countryOfRegion = countryOfRegion;
  product.fulfillmentChannel = fulfillmentChannel;
  product.currentStep = 4;
  await product.save();

  res.status(200).json({
    success: true, 
    message: 'Product offers saved successfully',
    data: {
      productId: product._id, 
      sellerSku: product.sellerSku, 
      pricing: product.pricing,
      quantity: product.quantity, 
      condition: product.condition, 
      fulfillmentChannel: product.fulfillmentChannel, 
      currentStep: product.currentStep
    }
  });
});

const uploadProductGallery = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  if (!productId) return next(new ErrorResponse('Product ID is required', 400));
  if (!req.files || req.files.length === 0) return next(new ErrorResponse('At least one image is required', 400));

  const product = await Product.findOne({ _id: productId, sellerId: req.user._id });
  if (!product) return next(new ErrorResponse('Product not found', 404));

  // Delete old images from Cloudinary
  const oldImages = await ProductImage.find({ productId: product._id });
  for (const image of oldImages) {
    if (image.cloudinaryId) {
      await deleteFromCloudinary(image.cloudinaryId);
    }
  }
  await ProductImage.deleteMany({ productId: product._id });

  // Save new images with Cloudinary URLs
  const imageDocs = req.files.map((file, index) => ({
    productId: product._id,
    url: file.path, // Cloudinary URL
    cloudinaryId: file.filename, // Cloudinary public_id
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    isPrimary: index === 0,
    order: index
  }));

  const createdImages = await ProductImage.insertMany(imageDocs);
  product.currentStep = 5;
  await product.save();

  res.status(200).json({
    success: true, 
    message: 'Product images uploaded successfully',
    data: { 
      productId: product._id, 
      images: createdImages, 
      totalImages: createdImages.length, 
      currentStep: product.currentStep 
    }
  });
});

const saveProductDescription = asyncHandler(async (req, res, next) => {
  const { productId, description, bulletPoints } = req.body;
  if (!productId || !description) return next(new ErrorResponse('Product ID and description are required', 400));

  const product = await Product.findOne({ _id: productId, sellerId: req.user._id });
  if (!product) return next(new ErrorResponse('Product not found', 404));

  const validBulletPoints = bulletPoints ? bulletPoints.filter(bp => bp && bp.trim() !== '') : [];
  product.description = description;
  product.bulletPoints = validBulletPoints;
  product.currentStep = 6;
  await product.save();

  res.status(200).json({
    success: true, 
    message: 'Product description saved successfully',
    data: { 
      productId: product._id, 
      description: product.description, 
      bulletPoints: product.bulletPoints, 
      currentStep: product.currentStep 
    }
  });
});

const saveProductKeywords = asyncHandler(async (req, res, next) => {
  const { productId, keywords } = req.body;
  if (!productId) return next(new ErrorResponse('Product ID is required', 400));

  const product = await Product.findOne({ _id: productId, sellerId: req.user._id });
  if (!product) return next(new ErrorResponse('Product not found', 404));

  const validKeywords = keywords ? [...new Set(keywords.filter(kw => kw && kw.trim() !== '').map(kw => kw.trim().toLowerCase()))] : [];
  product.keywords = validKeywords;
  product.status = 'active';
  product.currentStep = 7;
  product.completedAt = new Date();
  await product.save();

  res.status(200).json({
    success: true, 
    message: 'Product created successfully!',
    data: { 
      productId: product._id, 
      keywords: product.keywords, 
      status: product.status, 
      currentStep: product.currentStep, 
      completedAt: product.completedAt 
    }
  });
});

const completeProductCreation = asyncHandler(async (req, res, next) => {
  const productData = JSON.parse(req.body.productData || '{}');
  const { 
    productCategory, productSubCategory, productName, brandName, noBrand, modelNumber, closureType, outerMaterialType,
    style, gender, numberOfItems, strapType, bookingDate, shippingCountry, productIdType, variationTypes, colors, sizes,
    editions, variations, sellerSku, yourPrice, listPrice, quantity, condition, countryOfRegion, maximumRetailPrice,
    fulfillmentChannel, description, bulletPoints, keywords 
  } = productData;

  if (!productCategory || !productSubCategory || !productName || !sellerSku || !yourPrice || !quantity || !condition || !fulfillmentChannel || !description) {
    return next(new ErrorResponse('Missing required fields', 400));
  }

  const productId = `BL${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  const product = await Product.create({
    productId, productCategory, productSubCategory, productIdType, productName, brandName: noBrand ? null : brandName,
    noBrand, modelNumber, closureType, outerMaterialType, style, gender, numberOfItems: numberOfItems || 1, strapType,
    bookingDate, shippingCountry, variationTypes: variationTypes || [], colors: colors || [], sizes: sizes || [],
    editions: editions || [], sellerSku,
    pricing: {
      yourPrice: parseFloat(yourPrice), 
      listPrice: listPrice ? parseFloat(listPrice) : null,
      maximumRetailPrice: maximumRetailPrice ? parseFloat(maximumRetailPrice) : null
    },
    quantity: parseInt(quantity), condition, countryOfRegion, fulfillmentChannel, description, bulletPoints: bulletPoints || [],
    keywords: keywords || [], sellerId: req.user._id, status: 'active', currentStep: 7, completedAt: new Date()
  });

  // Handle Cloudinary image uploads
  if (req.files && req.files.length > 0) {
    const imageDocs = req.files.map((file, index) => ({
      productId: product._id,
      url: file.path, // Cloudinary URL
      cloudinaryId: file.filename, // Cloudinary public_id
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      isPrimary: index === 0,
      order: index
    }));
    await ProductImage.insertMany(imageDocs);
  }

  if (variations && Array.isArray(variations) && variations.length > 0) {
    const variationDocs = variations.map(variation => ({
      productId: product._id, 
      color: variation.color, 
      size: variation.size, 
      edition: variation.edition,
      sku: variation.sku || `${productId}-${variation.color || ''}-${variation.size || ''}`.toUpperCase().replace(/\s/g, '-'),
      productIdValue: variation.productIdValue, 
      productIdType: variation.productIdType,
      price: variation.price ? parseFloat(variation.price) : null,
      quantity: variation.quantity ? parseInt(variation.quantity) : 0,
      condition: variation.condition, 
      image: variation.image
    }));
    await ProductVariation.insertMany(variationDocs);
  }

  res.status(201).json({ 
    success: true, 
    message: 'Product created successfully!', 
    data: product 
  });
});


// controllers/productController.js - FIXED getAllProducts
const getAllProducts = asyncHandler(async (req, res, next) => {
  const { status, category, search, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
  
  // CRITICAL FIX: Always filter by the logged-in seller
  const query = {
    sellerId: req.user._id  // Only get products for this seller
  };
  
  if (status) query.status = status;
  if (category) query.productCategory = category;
  
  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { productId: { $regex: search, $options: 'i' } },
      { sellerSku: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;
  const sortOrder = order === 'desc' ? -1 : 1;
  const sortOptions = { [sortBy]: sortOrder };

  // Fetch products WITHOUT .lean() to enable virtuals
  const products = await Product.find(query)
    .sort(sortOptions)
    .limit(limitNum)
    .skip(skip)
    .populate('sellerId', 'name email')
    .populate({
      path: 'images',
      select: 'url cloudinaryId isPrimary order',
      options: { sort: { order: 1 } }
    })
    .select('-__v');

  // Convert to plain objects and add primaryImage field
  const productsWithImages = products.map(product => {
    const productObj = product.toObject();
    
    // Add primaryImage field (first image or primary marked image)
    if (productObj.images && productObj.images.length > 0) {
      const primaryImg = productObj.images.find(img => img.isPrimary) || productObj.images[0];
      productObj.primaryImage = primaryImg.url;
    } else {
      productObj.primaryImage = null;
    }
    
    return productObj;
  });

  const total = await Product.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      products: productsWithImages,
      pagination: {
        currentPage: pageNum, 
        totalPages: Math.ceil(total / limitNum), 
        totalProducts: total,
        limit: limitNum, 
        hasNext: pageNum < Math.ceil(total / limitNum), 
        hasPrev: pageNum > 1
      }
    }
  });
});

const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate('sellerId', 'name email').lean();
  if (!product) return next(new ErrorResponse('Product not found', 404));

  const variations = await ProductVariation.find({ productId: product._id }).lean();
  const images = await ProductImage.find({ productId: product._id }).sort({ order: 1 }).lean();
  await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

  res.status(200).json({ 
    success: true, 
    data: { ...product, variations, images } 
  });
});

const updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findOne({ _id: req.params.id, sellerId: req.user._id });
  if (!product) return next(new ErrorResponse('Product not found', 404));

  const allowedFields = ['productName', 'brandName', 'modelNumber', 'description', 'bulletPoints', 'keywords', 'quantity', 'pricing', 'status'];
  Object.keys(req.body).forEach(key => { 
    if (allowedFields.includes(key)) product[key] = req.body[key]; 
  });

  // Handle new Cloudinary image uploads
  if (req.files && req.files.length > 0) {
    const imageDocs = req.files.map((file, index) => ({
      productId: product._id,
      url: file.path, // Cloudinary URL
      cloudinaryId: file.filename, // Cloudinary public_id
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      isPrimary: index === 0,
      order: index
    }));
    await ProductImage.insertMany(imageDocs);
  }

  await product.save();
  res.status(200).json({ 
    success: true, 
    message: 'Product updated successfully', 
    data: product 
  });
});

const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({ _id: req.params.id, sellerId: req.user._id });
  if (!product) return next(new ErrorResponse('Product not found', 404));

  // Delete variations and their Cloudinary images
  const variations = await ProductVariation.find({ productId: product._id });
  for (const variation of variations) {
    if (variation.image) {
      const publicId = getPublicIdFromUrl(variation.image);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }
  }
  await ProductVariation.deleteMany({ productId: product._id });

  // Delete product images from Cloudinary
  const images = await ProductImage.find({ productId: product._id });
  for (const image of images) {
    if (image.cloudinaryId) {
      await deleteFromCloudinary(image.cloudinaryId);
    }
  }
  await ProductImage.deleteMany({ productId: product._id });

  await product.deleteOne();

  res.status(200).json({ 
    success: true, 
    message: 'Product deleted successfully', 
    data: {} 
  });
});

const updateProductStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  if (!['active', 'inactive', 'out_of_stock'].includes(status)) {
    return next(new ErrorResponse('Invalid status', 400));
  }

  const product = await Product.findOne({ _id: req.params.id, sellerId: req.user._id });
  if (!product) return next(new ErrorResponse('Product not found', 404));

  product.status = status;
  await product.save();

  res.status(200).json({ 
    success: true, 
    message: `Product status updated to ${status}`, 
    data: { id: product._id, status: product.status } 
  });
});

module.exports = {
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
};