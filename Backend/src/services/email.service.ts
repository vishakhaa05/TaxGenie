import nodemailer from "nodemailer";
import { Env } from "../config/env.config";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  otp?: string | undefined;
}

// Global cached test email storage for integration tests
export const sentEmailsLog: Array<{
  to: string;
  subject: string;
  text: string;
  html: string;
  otp?: string | undefined;
  timestamp: Date;
}> = [];


// Create Nodemailer Transporter
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.mailtrap.io";
  const port = parseInt(process.env.SMTP_PORT || "2525", 10);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
    });
  }

  // Fallback to test/console transporter
  return null;
}

export async function sendEmail({ to, subject, html, text, otp }: SendEmailParams): Promise<boolean> {
  sentEmailsLog.push({
    to,
    subject,
    text,
    html,
    otp,
    timestamp: new Date(),
  });

  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"TaxGenie" <noreply@taxgenie.in>';

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      if (process.env.NODE_ENV === "development") {
        console.log(`[Email Service] Sent email to ${to} with subject "${subject}"`);
      }
      return true;
    } catch (error) {
      console.warn(`[Email Service] Failed to send email via SMTP to ${to}:`, error);
      return false;
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Email Service - Dev Mock] Email to ${to}: "${subject}"`);
    }
    return true;
  }
}

/**
 * Send 6-Digit Email Verification OTP
 */
export async function sendVerificationOtpEmail(
  to: string,
  name: string,
  otp: string,
  language: "en" | "hi" = "en"
): Promise<boolean> {
  const isHindi = language === "hi";

  const subject = isHindi
    ? "TaxGenie - अपना ईमेल सत्यापित करने के लिए OTP कोड"
    : "TaxGenie - Your 6-Digit Email Verification Code";

  const title = isHindi ? "ईमेल सत्यापन" : "Email Verification";
  const greeting = isHindi ? `नमस्ते ${name},` : `Hello ${name},`;
  const bodyText = isHindi
    ? "TaxGenie में शामिल होने के लिए धन्यवाद। अपना खाता सत्यापित करने के लिए नीचे दिए गए 6-अंकीय कोड का उपयोग करें। यह कोड 10 मिनट के लिए मान्य है:"
    : "Thank you for creating an account with TaxGenie. Please enter the following 6-digit one-time password (OTP) to verify your email. This code expires in 10 minutes:";
  const expiryNote = isHindi
    ? "यदि आपने यह खाता नहीं बनाया है, तो कृपया इस ईमेल को अनदेखा करें।"
    : "If you did not initiate this request, you can safely ignore this email.";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0F172A; color: #E2E8F0; margin: 0; padding: 24px; }
          .container { max-width: 500px; margin: 0 auto; background: #1E293B; border-radius: 16px; border: 1px solid #334155; padding: 32px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #6366F1; letter-spacing: -0.5px; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 700; color: #F8FAFC; margin-bottom: 12px; }
          .text { font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px; text-align: left; }
          .otp-box { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #38BDF8; background: #0F172A; border: 1px solid #475569; border-radius: 12px; padding: 16px; margin: 24px 0; font-family: monospace; display: inline-block; min-width: 220px; }
          .footer { font-size: 12px; color: #64748B; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">TaxGenie</div>
          <div class="title">${title}</div>
          <p class="text">${greeting}<br><br>${bodyText}</p>
          <div class="otp-box">${otp}</div>
          <p class="text" style="font-size: 12px; color: #64748B;">${expiryNote}</p>
          <div class="footer">TaxGenie &bull; Simplifying Indian Income Tax & GST</div>
        </div>
      </body>
    </html>
  `;

  const text = `${title}\n\n${greeting}\n\n${bodyText}\n\nOTP: ${otp}\n\n${expiryNote}\n\nTaxGenie`;

  return sendEmail({ to, subject, html, text, otp });
}

