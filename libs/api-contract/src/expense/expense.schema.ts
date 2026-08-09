import { z } from 'zod';

export const expenseSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  category: z.string().min(1),
  amountEur: z.number().nonnegative(),
  spentOn: z.string().datetime(),
  plantIds: z.array(z.string().uuid()),
  createdAt: z.string().datetime(),
});

export type Expense = z.infer<typeof expenseSchema>;

export const createExpenseSchema = z.object({
  label: z.string().min(1),
  category: z.string().min(1),
  amountEur: z.number().nonnegative(),
  spentOn: z.string().datetime(),
  plantIds: z.array(z.string().uuid()).default([]),
});

export type CreateExpensePayload = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema.partial();

export type UpdateExpensePayload = z.infer<typeof updateExpenseSchema>;
