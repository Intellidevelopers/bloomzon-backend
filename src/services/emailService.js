const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Check if nodemailer is properly loaded
    if (!nodemailer || typeof nodemailer.createTransport !== 'function') {
      console.error('❌ [Email Service] Nodemailer not properly installed');
      throw new Error('Nodemailer module not found. Run: npm install nodemailer');
    }
    
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    console.log('📧 [Email Service] Email transporter initialized');
  }

  /**
   * Send OTP email
   * @param {string} to - Recipient email
   * @param {string} firstname - User's first name
   * @param {string} otp - 6-digit OTP
   */
  async sendOTPEmail(to, firstname, otp) {
    console.log(`📤 [Email Service] Sending OTP to: ${to}`);
    
    const mailOptions = {
      from: `"Seller App" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: 'Verify Your Account - OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; }
            .otp-box { background-color: #fff; border: 2px dashed #4CAF50; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Account</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstname}!</h2>
              <p>Thank you for registering with Seller App. To complete your registration, please use the OTP code below:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              
              <p>This OTP will expire in <strong>10 minutes</strong>.</p>
              <p>If you didn't request this code, please ignore this email.</p>
              
              <p>Best regards,<br>The Seller App Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ [Email Service] OTP email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ [Email Service] Failed to send OTP email:', error.message);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send password reset OTP email
   * @param {string} to - Recipient email
   * @param {string} firstname - User's first name
   * @param {string} otp - 6-digit OTP
   */
  async sendPasswordResetOTP(to, firstname, otp) {
    console.log(`📤 [Email Service] Sending password reset OTP to: ${to}`);
    
    const mailOptions = {
      from: `"Seller App" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: 'Password Reset - OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF5722; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; }
            .otp-box { background-color: #fff; border: 2px dashed #FF5722; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #FF5722; letter-spacing: 5px; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstname}!</h2>
              <p>We received a request to reset your password. Please use the OTP code below to proceed:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              
              <p>This OTP will expire in <strong>10 minutes</strong>.</p>
              
              <div class="warning">
                <strong>⚠️ Security Alert:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
              </div>
              
              <p>Best regards,<br>The Seller App Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ [Email Service] Password reset OTP sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ [Email Service] Failed to send password reset OTP:', error.message);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send password changed confirmation email
   * @param {string} to - Recipient email
   * @param {string} firstname - User's first name
   */
  async sendPasswordChangedEmail(to, firstname) {
    console.log(`📤 [Email Service] Sending password changed confirmation to: ${to}`);
    
    const mailOptions = {
      from: `"Seller App" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: 'Password Successfully Changed',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
            .warning { background-color: #ffebee; border-left: 4px solid #f44336; padding: 12px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Changed</h1>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              <h2>Hello ${firstname}!</h2>
              <p>Your password has been successfully changed.</p>
              
              <p>If you made this change, no further action is required.</p>
              
              <div class="warning">
                <strong>⚠️ Didn't make this change?</strong><br>
                If you did not change your password, please contact our support team immediately at support@sellerapp.com
              </div>
              
              <p>For your security, we recommend:</p>
              <ul>
                <li>Using a strong, unique password</li>
                <li>Not sharing your password with anyone</li>
                <li>Changing your password regularly</li>
              </ul>
              
              <p>Best regards,<br>The Seller App Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ [Email Service] Password changed confirmation sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ [Email Service] Failed to send password changed email:', error.message);
      // Don't throw error for confirmation email, it's not critical
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email after verification
   * @param {string} to - Recipient email
   * @param {string} firstname - User's first name
   */
  async sendWelcomeEmail(to, firstname) {
    console.log(`📤 [Email Service] Sending welcome email to: ${to}`);
    
    const mailOptions = {
      from: `"Seller App" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: 'Welcome to Seller App!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Seller App!</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstname}!</h2>
              <p>Your account has been successfully verified. Welcome to our seller community!</p>
              
              <p>You can now:</p>
              <ul>
                <li>List your products</li>
                <li>Manage your inventory</li>
                <li>Track your sales</li>
                <li>Communicate with customers</li>
              </ul>
              
              <p>If you have any questions, feel free to reach out to our support team.</p>
              
              <p>Happy selling!<br>The Seller App Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ [Email Service] Welcome email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ [Email Service] Failed to send welcome email:', error.message);
      // Don't throw error for welcome email, it's not critical
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();