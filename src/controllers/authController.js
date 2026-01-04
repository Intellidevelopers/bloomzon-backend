const User = require('../models/User');
const jwt = require('jsonwebtoken');
const OTPService = require('../services/otpService');
const emailService = require('../services/emailService');

class AuthController {
  /**
   * Register a new seller
   * POST /api/v1/auth/signup
   */
  static async signup(req, res) {
    console.log('\n========== SIGNUP REQUEST ==========');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const { firstname, lastname, email, phone, password, referredBy } = req.body;

      // Check if user already exists
      console.log('🔍 Checking if user exists with email:', email);
      const existingUser = await User.findOne({ email: email.toLowerCase() });

      if (existingUser) {
        console.log('❌ User already exists with email:', email);
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Check if phone already exists
      console.log('🔍 Checking if phone number exists:', phone);
      const existingPhone = await User.findOne({ phone });

      if (existingPhone) {
        console.log('❌ User already exists with phone:', phone);
        return res.status(400).json({
          success: false,
          message: 'User with this phone number already exists'
        });
      }

      // Verify referral code if provided
      if (referredBy) {
        console.log('🔍 Verifying referral code:', referredBy);
        const referrer = await User.findOne({ referralCode: referredBy });

        if (!referrer) {
          console.log('❌ Invalid referral code:', referredBy);
          return res.status(400).json({
            success: false,
            message: 'Invalid referral code'
          });
        }
        console.log('✅ Valid referral code from user:', referrer.email);
      }

      // Generate OTP
      const otp = OTPService.generateOTP();
      const otpExpire = OTPService.generateOTPExpiry(10); // 10 minutes

      console.log('🔐 Generated OTP:', otp);
      console.log('⏰ OTP expires at:', otpExpire);

      // Create user
      console.log('👤 Creating new user...');
      const user = await User.create({
        firstname,
        lastname,
        email: email.toLowerCase(),
        phone,
        password,
        role: 'seller',
        referredBy: referredBy || null,
        otp,
        otpExpire,
        verificationMethod: 'email'
      });

      console.log('✅ User created successfully with ID:', user._id);
      console.log('📧 User email:', user.email);
      console.log('🎫 Referral code generated:', user.referralCode);

      // Send OTP email
      try {
        console.log('📨 Attempting to send OTP email...');
        await emailService.sendOTPEmail(user.email, user.firstname, otp);
        console.log('✅ OTP email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send OTP email:', emailError.message);
        // Continue even if email fails - user can request resend
      }

      console.log('========== SIGNUP SUCCESS ==========\n');

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your account with the OTP sent to your email.',
        data: {
          user: {
            id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
            role: user.role,
            referralCode: user.referralCode,
            isVerified: user.isVerified
          }
        }
      });

    } catch (error) {
      console.error('❌ SIGNUP ERROR:', error);
      console.error('Error stack:', error.stack);
      
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists`
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Verify OTP
   * POST /api/v1/auth/verify-otp
   */
  static async verifyOTP(req, res) {
    console.log('\n========== VERIFY OTP REQUEST ==========');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const { email, otp } = req.body;

      console.log('🔍 Finding user with email:', email);
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        console.log('❌ User not found');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('✅ User found:', user.email);

      // Check if already verified
      if (user.isVerified) {
        console.log('ℹ️ User already verified');
        return res.status(400).json({
          success: false,
          message: 'Account is already verified'
        });
      }

      // Check OTP
      console.log('🔍 Comparing OTP - Provided:', otp, 'Stored:', user.otp);
      if (user.otp !== otp) {
        console.log('❌ Invalid OTP');
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      // Check OTP expiry
      console.log('⏰ Checking OTP expiry:', user.otpExpire);
      if (!OTPService.isOTPValid(user.otpExpire)) {
        console.log('❌ OTP has expired');
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new one.'
        });
      }

      // Verify user
      console.log('✅ OTP is valid. Verifying user...');
      user.isVerified = true;
      user.otp = null;
      user.otpExpire = null;
      await user.save();

      // Send welcome email
      try {
        console.log('📨 Sending welcome email...');
        await emailService.sendWelcomeEmail(user.email, user.firstname);
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError.message);
        // Continue even if email fails
      }

      // Generate JWT token
      console.log('🔑 Generating JWT token...');
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      console.log('========== VERIFY OTP SUCCESS ==========\n');

      res.status(200).json({
        success: true,
        message: 'Account verified successfully',
        data: {
          user: user.toJSON(),
          token
        }
      });

    } catch (error) {
      console.error('❌ VERIFY OTP ERROR:', error);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Verification failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Resend OTP
   * POST /api/v1/auth/resend-otp
   */
  static async resendOTP(req, res) {
    console.log('\n========== RESEND OTP REQUEST ==========');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const { email } = req.body;

      console.log('🔍 Finding user with email:', email);
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        console.log('❌ User not found');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.isVerified) {
        console.log('ℹ️ User already verified');
        return res.status(400).json({
          success: false,
          message: 'Account is already verified'
        });
      }

      // Generate new OTP
      const otp = OTPService.generateOTP();
      const otpExpire = OTPService.generateOTPExpiry(10);

      console.log('🔐 Generated new OTP:', otp);

      // Update user with new OTP
      user.otp = otp;
      user.otpExpire = otpExpire;
      await user.save();

      // Send OTP email
      try {
        console.log('📨 Sending OTP email...');
        await emailService.sendOTPEmail(user.email, user.firstname, otp);
        console.log('✅ OTP email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send OTP email:', emailError.message);
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP email. Please try again.'
        });
      }

      console.log('========== RESEND OTP SUCCESS ==========\n');

      res.status(200).json({
        success: true,
        message: 'OTP has been resent to your email'
      });

    } catch (error) {
      console.error('❌ RESEND OTP ERROR:', error);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Failed to resend OTP',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  static async login(req, res) {
    console.log('\n========== LOGIN REQUEST ==========');
    console.log('📝 Request body:', JSON.stringify({ ...req.body, password: '***' }, null, 2));
    
    try {
      const { identifier, password } = req.body; // identifier can be email or phone

      console.log('🔍 Looking for user with identifier:', identifier);

      // Find user by email or phone - must select password explicitly
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { phone: identifier }
        ]
      }).select('+password');

      if (!user) {
        console.log('❌ User not found');
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      console.log('✅ User found:', user.email);

      // Check if account is locked
      if (user.isLocked || user.adminLocked) {
        console.log('🔒 Account is locked');
        
        if (user.lockUntil && user.lockUntil < Date.now()) {
          // Lock expired, unlock account
          console.log('🔓 Lock expired, unlocking account');
          await user.resetLoginAttempts();
        } else {
          const lockReason = user.adminLocked ? 'administratively' : 'temporarily due to too many failed login attempts';
          return res.status(403).json({
            success: false,
            message: `Account is locked ${lockReason}. Please contact support or try again later.`
          });
        }
      }

      // Check if account is banned
      if (user.adminBanned) {
        console.log('🚫 Account is banned');
        return res.status(403).json({
          success: false,
          message: 'Account has been banned. Please contact support.'
        });
      }

      // Verify password
      console.log('🔐 Verifying password...');
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        console.log('❌ Invalid password');
        await user.incrementLoginAttempts();
        
        const attemptsLeft = 5 - user.loginAttempts;
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0
        });
      }

      console.log('✅ Password valid');

      // Check if verified
      if (!user.isVerified) {
        console.log('⚠️ User not verified');
        return res.status(403).json({
          success: false,
          message: 'Please verify your account first. Check your email for the OTP.',
          requiresVerification: true
        });
      }

      // Reset login attempts
      await user.resetLoginAttempts();

      // Update last login and last active
      user.lastLogin = new Date();
      user.lastActive = new Date();
      await user.save();

      // Generate JWT token
      console.log('🔑 Generating JWT token...');
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      console.log('========== LOGIN SUCCESS ==========\n');

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          token
        }
      });

    } catch (error) {
      console.error('❌ LOGIN ERROR:', error);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Forgot password - Request OTP
   * POST /api/v1/auth/forgot-password
   */
  static async forgotPassword(req, res) {
    console.log('\n========== FORGOT PASSWORD REQUEST ==========');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const { email } = req.body;

      console.log('🔍 Finding user with email:', email);
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        console.log('❌ User not found');
        // Return success anyway to prevent email enumeration
        return res.status(200).json({
          success: true,
          message: 'If an account with that email exists, a password reset OTP has been sent.'
        });
      }

      console.log('✅ User found:', user.email);

      // Generate OTP for password reset
      const otp = OTPService.generateOTP();
      const otpExpire = OTPService.generateOTPExpiry(10); // 10 minutes

      console.log('🔐 Generated password reset OTP:', otp);

      // Save OTP to database
      user.resetPasswordOTP = otp;
      user.resetPasswordOTPExpire = otpExpire;
      await user.save();

      // Send OTP email
      try {
        console.log('📨 Sending password reset OTP email...');
        await emailService.sendPasswordResetOTP(user.email, user.firstname, otp);
        console.log('✅ Password reset OTP sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send password reset OTP:', emailError.message);
        // Clear OTP if email fails
        user.resetPasswordOTP = null;
        user.resetPasswordOTPExpire = null;
        await user.save();
        
        return res.status(500).json({
          success: false,
          message: 'Failed to send password reset OTP. Please try again.'
        });
      }

      console.log('========== FORGOT PASSWORD SUCCESS ==========\n');

      res.status(200).json({
        success: true,
        message: 'Password reset OTP has been sent to your email'
      });

    } catch (error) {
      console.error('❌ FORGOT PASSWORD ERROR:', error);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Verify password reset OTP
   * POST /api/v1/auth/verify-reset-otp
   */
  static async verifyResetOTP(req, res) {
    console.log('\n========== VERIFY RESET OTP REQUEST ==========');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      const { email, otp } = req.body;

      console.log('🔍 Finding user with email:', email);
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        console.log('❌ User not found');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('✅ User found:', user.email);

      // Check if OTP exists
      if (!user.resetPasswordOTP) {
        console.log('❌ No reset OTP found');
        return res.status(400).json({
          success: false,
          message: 'Please request a password reset first'
        });
      }

      // Check OTP
      console.log('🔍 Comparing OTP - Provided:', otp, 'Stored:', user.resetPasswordOTP);
      if (user.resetPasswordOTP !== otp) {
        console.log('❌ Invalid OTP');
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      // Check OTP expiry
      console.log('⏰ Checking OTP expiry:', user.resetPasswordOTPExpire);
      if (!OTPService.isOTPValid(user.resetPasswordOTPExpire)) {
        console.log('❌ OTP has expired');
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new one.'
        });
      }

      console.log('✅ OTP is valid');
      console.log('========== VERIFY RESET OTP SUCCESS ==========\n');

      // OTP is valid - return success (don't clear OTP yet, wait for password reset)
      res.status(200).json({
        success: true,
        message: 'OTP verified successfully. You can now reset your password.'
      });

    } catch (error) {
      console.error('❌ VERIFY RESET OTP ERROR:', error);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'OTP verification failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Reset password with OTP
   * POST /api/v1/auth/reset-password
   */
    static async resetPassword(req, res) {
        console.log('\n========== RESET PASSWORD REQUEST ==========');
        console.log('📝 Request body:', JSON.stringify({ ...req.body, password: '***' }, null, 2));
        
        try {
        const { email, password } = req.body;

        console.log('🔍 Finding user with email:', email);
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log('❌ User not found');
            return res.status(404).json({
            success: false,
            message: 'User not found'
            });
        }

        console.log('✅ User found:', user.email);

        // Check if OTP was verified (OTP should still exist and be valid)
        if (!user.resetPasswordOTP) {
            console.log('❌ No verified reset OTP found');
            return res.status(400).json({
            success: false,
            message: 'Please verify your OTP first'
            });
        }

        // Check OTP expiry
        console.log('⏰ Checking OTP expiry:', user.resetPasswordOTPExpire);
        if (!OTPService.isOTPValid(user.resetPasswordOTPExpire)) {
            console.log('❌ OTP has expired');
            return res.status(400).json({
            success: false,
            message: 'OTP has expired. Please request a new one.'
            });
        }

        // Update password
        console.log('🔐 Updating password...');
        user.password = password; // Will be hashed by the pre-save hook
        user.resetPasswordOTP = null;
        user.resetPasswordOTPExpire = null;
        await user.save();

        console.log('✅ Password updated successfully');

        // Send password changed confirmation email
        try {
            console.log('📨 Sending password changed confirmation...');
            await emailService.sendPasswordChangedEmail(user.email, user.firstname);
        } catch (emailError) {
            console.error('❌ Failed to send confirmation email:', emailError.message);
            // Continue even if email fails
        }

        console.log('========== RESET PASSWORD SUCCESS ==========\n');

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. You can now login with your new password.'
        });

        } catch (error) {
        console.error('❌ RESET PASSWORD ERROR:', error);
        console.error('Error stack:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
        }
    }


  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  static async getProfile(req, res) {
    console.log('\n========== GET PROFILE REQUEST ==========');
    console.log('👤 User ID:', req.user.id);
    
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        console.log('❌ User not found');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update last active
      user.lastActive = new Date();
      await user.save();

      console.log('✅ Profile retrieved for:', user.email);
      console.log('========== GET PROFILE SUCCESS ==========\n');

      res.status(200).json({
        success: true,
        data: {
          user: user.toJSON()
        }
      });

    } catch (error) {
      console.error('❌ GET PROFILE ERROR:', error);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Add this method to your AuthController class in src/controllers/authController.js

  /**
   * Select store country (after verification)
   * POST /api/v1/auth/select-country
   */
  static async selectCountry(req, res) {
    console.log('\n========== SELECT COUNTRY REQUEST ==========');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User ID:', req.user.id);
    
    try {
      const { countryCode } = req.body;

      console.log('🔍 Finding user...');
      const user = await User.findById(req.user.id);

      if (!user) {
        console.log('❌ User not found');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('✅ User found:', user.email);

      // Check if user is verified
      if (!user.isVerified) {
        console.log('❌ User not verified');
        return res.status(403).json({
          success: false,
          message: 'Please verify your account first'
        });
      }

      // Check if country already selected
      if (user.storeCountry) {
        console.log('⚠️ Country already selected:', user.storeCountry);
        return res.status(400).json({
          success: false,
          message: 'Store country already selected. Contact support to change it.'
        });
      }

      // Validate country code
      const CountryService = require('../data/countries');
      const country = CountryService.getCountryByCode(countryCode);

      if (!country) {
        console.log('❌ Invalid country code:', countryCode);
        return res.status(400).json({
          success: false,
          message: 'Invalid country code'
        });
      }

      console.log('✅ Valid country:', country.name);

      // Update user with country information
      user.storeCountry = countryCode;
      user.storeCountryName = country.name;
      user.storeRegion = country.region;
      user.storeCurrency = country.currency;
      user.storeCurrencySymbol = country.currencySymbol;
      await user.save();

      console.log('✅ Country updated successfully');

      // Send welcome email now that setup is complete
      try {
        console.log('📨 Sending welcome email...');
        await emailService.sendWelcomeEmail(user.email, user.firstname);
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError.message);
        // Continue even if email fails
      }

      console.log('========== SELECT COUNTRY SUCCESS ==========\n');

      res.status(200).json({
        success: true,
        message: 'Store country selected successfully',
        data: {
          user: user.toJSON()
        }
      });

    } catch (error) {
      console.error('❌ SELECT COUNTRY ERROR:', error);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Failed to select country',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = AuthController;