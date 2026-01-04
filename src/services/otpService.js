const crypto = require('crypto');

class OTPService {
  /**
   * Generate a 6-digit OTP
   * @returns {string} 6-digit OTP
   */
  static generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔐 [OTP Service] Generated OTP:', otp);
    return otp;
  }

  /**
   * Generate OTP expiry time
   * @param {number} minutes - Number of minutes until expiry
   * @returns {Date} Expiry date
   */
  static generateOTPExpiry(minutes = 10) {
    const expiry = new Date(Date.now() + minutes * 60 * 1000);
    console.log(`⏰ [OTP Service] OTP will expire at: ${expiry.toISOString()}`);
    return expiry;
  }

  /**
   * Verify if OTP is still valid
   * @param {Date} otpExpire - OTP expiry date
   * @returns {boolean} True if valid, false if expired
   */
  static isOTPValid(otpExpire) {
    const isValid = otpExpire && new Date(otpExpire) > new Date();
    console.log(`✅ [OTP Service] OTP validity check: ${isValid ? 'VALID' : 'EXPIRED'}`);
    return isValid;
  }

  /**
   * Generate a secure token for password reset
   * @returns {string} Secure token
   */
  static generateResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    console.log('🔑 [OTP Service] Generated reset token');
    return token;
  }

  /**
   * Hash a token for storage
   * @param {string} token - Token to hash
   * @returns {string} Hashed token
   */
  static hashToken(token) {
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    console.log('🔒 [OTP Service] Token hashed for storage');
    return hashed;
  }

  /**
   * Generate token expiry time
   * @param {number} minutes - Number of minutes until expiry
   * @returns {Date} Expiry date
   */
  static generateTokenExpiry(minutes = 30) {
    const expiry = new Date(Date.now() + minutes * 60 * 1000);
    console.log(`⏰ [OTP Service] Token will expire at: ${expiry.toISOString()}`);
    return expiry;
  }
}

module.exports = OTPService;