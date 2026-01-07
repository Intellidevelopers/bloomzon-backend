const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastname: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },

    // Profile Image Fields
  profileImage: {
    type: String,
    default: null  // URL or path to the profile image
  },
  profileImagePublicId: {
    type: String,
    default: null  // For cloud storage (e.g., Cloudinary public_id)
  },
  
  role: {
    type: String,
    enum: ['seller', 'admin', 'super_admin'],
    default: 'seller'
  },
  referredBy: {
    type: String,
    default: null
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true  // Allows null/undefined before generation
  },
  referralPaid: {
    type: Boolean,
    default: false
  },
  referrerAmountEarned: {
    type: Number,
    default: 0.00
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpire: {
    type: Date,
    default: null
  },
  verificationMethod: {
    type: String,
    enum: ['email', 'sms', 'bloomzonApp'],
    default: 'email'
  },
  otp: {
    type: String,
    default: null
  },
  otpExpire: {
    type: Date,
    default: null
  },
  resetPasswordOTP: {
    type: String,
    default: null
  },
  resetPasswordOTPExpire: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockUntil: {
    type: Date,
    default: null
  },
  adminLocked: {
    type: Boolean,
    default: false
  },
  adminBanned: {
    type: Boolean,
    default: false
  },
  isPinLockedOut: {
    type: Boolean,
    default: false
  },
  pin: {
    type: String,
    default: null
  },
  pin_attempts: {
    type: Number,
    default: 0
  },
  appActionToken: {
    type: String,
    default: null
  },
  appActionTokenExpire: {
    type: Date,
    default: null
  },
  changeEmail: {
    type: String,
    default: null
  },
  changePhone: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  lastActive: {
    type: Date,
    default: null
  },
  wallet: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
    // Store/Country Information
  storeCountry: {
    type: String,
    default: null,
    maxlength: 2 // ISO 3166-1 alpha-2 code
  },
  storeCountryName: {
    type: String,
    default: null
  },
  storeRegion: {
    type: String,
    default: null,
    enum: ['Americas', 'Europe', 'Asia', 'Africa', 'Oceania', null]
  },
  storeCurrency: {
    type: String,
    default: null
  },
  storeCurrencySymbol: {
    type: String,
    default: null
  },
}, {
  timestamps: true // Creates createdAt and updatedAt automatically
});

// Generate referral code and hash password before saving
userSchema.pre('save', async function() {
  // Only hash password if it's modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Generate unique referral code if not exists and is new user
  if (!this.referralCode && this.isNew) {
    // Get first 6 characters of firstname (lowercase, no spaces)
    const baseName = this.firstname
      .toLowerCase()
      .replace(/\s+/g, '')
      .substring(0, 6)
      .padEnd(6, 'x'); // Pad with 'x' if name is too short
    
    let referralCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Try to generate unique code
    while (!isUnique && attempts < maxAttempts) {
      attempts++;
      
      // Generate random 3-digit number (100-999)
      const randomNum = Math.floor(100 + Math.random() * 900);
      
      // Create referral code
      referralCode = `${baseName}${randomNum}`;
      
      // Check if referral code already exists
      const User = mongoose.model('User');
      const existingUser = await User.findOne({ referralCode });
      
      if (!existingUser) {
        isUnique = true;
      }
    }
    
    // Fallback: use timestamp if couldn't find unique code
    if (!isUnique) {
      const timestamp = Date.now().toString().slice(-4);
      referralCode = `${baseName}${timestamp}`;
    }
    
    this.referralCode = referralCode;
    console.log('🎫 Generated unique referral code:', referralCode);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  // Need to select password explicitly since it's not returned by default
  const user = await User.findById(this._id).select('+password');
  return await bcrypt.compare(candidatePassword, user.password);
};

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes
  
  // Check if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.isLocked = false;
    this.lockUntil = null;
    return await this.save();
  }
  
  // Increment attempts
  this.loginAttempts += 1;
  
  // Lock account if max attempts reached
  if (this.loginAttempts >= maxAttempts && !this.isLocked) {
    this.isLocked = true;
    this.lockUntil = new Date(Date.now() + lockTime);
  }
  
  return await this.save();
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.isLocked = false;
  this.lockUntil = null;
  return await this.save();
};

// Customize toJSON to remove sensitive fields
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  delete obj.password;
  delete obj.verificationToken;
  delete obj.resetPasswordToken;
  delete obj.otp;
  delete obj.appActionToken;
  delete obj.__v;
  
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;