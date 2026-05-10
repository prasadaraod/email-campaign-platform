import { db } from '../config/database';
import { AppError } from '../utils/errors';
import {
  CreateContactInput,
  UpdateContactInput,
  ListContactsInput,
} from '../api/validators/contact.schema';

export const contactService = {
  async create(tenantId: string, input: CreateContactInput) {
    const { email, name, metadata } = input;

    // Check duplicate within tenant
    const existing = await db.query(
      'SELECT id FROM contacts WHERE tenant_id = $1 AND email = $2',
      [tenantId, email]
    );
    if (existing.rows.length > 0) {
      throw new AppError('Contact with this email already exists', 409, 'CONTACT_EXISTS');
    }

    const result = await db.query(
      `INSERT INTO contacts (tenant_id, email, name, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, metadata, subscribed, created_at`,
      [tenantId, email, name ?? null, JSON.stringify(metadata ?? {})]
    );

    return result.rows[0];
  },

  async list(tenantId: string, input: ListContactsInput) {
    const { page, limit, search, subscribed } = input;
    const offset = (page - 1) * limit;
    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let paramIndex = 2;

    if (search) {
      conditions.push(
        `(email ILIKE $${paramIndex} OR name ILIKE $${paramIndex})`
      );
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (subscribed !== undefined) {
      conditions.push(`subscribed = $${paramIndex}`);
      values.push(subscribed);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM contacts WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const result = await db.query(
      `SELECT id, email, name, metadata, subscribed, created_at
       FROM contacts
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    return {
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(tenantId: string, contactId: string) {
    const result = await db.query(
      `SELECT id, email, name, metadata, subscribed, created_at
       FROM contacts
       WHERE tenant_id = $1 AND id = $2`,
      [tenantId, contactId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Contact not found', 404, 'NOT_FOUND');
    }

    return result.rows[0];
  },

  async update(tenantId: string, contactId: string, input: UpdateContactInput) {
    // Check contact exists
    await contactService.getById(tenantId, contactId);

    const { name, metadata, subscribed } = input;
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (metadata !== undefined) {
      updates.push(`metadata = $${paramIndex}`);
      values.push(JSON.stringify(metadata));
      paramIndex++;
    }

    if (subscribed !== undefined) {
      updates.push(`subscribed = $${paramIndex}`);
      values.push(subscribed);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400, 'NO_UPDATES');
    }

    values.push(tenantId, contactId);

    const result = await db.query(
      `UPDATE contacts
       SET ${updates.join(', ')}
       WHERE tenant_id = $${paramIndex} AND id = $${paramIndex + 1}
       RETURNING id, email, name, metadata, subscribed, created_at`,
      values
    );

    return result.rows[0];
  },

  async unsubscribe(tenantId: string, contactId: string) {
    // Check contact exists
    await contactService.getById(tenantId, contactId);

    const result = await db.query(
      `UPDATE contacts
       SET subscribed = false
       WHERE tenant_id = $1 AND id = $2
       RETURNING id, email, subscribed`,
      [tenantId, contactId]
    );

    return result.rows[0];
  },

  async importBulk(tenantId: string, contacts: CreateContactInput[]) {
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const contact of contacts) {
      try {
        await contactService.create(tenantId, contact);
        results.created++;
      } catch (err) {
        if (err instanceof AppError && err.code === 'CONTACT_EXISTS') {
          results.skipped++;
        } else {
          results.errors.push(contact.email);
        }
      }
    }

    return results;
  },
};