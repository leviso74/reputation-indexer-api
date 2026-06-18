import request from 'supertest';

jest.mock('../src/db', () => ({
  query: jest.fn().mockRejectedValue(new Error('database not available in test')),
  pool: { on: jest.fn() },
}));

jest.mock('../src/services/queue', () => ({
  getWebhookQueue: jest.fn(() => null),
  initQueue: jest.fn(),
  closeQueueConnections: jest.fn(),
  processWebhookJob: jest.fn(),
}));

import app from '../src/index';

describe('GET /api/v1/contributors/:github_handle/scorecard', () => {
  it('should return 500 when database is not available (graceful error)', async () => {
    const res = await request(app)
      .get('/api/v1/contributors/nonexistent_user/scorecard');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 500 for unknown user (database error handled)', async () => {
    const res = await request(app)
      .get('/api/v1/contributors/unknown_user/scorecard');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  it('should handle route correctly', async () => {
    const res = await request(app)
      .get('/api/v1/contributors/testuser/scorecard');

    expect([500, 404]).toContain(res.status);
  });
});
