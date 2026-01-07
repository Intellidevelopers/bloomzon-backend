const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const {
  signupValidation,
  loginValidation,
  verifyOTPValidation,
  resendOTPValidation,
  forgotPasswordValidation,
  verifyResetOTPValidation,
  resetPasswordValidation,
  selectCountryValidation
} = require('../middlewares/validation');

// Import the profile upload configuration from your existing cloudinary setup
const { uploadProfile } = require('../config/cloudinary');

// Public routes
router.post('/signup', signupValidation, AuthController.signup);
router.post('/login', loginValidation, AuthController.login);
router.post('/verify-otp', verifyOTPValidation, AuthController.verifyOTP);
router.post('/resend-otp', resendOTPValidation, AuthController.resendOTP);

// Password reset flow (3 steps)
router.post('/forgot-password', forgotPasswordValidation, AuthController.forgotPassword);
router.post('/verify-reset-otp', verifyResetOTPValidation, AuthController.verifyResetOTP);
router.post('/reset-password', resetPasswordValidation, AuthController.resetPassword);

// Protected routes
router.get('/me', protect, AuthController.getProfile);
router.post('/select-country', protect, selectCountryValidation, AuthController.selectCountry);

// Profile Image routes - using uploadProfile for profile images
router.post(
  '/upload-profile-image',
  protect,
  uploadProfile.single('profileImage'), // 'profileImage' is the field name in FormData
  AuthController.uploadProfileImage
);

router.delete(
  '/delete-profile-image',
  protect,
  AuthController.deleteProfileImage
);

module.exports = router;