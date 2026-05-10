import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  subject: z.string().min(1, 'Email subject is required'),
  bodyHtml: z.string().min(1, 'Email body is required'),
  scheduledAt: z.string().datetime().optional(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  bodyHtml: z.string().min(1).optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const sendCampaignSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type SendCampaignInput = z.infer<typeof sendCampaignSchema>;