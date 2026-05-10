import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { db } from './config/database';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  server.close();
  await db.end();
});