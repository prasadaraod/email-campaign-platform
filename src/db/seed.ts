import dotenv from 'dotenv';
dotenv.config();

import { db } from '../config/database';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create tenant
  const tenantResult = await db.query(
    `INSERT INTO tenants (name) VALUES ($1)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    ['My Company']
  );

  let tenantId = tenantResult.rows[0]?.id;

  if (!tenantId) {
    const existing = await db.query(
      `SELECT id FROM tenants WHERE name = $1`,
      ['My Company']
    );
    tenantId = existing.rows[0].id;
  }

  // Create user
  const hashedPassword = await bcrypt.hash('password123', 12);
  await db.query(
    `INSERT INTO users (tenant_id, email, password, name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    [tenantId, 'prasad@example.com', hashedPassword, 'Prasad Rao']
  );

  // Create sample contacts
  const contacts = [
    { email: 'contact1@example.com', name: 'Contact One' },
    { email: 'contact2@example.com', name: 'Contact Two' },
    { email: 'contact3@example.com', name: 'Contact Three' },
  ];

  for (const contact of contacts) {
    await db.query(
      `INSERT INTO contacts (tenant_id, email, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, email) DO NOTHING`,
      [tenantId, contact.email, contact.name]
    );
  }

  console.log('✅ Seed complete');
  console.log('   → Email: prasad@example.com');
  console.log('   → Password: password123');
  console.log(`   → Tenant: My Company`);
  console.log(`   → Contacts: ${contacts.length} created`);

  await db.end();
}

seed().catch(console.error);