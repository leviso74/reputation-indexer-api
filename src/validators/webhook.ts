import { z } from 'zod/v3';

export const githubWebhookSchema = z.object({
  action: z.string({
    required_error: 'action is required',
    invalid_type_error: 'action must be a string',
  }),
  pull_request: z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    user: z.object({
      login: z.string({
        required_error: 'pull_request.user.login is required',
        invalid_type_error: 'pull_request.user.login must be a string',
      }),
      id: z.number(),
    }),
    merged_at: z.string().nullable(),
    created_at: z.string(),
    closed_at: z.string().nullable(),
    additions: z.number().optional(),
    deletions: z.number().optional(),
    changed_files: z.number().optional(),
  }),
  repository: z.object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
    owner: z.object({
      login: z.string(),
    }),
  }),
  sender: z.object({
    login: z.string(),
    id: z.number(),
  }).optional(),
});

export type GitHubWebhookPayload = z.infer<typeof githubWebhookSchema>;
