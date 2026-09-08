import { describe, it, expect, expectTypeOf } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type {
  TransactionType,
  Category,
  MonthlyBudget,
  Transaction,
  CategoryStatus,
  SummaryDeviation,
  CategoryMetrics,
  CategoryMetricsItem,
  MonthlySummary,
} from '@/core/types';
import { TRANSACTION_TYPES, CATEGORY_STATUSES, SUMMARY_DEVIATIONS } from '@/core/types';

describe('Financial Domain Types (TASK-06)', () => {
  describe('TransactionType', () => {
    it('defines the correct literal values and array', () => {
      expect(TRANSACTION_TYPES).toEqual(['income', 'expense']);
      expectTypeOf<TransactionType>().toEqualTypeOf<'income' | 'expense'>();
    });
  });

  describe('CategoryStatus', () => {
    it('defines all 5 semantic category execution statuses', () => {
      expect(CATEGORY_STATUSES).toEqual([
        'normal',
        'overbudget',
        'unbudgeted_expense',
        'unbudgeted_income',
        'unbudgeted_idle',
      ]);
      expectTypeOf<CategoryStatus>().toEqualTypeOf<
        'normal' | 'overbudget' | 'unbudgeted_expense' | 'unbudgeted_income' | 'unbudgeted_idle'
      >();
    });
  });

  describe('SummaryDeviation', () => {
    it('defines all 3 summary deviation outcomes', () => {
      expect(SUMMARY_DEVIATIONS).toEqual(['favorable', 'unfavorable', 'neutral']);
      expectTypeOf<SummaryDeviation>().toEqualTypeOf<'favorable' | 'unfavorable' | 'neutral'>();
    });
  });

  describe('Category Interface', () => {
    it('satisfies the pure domain model specification', () => {
      const sampleCategory: Category = {
        id: 'cat_123',
        name: 'Alimentación',
        type: 'expense',
        createdAt: 1772928000000,
        updatedAt: 1772928000000,
      };

      expect(sampleCategory.id).toBe('cat_123');
      expect(sampleCategory.name).toBe('Alimentación');
      expect(sampleCategory.type).toBe('expense');
      expectTypeOf(sampleCategory).toMatchTypeOf<Category>();
    });
  });

  describe('MonthlyBudget Interface', () => {
    it('satisfies the budget domain model with integer cents and period', () => {
      const sampleBudget: MonthlyBudget = {
        id: 'bdg_123',
        categoryId: 'cat_123',
        yearMonth: '2026-03',
        amountCents: 4500000,
        createdAt: 1772928000000,
        updatedAt: 1772928000000,
      };

      expect(sampleBudget.yearMonth).toBe('2026-03');
      expect(sampleBudget.amountCents).toBe(4500000);
      expectTypeOf(sampleBudget).toMatchTypeOf<MonthlyBudget>();
    });
  });

  describe('Transaction Interface', () => {
    it('satisfies the transaction domain model with integer cents and calendar date', () => {
      const sampleTransaction: Transaction = {
        id: 'tx_123',
        categoryId: 'cat_123',
        type: 'expense',
        amountCents: 12550,
        date: '2026-03-08',
        yearMonth: '2026-03',
        note: 'Supermercado semanal',
        createdAt: 1772949600000,
        updatedAt: 1772949600000,
      };

      expect(sampleTransaction.amountCents).toBe(12550);
      expect(sampleTransaction.date).toBe('2026-03-08');
      expect(sampleTransaction.note).toBe('Supermercado semanal');
      expectTypeOf(sampleTransaction).toMatchTypeOf<Transaction>();
    });

    it('allows null notes in Transaction', () => {
      const transactionWithoutNote: Transaction = {
        id: 'tx_124',
        categoryId: 'cat_123',
        type: 'expense',
        amountCents: 5000,
        date: '2026-03-08',
        yearMonth: '2026-03',
        note: null,
        createdAt: 1772949600000,
        updatedAt: 1772949600000,
      };

      expect(transactionWithoutNote.note).toBeNull();
    });
  });

  describe('CategoryMetrics & MonthlySummary Interfaces', () => {
    it('validates CategoryMetrics structure', () => {
      const metrics: CategoryMetrics = {
        budgetCents: 10000,
        actualCents: 12000,
        remainingCents: -2000,
        percentage: 120.0,
        status: 'overbudget',
      };

      expect(metrics.status).toBe('overbudget');
      expectTypeOf(metrics).toMatchTypeOf<CategoryMetrics>();
    });

    it('validates CategoryMetricsItem structure', () => {
      const item: CategoryMetricsItem = {
        type: 'expense',
        budgetCents: 10000,
        actualCents: 8000,
      };

      expect(item.type).toBe('expense');
      expectTypeOf(item).toMatchTypeOf<CategoryMetricsItem>();
    });

    it('validates MonthlySummary structure', () => {
      const summary: MonthlySummary = {
        totalPlannedIncome: 500000,
        totalPlannedExpense: 300000,
        netPlannedBalance: 200000,
        totalActualIncome: 520000,
        totalActualExpense: 280000,
        netActualBalance: 240000,
        netDeviation: 40000,
        deviationType: 'favorable',
      };

      expect(summary.deviationType).toBe('favorable');
      expectTypeOf(summary).toMatchTypeOf<MonthlySummary>();
    });
  });

  describe('Clean Architecture and Core Purity (Principle 3)', () => {
    it('src/core/types.ts contains no imports of React, Next.js, or database libraries', () => {
      const typesFilePath = path.join(process.cwd(), 'src', 'core', 'types.ts');
      expect(fs.existsSync(typesFilePath)).toBe(true);

      const content = fs.readFileSync(typesFilePath, 'utf8');
      expect(content).not.toMatch(/from\s+['"]react['"]/i);
      expect(content).not.toMatch(/from\s+['"]next['"]/i);
      expect(content).not.toMatch(/from\s+['"]drizzle-orm['"]/i);
      expect(content).not.toMatch(/from\s+['"]better-sqlite3['"]/i);
      expect(content).not.toMatch(/import\s+.*from/i); // Pure types, zero imports needed
    });
  });
});
