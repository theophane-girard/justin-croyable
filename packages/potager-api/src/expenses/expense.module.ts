import {
  expenseContract,
  type CreateExpensePayload,
  type Expense,
  type UpdateExpensePayload,
} from '@justin-croyable/api-contract';
import { Controller, Inject, Injectable, Module, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { and, eq } from 'drizzle-orm';

import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { type Database, DRIZZLE } from '../db/drizzle';
import { expenses, type ExpenseRecord, type UserRecord } from '../db/schema';

function toExpense(record: ExpenseRecord): Expense {
  return {
    id: record.id,
    label: record.label,
    category: record.category,
    amountEur: record.amountEur,
    spentOn: record.spentOn.toISOString(),
    plantIds: record.plantIds,
    createdAt: record.createdAt.toISOString(),
  };
}

@Injectable()
export class ExpenseService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(userId: string): Promise<Expense[]> {
    const rows = await this.db.select().from(expenses).where(eq(expenses.userId, userId));
    return rows.map(toExpense);
  }

  async create(userId: string, payload: CreateExpensePayload): Promise<Expense> {
    const [created] = await this.db
      .insert(expenses)
      .values({
        userId,
        label: payload.label,
        category: payload.category,
        amountEur: payload.amountEur,
        spentOn: new Date(payload.spentOn),
        plantIds: [...payload.plantIds],
      })
      .returning();
    return toExpense(created);
  }

  async update(userId: string, id: string, payload: UpdateExpensePayload): Promise<Expense | null> {
    const [updated] = await this.db
      .update(expenses)
      .set({
        ...(payload.label !== undefined ? { label: payload.label } : {}),
        ...(payload.category !== undefined ? { category: payload.category } : {}),
        ...(payload.amountEur !== undefined ? { amountEur: payload.amountEur } : {}),
        ...(payload.spentOn !== undefined ? { spentOn: new Date(payload.spentOn) } : {}),
        ...(payload.plantIds !== undefined ? { plantIds: [...payload.plantIds] } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return updated ? toExpense(updated) : null;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning({ id: expenses.id });
    return Boolean(deleted);
  }
}

@Controller()
@UseGuards(FirebaseAuthGuard)
export class ExpenseController {
  constructor(private readonly expenses: ExpenseService) {}

  @TsRestHandler(expenseContract)
  async handler(@CurrentUser() user: UserRecord) {
    return tsRestHandler(expenseContract, {
      list: async () => ({ status: 200, body: await this.expenses.list(user.id) }),
      create: async ({ body }) => ({ status: 201, body: await this.expenses.create(user.id, body) }),
      update: async ({ params, body }) => {
        const updated = await this.expenses.update(user.id, params.id, body);
        if (!updated) {
          return { status: 404, body: { message: 'Dépense introuvable.' } };
        }
        return { status: 200, body: updated };
      },
      remove: async ({ params }) => {
        const removed = await this.expenses.remove(user.id, params.id);
        if (!removed) {
          return { status: 404, body: { message: 'Dépense introuvable.' } };
        }
        return { status: 200, body: { id: params.id } };
      },
    });
  }
}

@Module({ controllers: [ExpenseController], providers: [ExpenseService] })
export class ExpenseModule {}
