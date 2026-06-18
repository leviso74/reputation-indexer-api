import { githubWebhookSchema } from '../src/validators/webhook';

describe('githubWebhookSchema', () => {
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

  it('should validate a correct payload', () => {
    const result = githubWebhookSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('should reject payload missing pull_request.user.login', () => {
    const invalid = {
      ...validPayload,
      pull_request: {
        ...validPayload.pull_request,
        user: { id: 98765 },
      },
    };
    const result = githubWebhookSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const loginErrors = result.error.errors.filter(
        (e) => e.path.includes('user') && e.path.includes('login')
      );
      expect(loginErrors.length).toBeGreaterThan(0);
    }
  });

  it('should reject payload missing action', () => {
    const { action, ...withoutAction } = validPayload;
    const result = githubWebhookSchema.safeParse(withoutAction);
    expect(result.success).toBe(false);
  });

  it('should reject payload with wrong types', () => {
    const invalid = {
      ...validPayload,
      action: 123,
    };
    const result = githubWebhookSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should accept payload without sender field', () => {
    const { sender: _sender, ...withoutSender } = validPayload as any;
    const result = githubWebhookSchema.safeParse(withoutSender);
    expect(result.success).toBe(true);
  });
});
