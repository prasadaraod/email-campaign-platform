import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { campaignProcessor } from './processors/campaign.processor';
import { emailProcessor } from './processors/email.processor';
import { logger } from '../utils/logger';

// Campaign worker — processes one campaign at a time
const campaignWorker = new Worker('campaign', campaignProcessor, {
  connection: redis,
  concurrency: 2,
});

// Email worker — sends emails concurrently
const emailWorker = new Worker('email', emailProcessor, {
  connection: redis,
  concurrency: 10, // 10 emails at a time
  limiter: {
    max: 100,       // max 100 jobs
    duration: 1000, // per second — respects SendGrid rate limits
  },
});

// Campaign worker events
campaignWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, '✅ Campaign job completed');
});

campaignWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, '❌ Campaign job failed');
});

campaignWorker.on('progress', (job, progress) => {
  logger.info({ jobId: job.id, progress }, '📊 Campaign progress');
});

// Email worker events
emailWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, '✅ Email job completed');
});

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, '❌ Email job failed');
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down workers...');
  await campaignWorker.close();
  await emailWorker.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

logger.info('🔧 Workers started');
logger.info('   → Campaign worker: concurrency 2');
logger.info('   → Email worker: concurrency 10, rate limit 100/sec');