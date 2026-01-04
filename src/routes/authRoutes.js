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
  selectCountryValidation  // Import this

} = require('../middlewares/validation');

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
router.post('/select-country', protect, selectCountryValidation, AuthController.selectCountry);  // Add this


module.exports = router;