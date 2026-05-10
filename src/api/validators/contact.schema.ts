import { z } from 'zod';

export const createContactSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateContactSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  subscribed: z.boolean().optional(),
});

export const listContactsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  subscribed: z.coerce.boolean().optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ListContactsInput = z.infer<typeof listContactsSchema>;