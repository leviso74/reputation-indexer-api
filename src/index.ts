import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { webhookRouter } from './routes/webhook';
import { contributorsRouter } from './routes/contributors';
import { errorHandler } from './middleware/errorHandler';
import { initQueue } from './services/queue';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/webhooks', webhookRouter);
app.use('/api/v1/contributors', contributorsRouter);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  initQueue();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
