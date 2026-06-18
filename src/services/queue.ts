import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let connection: any = null;
let _webhookQueue: Queue | null = null;
let _worker: Worker | null = null;

function getConnection(): any {
  if (!connection) {
    try {
      connection = new IORedis(REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: () => null,
      });
      connection.on('error', () => {});
    } catch {
      connection = null;
    }
  }
  return connection;
}

export function getWebhookQueue(): Queue | null {
  const conn = getConnection();
  if (!conn) return null;
  if (!_webhookQueue) {
    _webhookQueue = new Queue('github-webhooks', {
      connection: conn,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 500,
      },
    });
  }
  return _webhookQueue;
}

export async function processWebhookJob(job: Job) {
  const { idempotencyKey, payload } = job.data;
  console.log(`Processing webhook job ${job.id} for PR #${payload.pull_request?.number}`);

  const { query } = await import('../db');

  const existing = await query(
    'SELECT id FROM pull_requests WHERE idempotency_key = $1',
    [idempotencyKey]
  );

  if (existing.rows.length > 0) {
    console.log(`Duplicate webhook ${idempotencyKey} skipped`);
    return { status: 'duplicate', idempotencyKey };
  }

  const mergedAt = payload.pull_request?.merged_at
    ? new Date(payload.pull_request.merged_at).toISOString()
    : null;

  if (!mergedAt) {
    return { status: 'not_merged', idempotencyKey };
  }

  const result = await query(
    `INSERT INTO pull_requests (
      github_id, pr_number, title, contributor_login, contributor_id,
      repository, merged_at, additions, deletions, changed_files, idempotency_key
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id`,
    [
      payload.pull_request.id,
      payload.pull_request.number,
      payload.pull_request.title,
      payload.pull_request.user.login,
      payload.pull_request.user.id,
      payload.repository?.full_name,
      mergedAt,
      payload.pull_request.additions || 0,
      payload.pull_request.deletions || 0,
      payload.pull_request.changed_files || 0,
      idempotencyKey,
    ]
  );

  return { status: 'processed', prId: result.rows[0].id, idempotencyKey };
}

function startWorker() {
  const conn = getConnection();
  if (!conn) return;

  _worker = new Worker('github-webhooks', processWebhookJob, {
    connection: conn,
    concurrency: 5,
  });

  _worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed:`, job.returnvalue);
  });

  _worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });
}

export function initQueue() {
  getWebhookQueue();
  startWorker();
}

export async function closeQueueConnections() {
  await _webhookQueue?.close();
  await _worker?.close();
  await connection?.quit();
}
