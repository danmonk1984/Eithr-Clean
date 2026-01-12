import { z } from 'zod';

export const createPollSchema = z.object({
  prompt: z.string().min(5).max(140),
  mode: z.enum(['YES_NO', 'A_B']),
  optionAImg: z.string(),
  optionBImg: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(5).max(10080)
}).superRefine((data, ctx) => {
  if (data.mode === 'A_B' && !data.optionBImg) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Option B image required for A/B polls', path: ['optionBImg'] });
  }
});

export const uploadPollSchema = z.object({
  mode: z.enum(['YES_NO', 'A_B']),
  prompt: z.string().min(5).max(140),
  durationMinutes: z.coerce.number().int().min(5).max(10080)
});
