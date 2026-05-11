import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY || '';

if (!apiKey) {
  console.warn('⚠️  SENDGRID_API_KEY is not set');
} else {
  sgMail.setApiKey(apiKey);
  console.log('✅ SendGrid configured');
}

export { sgMail };