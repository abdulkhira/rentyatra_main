const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

// Load environment variables
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter
   */
  initializeTransporter() {
    try {
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      };

      // Validate configuration
      if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
        logger.warn('SMTP not configured. Email functionality will be disabled.');
        return;
      }

      this.transporter = nodemailer.createTransport(smtpConfig);
      this.isConfigured = true;

      // Verify connection
      this.verifyConnection();

      logger.info('SMTP Email service initialized successfully', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        user: smtpConfig.auth.user
      });

    } catch (error) {
      logger.error('Failed to initialize SMTP transporter:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    if (!this.transporter) return false;

    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  /**
   * Check if email service is configured
   */
  isEmailConfigured() {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Send email
   * @param {Object} emailData - Email data
   * @param {string} emailData.to - Recipient email
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.html - HTML content
   * @param {string} emailData.text - Plain text content
   * @param {Array} emailData.attachments - Email attachments
   * @param {string} emailData.from - Sender email (optional)
   * @returns {Promise<Object>} - Response object
   */
  async sendEmail(emailData) {
    if (!this.isEmailConfigured()) {
      logger.warn('Email service not configured. Skipping email send.');
      return {
        success: false,
        message: 'Email service not configured',
        error: 'SMTP not configured'
      };
    }

    try {
      const {
        to,
        subject,
        html,
        text,
        attachments = [],
        from = process.env.SMTP_USER
      } = emailData;

      // Validate required fields
      if (!to || !subject || (!html && !text)) {
        throw new Error('Missing required email fields: to, subject, and content');
      }

      const mailOptions = {
        from: `RentYatra <${from}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        html: html,
        text: text,
        attachments: attachments
      };

      logger.info('Sending email', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: mailOptions.from
      });

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        messageId: result.messageId,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      return {
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      };

    } catch (error) {
      logger.error('Failed to send email:', error);
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message
      };
    }
  }

  /**
   * Send subscription purchase confirmation email
   */
  async sendSubscriptionConfirmation(subscriptionData, planData, userData) {
    const { subscriptionId, amount, startDate, endDate } = subscriptionData;
    const { name: planName, benefits, features } = planData;
    const { name: userName, email } = userData;

    const subject = `Subscription Confirmation - ${planName} | RentYatra`;
    
    // Generate benefits HTML
    const benefitsHtml = this.generateBenefitsHtml(benefits, features);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Subscription Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; }
          .section { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .amount { font-size: 28px; font-weight: bold; color: #059669; }
          .subscription-details { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin: 20px 0; }
          .benefit-item { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #3B82F6; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .cta-button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Subscription Successful!</h1>
            <p>Welcome to RentYatra's ${planName}</p>
            <p style="font-size: 18px; margin: 10px 0;">Your subscription is now active</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Thank you for choosing RentYatra! We're excited to confirm that your subscription has been successfully activated.</p>
            
            <div class="subscription-details">
              <h3>📋 Subscription Details</h3>
              <p><strong>Plan:</strong> ${planName}</p>
              <p><strong>Amount Paid:</strong> <span class="amount">₹${amount.toLocaleString()}</span></p>
              <p><strong>Subscription ID:</strong> ${subscriptionId}</p>
              <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString('en-IN')}</p>
              <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString('en-IN')}</p>
              <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Active</span></p>
            </div>

            <div class="section">
              <h3>✨ Your Subscription Benefits & Features</h3>
              ${benefitsHtml}
            </div>

            <div class="highlight">
              <h4>📞 How to Use Your Subscription</h4>
              <ul>
                <li><strong>Premium Features:</strong> Access to all premium features</li>
                <li><strong>Priority Support:</strong> Get priority customer support</li>
                <li><strong>Enhanced Visibility:</strong> Your listings get better visibility</li>
                <li><strong>Dashboard Access:</strong> Manage your account from the dashboard</li>
              </ul>
            </div>


            <p>Thank you for trusting RentYatra! We look forward to providing you with excellent service!</p>
          </div>
          
          <div class="footer">
            <p><strong>Best regards,<br>The RentYatra Team</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For support, contact us at support@rentyatra.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Subscription Confirmation - ${planName} | RentYatra
      
      Hello ${userName},
      
      Thank you for choosing RentYatra! Your subscription has been successfully activated.
      
      SUBSCRIPTION DETAILS:
      - Plan: ${planName}
      - Amount Paid: ₹${amount.toLocaleString()}
      - Subscription ID: ${subscriptionId}
      - Start Date: ${new Date(startDate).toLocaleDateString('en-IN')}
      - End Date: ${new Date(endDate).toLocaleDateString('en-IN')}
      - Status: Active
      
      YOUR SUBSCRIPTION BENEFITS:
      ${this.generateBenefitsText(benefits, features)}
      
      HOW TO USE YOUR SUBSCRIPTION:
      - Premium Features: Access to all premium features
      - Priority Support: Get priority customer support
      - Enhanced Visibility: Your listings get better visibility
      - Dashboard Access: Manage your account from the dashboard
      
      Thank you for trusting RentYatra!
      
      Best regards,
      The RentYatra Team
    `;

    return await this.sendEmail({
      to: email,
      subject: subject,
      html: html,
      text: text
    });
  }

  /**
   * Send boost plan purchase confirmation email
   */
  async sendBoostConfirmation(boostData, packageData, userData) {
    const { boostId, amount, duration, startDate, endDate } = boostData;
    const { name: packageName, features } = packageData;
    const { name: userName, email } = userData;

    const subject = `Boost Plan Confirmation - ${packageName} | RentYatra`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boost Plan Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; }
          .section { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .amount { font-size: 28px; font-weight: bold; color: #059669; }
          .boost-details { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin: 20px 0; }
          .feature-item { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .cta-button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Boost Plan Activated!</h1>
            <p>Your ${packageName} boost is now live</p>
            <p style="font-size: 18px; margin: 10px 0;">Enhanced visibility for your listings</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Congratulations! Your boost plan has been successfully activated and your listings will now get enhanced visibility.</p>
            
            <div class="boost-details">
              <h3>📈 Boost Details</h3>
              <p><strong>Package:</strong> ${packageName}</p>
              <p><strong>Amount Paid:</strong> <span class="amount">₹${amount.toLocaleString()}</span></p>
              <p><strong>Boost ID:</strong> ${boostId}</p>
              <p><strong>Duration:</strong> ${duration} days</p>
              <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString('en-IN')}</p>
              <p><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString('en-IN')}</p>
              <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Active</span></p>
            </div>

            <div class="section">
              <h3>✨ Boost Features</h3>
              <div class="features-grid">
                ${features && features.length > 0 ? features.map(feature => `
                  <div class="feature-item">
                    <h4 style="margin: 0 0 8px 0; color: #065f46;">${feature.title}</h4>
                    <p style="margin: 0; color: #4b5563;">${feature.description}</p>
                  </div>
                `).join('') : `
                  <div class="feature-item">
                    <h4 style="margin: 0 0 8px 0; color: #065f46;">🎯 Enhanced Visibility</h4>
                    <p style="margin: 0; color: #4b5563;">Your listings appear at the top of search results</p>
                  </div>
                  <div class="feature-item">
                    <h4 style="margin: 0 0 8px 0; color: #065f46;">📊 Priority Placement</h4>
                    <p style="margin: 0; color: #4b5563;">Get featured in premium sections</p>
                  </div>
                  <div class="feature-item">
                    <h4 style="margin: 0 0 8px 0; color: #065f46;">👁️ Increased Views</h4>
                    <p style="margin: 0; color: #4b5563;">More potential customers will see your listings</p>
                  </div>
                `}
              </div>
            </div>

            <div class="highlight">
              <h4>📈 What This Means for You</h4>
              <ul>
                <li><strong>Better Visibility:</strong> Your listings will appear prominently in search results</li>
                <li><strong>More Inquiries:</strong> Expect increased interest in your rental items</li>
                <li><strong>Faster Bookings:</strong> Boosted listings typically get booked faster</li>
                <li><strong>Higher Revenue:</strong> Enhanced visibility leads to better rental income</li>
              </ul>
            </div>


            <p>Thank you for choosing RentYatra Boost! We wish you great success with your enhanced listings!</p>
          </div>
          
          <div class="footer">
            <p><strong>Best regards,<br>The RentYatra Team</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For support, contact us at support@rentyatra.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Boost Plan Confirmation - ${packageName} | RentYatra
      
      Hello ${userName},
      
      Congratulations! Your boost plan has been successfully activated.
      
      BOOST DETAILS:
      - Package: ${packageName}
      - Amount Paid: ₹${amount.toLocaleString()}
      - Boost ID: ${boostId}
      - Duration: ${duration} days
      - Start Date: ${new Date(startDate).toLocaleDateString('en-IN')}
      - End Date: ${new Date(endDate).toLocaleDateString('en-IN')}
      - Status: Active
      
      BOOST FEATURES:
      - Enhanced Visibility: Your listings appear at the top of search results
      - Priority Placement: Get featured in premium sections
      - Increased Views: More potential customers will see your listings
      
      WHAT THIS MEANS FOR YOU:
      - Better Visibility: Your listings will appear prominently in search results
      - More Inquiries: Expect increased interest in your rental items
      - Faster Bookings: Boosted listings typically get booked faster
      - Higher Revenue: Enhanced visibility leads to better rental income
      
      Thank you for choosing RentYatra Boost!
      
      Best regards,
      The RentYatra Team
    `;

    return await this.sendEmail({
      to: email,
      subject: subject,
      html: html,
      text: text
    });
  }

  /**
   * Send rental post approval notification email
   */
  async sendRentalApprovalNotification(rentalData, userData) {
    const { title, category, location, rentalId } = rentalData;
    const { name: userName, email } = userData;

    const subject = `Rental Post Approved - ${title} | RentYatra`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rental Post Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; }
          .section { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .rental-details { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .cta-button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Rental Post Approved!</h1>
            <p>Your listing is now live on RentYatra</p>
            <p style="font-size: 18px; margin: 10px 0;">Start receiving rental inquiries</p>
          </div>
          
          <div class="content">
            <h2>Congratulations ${userName}!</h2>
            <p>Great news! Your rental post has been reviewed and approved by our team. It's now live and visible to potential renters.</p>
            
            <div class="rental-details">
              <h3>📋 Rental Details</h3>
              <p><strong>Title:</strong> ${title}</p>
              <p><strong>Category:</strong> ${category}</p>
              <p><strong>Location:</strong> ${location}</p>
              <p><strong>Rental ID:</strong> ${rentalId}</p>
              <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
              <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">Live & Active</span></p>
            </div>

            <div class="section">
              <h3>🎉 What Happens Next?</h3>
              <ul>
                <li><strong>Increased Visibility:</strong> Your listing is now searchable by potential renters</li>
                <li><strong>Rental Inquiries:</strong> You'll start receiving inquiries and booking requests</li>
                <li><strong>Dashboard Management:</strong> Manage inquiries and bookings from your dashboard</li>
                <li><strong>Communication:</strong> Respond to renters through our messaging system</li>
              </ul>
            </div>

            <div class="highlight">
              <h4>💡 Tips for Success</h4>
              <ul>
                <li><strong>Quick Response:</strong> Respond to inquiries promptly to increase bookings</li>
                <li><strong>Clear Communication:</strong> Provide detailed information about your rental</li>
                <li><strong>Quality Photos:</strong> Keep your listing photos updated and high-quality</li>
                <li><strong>Fair Pricing:</strong> Competitive pricing attracts more renters</li>
              </ul>
            </div>


            <p>Thank you for choosing RentYatra! We wish you great success with your rental business!</p>
          </div>
          
          <div class="footer">
            <p><strong>Best regards,<br>The RentYatra Team</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For support, contact us at support@rentyatra.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Rental Post Approved - ${title} | RentYatra
      
      Congratulations ${userName}!
      
      Great news! Your rental post has been reviewed and approved by our team.
      
      RENTAL DETAILS:
      - Title: ${title}
      - Category: ${category}
      - Location: ${location}
      - Rental ID: ${rentalId}
      - Approval Date: ${new Date().toLocaleDateString('en-IN')}
      - Status: Live & Active
      
      WHAT HAPPENS NEXT:
      - Increased Visibility: Your listing is now searchable by potential renters
      - Rental Inquiries: You'll start receiving inquiries and booking requests
      - Dashboard Management: Manage inquiries and bookings from your dashboard
      - Communication: Respond to renters through our messaging system
      
      TIPS FOR SUCCESS:
      - Quick Response: Respond to inquiries promptly to increase bookings
      - Clear Communication: Provide detailed information about your rental
      - Quality Photos: Keep your listing photos updated and high-quality
      - Fair Pricing: Competitive pricing attracts more renters
      
      Thank you for choosing RentYatra!
      
      Best regards,
      The RentYatra Team
    `;

    return await this.sendEmail({
      to: email,
      subject: subject,
      html: html,
      text: text
    });
  }

  /**
   * Generate benefits HTML for subscription email
   */
  generateBenefitsHtml(benefits, features) {
    let html = '<div class="benefits-grid">';
    
    // Add features
    if (features && features.length > 0) {
      features.forEach(feature => {
        html += `
          <div class="benefit-item">
            <h4 style="margin: 0 0 8px 0; color: #1e40af;">${feature.title}</h4>
            <p style="margin: 0; color: #4b5563;">${feature.description}</p>
          </div>
        `;
      });
    }
    
    // Add specific benefits
    if (benefits) {
      if (benefits.premiumSupport) {
        html += `
          <div class="benefit-item">
            <h4 style="margin: 0 0 8px 0; color: #1e40af;">🎧 Premium Support</h4>
            <p style="margin: 0; color: #4b5563;">Priority customer support for all your needs</p>
          </div>
        `;
      }
      
      if (benefits.enhancedVisibility) {
        html += `
          <div class="benefit-item">
            <h4 style="margin: 0 0 8px 0; color: #1e40af;">👁️ Enhanced Visibility</h4>
            <p style="margin: 0; color: #4b5563;">Your listings get better visibility in search results</p>
          </div>
        `;
      }
      
      if (benefits.analytics) {
        html += `
          <div class="benefit-item">
            <h4 style="margin: 0 0 8px 0; color: #1e40af;">📊 Advanced Analytics</h4>
            <p style="margin: 0; color: #4b5563;">Detailed insights into your listing performance</p>
          </div>
        `;
      }
    }
    
    html += '</div>';
    return html;
  }

  /**
   * Generate benefits text for subscription email
   */
  generateBenefitsText(benefits, features) {
    let text = '';
    
    // Add features
    if (features && features.length > 0) {
      features.forEach(feature => {
        text += `- ${feature.title}: ${feature.description}\n`;
      });
    }
    
    // Add specific benefits
    if (benefits) {
      if (benefits.premiumSupport) {
        text += '- Premium Support: Priority customer support for all your needs\n';
      }
      
      if (benefits.enhancedVisibility) {
        text += '- Enhanced Visibility: Your listings get better visibility in search results\n';
      }
      
      if (benefits.analytics) {
        text += '- Advanced Analytics: Detailed insights into your listing performance\n';
      }
    }
    
    return text;
  }

  /**
   * Send test email
   */
  async sendTestEmail(to) {
    const subject = 'Test Email - RentYatra SMTP Service';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ SMTP Test Successful!</h1>
          </div>
          <div class="content">
            <p>This is a test email to verify that the SMTP email service is working correctly.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p>If you received this email, the email service is properly configured and functioning.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      SMTP Test Successful!
      
      This is a test email to verify that the SMTP email service is working correctly.
      
      Timestamp: ${new Date().toISOString()}
      
      If you received this email, the email service is properly configured and functioning.
    `;

    return await this.sendEmail({
      to: to,
      subject: subject,
      html: html,
      text: text
    });
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
