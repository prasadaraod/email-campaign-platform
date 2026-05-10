import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../config/database';

async function migrate() {
  const sql = readFileSync(join(__dirname, 'migrations/001_init.sql'), 'utf-8');
  await db.query(sql);
  console.log('✅ Migrations complete');
  await db.end();
}

migrate().catch(console.error);