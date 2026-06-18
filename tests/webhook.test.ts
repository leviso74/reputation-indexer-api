import request from 'supertest';

jest.mock('../src/services/queue', () => ({
  getWebhookQueue: jest.fn(() => ({
    add: jest.fn(() => Promise.resolve({ id: 'mock-job-id' })),
  })),
  initQueue: jest.fn(),
  closeQueueConnections: jest.fn(),
  processWebhookJob: jest.fn(),
}));

jest.mock('../src/db', () => ({
  query: jest.fn(),
  pool: { on: jest.fn(), end: jest.fn() },
}));

import app from '../src/index';

describe('POST /api/v1/webhooks/github', () => {
  const validPayload = {
    action: 'closed',
    pull_request: {
      id: 12345,
      number: 42,
      title: 'Fix critical bug',
      user: { login: 'testuser', id: 98765 },
      merged_at: '2025-01-15T10:00:00Z',
      created_at: '2025-01-14T10:00:00Z',
      closed_at: '2025-01-15T10:00:00Z',
      additions: 100,
      deletions: 50,
      changed_files: 5,
    },
    repository: {
      id: 1,
      name: 'test-repo',
      full_name: 'testuser/test-repo',
      owner: { login: 'testuser' },
    },
  };

  it('should accept a valid webhook payload with 202 status', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/github')
      .send(validPayload)
      .set('x-github-delivery', 'test-delivery-id-123');

    expect(res.status).toBe(202);
    expect(res.body).toHaveProperty('status', 'accepted');
    expect(res.body).toHaveProperty('jobId');
    expect(res.body).toHaveProperty('idempotencyKey');
  });

  it('should return 400 when payload is missing pull_request.user.login', async () => {
    const invalid = {
      action: 'closed',
      pull_request: {
        id: 12345,
        number: 42,
        title: 'Test',
        user: {},
        merged_at: '2025-01-15T10:00:00Z',
        created_at: '2025-01-14T10:00:00Z',
        closed_at: null,
      },
      repository: {
        id: 1,
        name: 'test',
        full_name: 'test/test',
        owner: { login: 'test' },
      },
    };

    const res = await request(app)
      .post('/api/v1/webhooks/github')
      .send(invalid);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation Error');
    expect(res.body.details[0].path).toContain('pull_request');
    expect(res.body.details[0].path).toContain('user');
    expect(res.body.details[0].path).toContain('login');
  });

  it('should return 400 when payload is missing action', async () => {
    const invalid = {
      pull_request: {
        id: 12345,
        number: 42,
        title: 'Test',
        user: { login: 'testuser', id: 98765 },
        merged_at: '2025-01-15T10:00:00Z',
        created_at: '2025-01-14T10:00:00Z',
        closed_at: null,
      },
      repository: {
        id: 1,
        name: 'test',
        full_name: 'test/test',
        owner: { login: 'test' },
      },
    };

    const res = await request(app)
      .post('/api/v1/webhooks/github')
      .send(invalid);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation Error');
  });

  it('should return 400 for completely empty payload', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/github')
      .send({});

    expect(res.status).toBe(400);
  });
});
