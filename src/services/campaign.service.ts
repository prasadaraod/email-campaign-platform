import { db } from '../config/database';
import { AppError } from '../utils/errors';
import { campaignQueue } from '../workers/queues/campaignQueue';
import {
  CreateCampaignInput,
  UpdateCampaignInput,
  SendCampaignInput,
} from '../api/validators/campaign.schema';

export const campaignService = {
  async create(tenantId: string, input: CreateCampaignInput) {
    const { name, subject, bodyHtml, scheduledAt } = input;

    const result = await db.query(
      `INSERT INTO campaigns (tenant_id, name, subject, body_html, scheduled_at, status)
       VALUES ($1, $2, $3, $4, $5, 'draft')
       RETURNING id, name, subject, body_html, status, scheduled_at, created_at`,
      [tenantId, name, subject, bodyHtml, scheduledAt ?? null]
    );

    return result.rows[0];
  },

  async list(tenantId: string) {
    const result = await db.query(
      `SELECT id, name, subject, status, scheduled_at, created_at
       FROM campaigns
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId]
    );

    return result.rows;
  },

  async getById(tenantId: string, campaignId: string) {
    const result = await db.query(
      `SELECT id, name, subject, body_html, status, scheduled_at, created_at
       FROM campaigns
       WHERE tenant_id = $1 AND id = $2`,
      [tenantId, campaignId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Campaign not found', 404, 'NOT_FOUND');
    }

    return result.rows[0];
  },

  async update(
    tenantId: string,
    campaignId: string,
    input: UpdateCampaignInput
  ) {
    const campaign = await campaignService.getById(tenantId, campaignId);

    if (!['draft', 'scheduled'].includes(campaign.status)) {
      throw new AppError(
        'Only draft or scheduled campaigns can be updated',
        400,
        'INVALID_STATUS'
      );
    }

    const { name, subject, bodyHtml, scheduledAt } = input;
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }
    if (subject !== undefined) {
      updates.push(`subject = $${paramIndex}`);
      values.push(subject);
      paramIndex++;
    }
    if (bodyHtml !== undefined) {
      updates.push(`body_html = $${paramIndex}`);
      values.push(bodyHtml);
      paramIndex++;
    }
    if (scheduledAt !== undefined) {
      updates.push(`scheduled_at = $${paramIndex}`);
      values.push(scheduledAt);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400, 'NO_UPDATES');
    }

    values.push(tenantId, campaignId);

    const result = await db.query(
      `UPDATE campaigns
       SET ${updates.join(', ')}
       WHERE tenant_id = $${paramIndex} AND id = $${paramIndex + 1}
       RETURNING id, name, subject, body_html, status, scheduled_at, created_at`,
      values
    );

    return result.rows[0];
  },

  async send(
    tenantId: string,
    campaignId: string,
    input: SendCampaignInput
  ) {
    const campaign = await campaignService.getById(tenantId, campaignId);

    if (!['draft', 'scheduled'].includes(campaign.status)) {
      throw new AppError(
        'Campaign is already sending or completed',
        400,
        'INVALID_STATUS'
      );
    }

    // Check there are subscribed contacts
    const contactCount = await db.query(
      `SELECT COUNT(*) FROM contacts
       WHERE tenant_id = $1 AND subscribed = TRUE`,
      [tenantId]
    );

    if (parseInt(contactCount.rows[0].count) === 0) {
      throw new AppError(
        'No subscribed contacts found',
        400,
        'NO_CONTACTS'
      );
    }

    const scheduledAt = input.scheduledAt
      ? new Date(input.scheduledAt)
      : null;

    const delay = scheduledAt
      ? Math.max(0, scheduledAt.getTime() - Date.now())
      : 0;

    // Update campaign status
    await db.query(
      `UPDATE campaigns SET status = $1, scheduled_at = $2
       WHERE id = $3`,
      [
        scheduledAt ? 'scheduled' : 'sending',
        scheduledAt ?? new Date(),
        campaignId,
      ]
    );

    // Enqueue campaign job
    await campaignQueue.add(
      'launch',
      { campaignId, tenantId },
      { delay }
    );

    return {
      campaignId,
      status: scheduledAt ? 'scheduled' : 'sending',
      scheduledAt: scheduledAt ?? new Date(),
      message: scheduledAt
        ? `Campaign scheduled for ${scheduledAt.toISOString()}`
        : 'Campaign queued for immediate sending',
    };
  },

  async getStats(tenantId: string, campaignId: string) {
    // Verify campaign belongs to tenant
    await campaignService.getById(tenantId, campaignId);

    const result = await db.query(
      `SELECT
        COUNT(DISTINCT s.id)                                          AS total_sends,
        COUNT(e.id) FILTER (WHERE e.type = 'delivered')              AS delivered,
        COUNT(e.id) FILTER (WHERE e.type = 'opened')                 AS opens,
        COUNT(e.id) FILTER (WHERE e.type = 'clicked')                AS clicks,
        COUNT(e.id) FILTER (WHERE e.type = 'bounced')                AS bounces,
        COUNT(e.id) FILTER (WHERE e.type = 'unsubscribed')           AS unsubscribes,
        ROUND(
          COUNT(e.id) FILTER (WHERE e.type = 'opened')::numeric /
          NULLIF(COUNT(DISTINCT s.id), 0) * 100, 2
        )                                                             AS open_rate,
        ROUND(
          COUNT(e.id) FILTER (WHERE e.type = 'clicked')::numeric /
          NULLIF(COUNT(DISTINCT s.id), 0) * 100, 2
        )                                                             AS click_rate
       FROM sends s
       LEFT JOIN events e ON e.send_id = s.id
       WHERE s.campaign_id = $1`,
      [campaignId]
    );

    return result.rows[0];
  },

  async updateStatus(campaignId: string, status: string) {
    await db.query(
      `UPDATE campaigns SET status = $1 WHERE id = $2`,
      [status, campaignId]
    );
  },
};