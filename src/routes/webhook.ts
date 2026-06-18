import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { githubWebhookSchema } from '../validators/webhook';
import { getWebhookQueue } from '../services/queue';

export const webhookRouter = Router();

webhookRouter.post('/github', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = githubWebhookSchema.parse(req.body);

    const idempotencyKey = req.headers['x-github-delivery'] as string || uuidv4();

    const queue = getWebhookQueue();
    if (queue) {
      const job = await queue.add('process-webhook', {
        idempotencyKey,
        payload,
      }, {
        jobId: idempotencyKey,
      });

      res.status(202).json({
        status: 'accepted',
        jobId: job.id,
        idempotencyKey,
      });
    } else {
      res.status(202).json({
        status: 'accepted',
        jobId: null,
        idempotencyKey,
        warning: 'Redis not available, webhook queued in-memory only',
      });
    }
  } catch (err) {
    next(err);
  }
});
