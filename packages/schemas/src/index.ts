import { z } from 'zod';
export const organizationIdSchema = z.uuid();
export const createMemberSchema = z.object({
  organizationId: z.uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email().optional(),
  birthDate: z.string().date().optional(),
});
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