/**
 * Send Password Reset Link
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string,
  language: "en" | "hi" = "en"
): Promise<boolean> {
  const isHindi = language === "hi";
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5174";
  const resetLink = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const subject = isHindi
    ? "TaxGenie - पासवर्ड रीसेट करने का लिंक"
    : "TaxGenie - Password Reset Request";

  const title = isHindi ? "पासवर्ड रीसेट करें" : "Reset Your Password";
  const greeting = isHindi ? `नमस्ते ${name},` : `Hello ${name},`;
  const bodyText = isHindi
    ? "हमें आपके TaxGenie खाते का पासवर्ड रीसेट करने का अनुरोध प्राप्त हुआ है। अपना पासवर्ड बदलने के लिए नीचे दिए गए बटन पर क्लिक करें। यह लिंक 30 मिनट के लिए मान्य है:"
    : "We received a request to reset your TaxGenie password. Click the button below to choose a new password. This link is valid for 30 minutes:";
  const cta = isHindi ? "पासवर्ड रीसेट करें" : "Reset Password";
  const expiryNote = isHindi
    ? "यदि आपने यह अनुरोध नहीं किया था, तो आप इस ईमेल को अनदेखा कर सकते हैं; आपका पासवर्ड सुरक्षित रहेगा।"
    : "If you did not request a password reset, no action is needed; your current password remains secure.";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0F172A; color: #E2E8F0; margin: 0; padding: 24px; }
          .container { max-width: 500px; margin: 0 auto; background: #1E293B; border-radius: 16px; border: 1px solid #334155; padding: 32px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #6366F1; letter-spacing: -0.5px; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 700; color: #F8FAFC; margin-bottom: 12px; }
          .text { font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 24px; text-align: left; }
          .button { display: inline-block; background: #6366F1; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 12px; margin: 16px 0; }
          .footer { font-size: 12px; color: #64748B; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">TaxGenie</div>
          <div class="title">${title}</div>
          <p class="text">${greeting}<br><br>${bodyText}</p>
          <a href="${resetLink}" class="button">${cta}</a>
          <p class="text" style="font-size: 11px; word-break: break-all; color: #64748B;">${resetLink}</p>
          <p class="text" style="font-size: 12px; color: #64748B;">${expiryNote}</p>
          <div class="footer">TaxGenie &bull; Simplifying Indian Income Tax & GST</div>
        </div>
      </body>
    </html>
  `;

  const text = `${title}\n\n${greeting}\n\n${bodyText}\n\n${resetLink}\n\n${expiryNote}\n\nTaxGenie`;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send Password Changed Confirmation Notice
 */
export async function sendPasswordChangedNoticeEmail(
  to: string,
  name: string,
  language: "en" | "hi" = "en"
): Promise<boolean> {
  const isHindi = language === "hi";

  const subject = isHindi
    ? "TaxGenie - आपका पासवर्ड सफलतापूर्वक बदला गया"
    : "TaxGenie - Your Password Has Been Changed";

  const title = isHindi ? "पासवर्ड अपडेट हुआ" : "Password Changed";
  const greeting = isHindi ? `नमस्ते ${name},` : `Hello ${name},`;
  const bodyText = isHindi
    ? "यह पुष्टि करने के लिए है कि आपके TaxGenie खाते का पासवर्ड सफलतापूर्वक बदल दिया गया है। सुरक्षा कारणों से अन्य सभी सक्रिय सत्र समाप्त कर दिए गए हैं।"
    : "This email confirms that the password for your TaxGenie account was recently changed. For your security, any other active sessions have been signed out.";
  const alertText = isHindi
    ? "यदि आपने यह बदलाव नहीं किया था, तो कृपया तुरंत अपना पासवर्ड रीसेट करें और सहायता टीम से संपर्क करें।"
    : "If you did not perform this change, please reset your password immediately and contact support.";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0F172A; color: #E2E8F0; margin: 0; padding: 24px; }
          .container { max-width: 500px; margin: 0 auto; background: #1E293B; border-radius: 16px; border: 1px solid #334155; padding: 32px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #6366F1; letter-spacing: -0.5px; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 700; color: #F8FAFC; margin-bottom: 12px; }
          .text { font-size: 14px; line-height: 1.6; color: #94A3B8; margin-bottom: 20px; text-align: left; }
          .alert { font-size: 13px; color: #F87171; background: #450A0A; border: 1px solid #7F1D1D; border-radius: 10px; padding: 12px; margin: 16px 0; text-align: left; }
          .footer { font-size: 12px; color: #64748B; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">TaxGenie</div>
          <div class="title">${title}</div>
          <p class="text">${greeting}<br><br>${bodyText}</p>
          <div class="alert">${alertText}</div>
          <div class="footer">TaxGenie &bull; Simplifying Indian Income Tax & GST</div>
        </div>
      </body>
    </html>
  `;

  const text = `${title}\n\n${greeting}\n\n${bodyText}\n\n${alertText}\n\nTaxGenie`;

  return sendEmail({ to, subject, html, text });
}

export const emailService = {
  sendEmail,
  sendVerificationOtpEmail,
  sendPasswordResetEmail,
  sendPasswordChangedNoticeEmail,
  getCapturedEmails: () => sentEmailsLog,
  clearCapturedEmails: () => {
    sentEmailsLog.length = 0;
  },
};

