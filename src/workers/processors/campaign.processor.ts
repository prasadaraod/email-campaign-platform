import { Job } from 'bullmq';
import { db } from '../../config/database';
import { emailQueue } from '../queues/emailQueue';
import { campaignService } from '../../services/campaign.service';
import { logger } from '../../utils/logger';

const BATCH_SIZE = 500;

export const campaignProcessor = async (job: Job) => {
  const { campaignId, tenantId } = job.data;

  logger.info({ campaignId }, '🚀 Campaign processor started');

  try {
    // Get campaign details
    const campaign = await db.query(
      `SELECT id, name, subject, body_html
       FROM campaigns WHERE id = $1 AND tenant_id = $2`,
      [campaignId, tenantId]
    );

    if (campaign.rows.length === 0) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    // Get total subscribed contacts count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM contacts
       WHERE tenant_id = $1 AND subscribed = TRUE`,
      [tenantId]
    );
    const totalContacts = parseInt(countResult.rows[0].count);

    if (totalContacts === 0) {
      logger.warn({ campaignId }, 'No subscribed contacts found');
      await campaignService.updateStatus(campaignId, 'sent');
      return { processed: 0 };
    }

    logger.info({ campaignId, totalContacts }, 'Processing contacts');

    let offset = 0;
    let totalQueued = 0;

    // Process contacts in batches
    while (true) {
      const contacts = await db.query(
        `SELECT id, email, name
         FROM contacts
         WHERE tenant_id = $1 AND subscribed = TRUE
         ORDER BY created_at
         LIMIT $2 OFFSET $3`,
        [tenantId, BATCH_SIZE, offset]
      );

      if (contacts.rows.length === 0) break;

      // Create send records and enqueue email jobs
      for (const contact of contacts.rows) {
        // Insert send record
        const sendResult = await db.query(
          `INSERT INTO sends (campaign_id, contact_id, status)
           VALUES ($1, $2, 'queued')
           RETURNING id`,
          [campaignId, contact.id]
        );

        const sendId = sendResult.rows[0].id;

        // Enqueue email job
        await emailQueue.add('send-email', {
          sendId,
          campaignId,
          contactId: contact.id,
          email: contact.email,
          name: contact.name,
          subject: campaign.rows[0].subject,
          bodyHtml: campaign.rows[0].body_html,
        });

        totalQueued++;
      }

      // Update progress
      const progress = Math.round((totalQueued / totalContacts) * 100);
      await job.updateProgress(progress);

      logger.info(
        { campaignId, totalQueued, totalContacts, progress },
        'Batch processed'
      );

      offset += BATCH_SIZE;

      if (contacts.rows.length < BATCH_SIZE) break;
    }

    // Update campaign status to sent
    await campaignService.updateStatus(campaignId, 'sending');

    logger.info({ campaignId, totalQueued }, '✅ Campaign processing complete');

    return { processed: totalQueued };
  } catch (err) {
    logger.error({ campaignId, err }, '❌ Campaign processor failed');
    await campaignService.updateStatus(campaignId, 'draft');
    throw err;
  }
};