import { Job } from 'bullmq';
import { sgMail } from '../../config/sendgrid';
import { db } from '../../config/database';
import { logger } from '../../utils/logger';

export const emailProcessor = async (job: Job) => {
  const {
    sendId,
    campaignId,
    email,
    name,
    subject,
    bodyHtml,
  } = job.data;

  logger.info({ sendId, email }, '📧 Sending email');

  try {
    // Build unsubscribe link
    const unsubscribeUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/webhooks/unsubscribe?sendId=${sendId}`;

    // Personalise the email body
    const personalizedHtml = bodyHtml
      .replace(/{{name}}/g, name || 'there')
      .replace(/{{email}}/g, email)
      + `<br/><br/><small><a href="${unsubscribeUrl}">Unsubscribe</a></small>`;

    // Send via SendGrid
    await sgMail.send({
      to: { email, name: name || '' },
      from: {
        email: process.env.EMAIL_FROM || '',
        name: process.env.EMAIL_FROM_NAME || 'Campaign Platform',
      },
      subject,
      html: personalizedHtml,
      customArgs: {
        sendId,
        campaignId,
      },
    });

    // Update send status to sent
    await db.query(
      `UPDATE sends SET status = 'sent', sent_at = NOW()
       WHERE id = $1`,
      [sendId]
    );

    // Record delivered event
    await db.query(
      `INSERT INTO events (send_id, type)
       VALUES ($1, 'delivered')`,
      [sendId]
    );

    logger.info({ sendId, email }, '✅ Email sent successfully');

    return { sendId, email, status: 'sent' };
  } catch (err: any) {
    logger.error({ sendId, email, err: err.message }, '❌ Email send failed');

    // Update send status to failed
    await db.query(
      `UPDATE sends SET status = 'failed' WHERE id = $1`,
      [sendId]
    );

    throw err;
  }
};