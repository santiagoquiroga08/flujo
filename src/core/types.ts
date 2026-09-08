/**
 * Pure financial domain types for Flujo MVP.
 *
 * This module defines core entities and value types used across
 * business logic calculations and persistence models.
 *
 * Rules:
 * - No dependencies on React, Next.js, or database libraries (Principio 3).
 * - Code and identifiers strictly in English (Principio 6).
 */

/**
 * Domain transaction type classifying the nature of a financial movement or category.
 * CA-1.1: Immutable once assigned.
 */
export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/**
 * Semantic execution status of a category within a calendar month.
 * CA-4.4: Defines boundary states including overbudget and unbudgeted movements.
 */
export const CATEGORY_STATUSES = [
  'normal',
  'overbudget',
  'unbudgeted_expense',
  'unbudgeted_income',
  'unbudgeted_idle',
] as const;
export type CategoryStatus = (typeof CATEGORY_STATUSES)[number];

/**
 * Consolidated monthly summary deviation result.
 * CA-5.1: Evaluates net actual balance against net planned balance.
 */
export const SUMMARY_DEVIATIONS = ['favorable', 'unfavorable', 'neutral'] as const;
export type SummaryDeviation = (typeof SUMMARY_DEVIATIONS)[number];

/**
 * Global financial category entity (RF-1).
 */
export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  createdAt: Date | number;
  updatedAt: Date | number;
}

/**
 * Monthly budget allocation entity per category and period (RF-2).
 * Period is formatted as 'YYYY-MM' with amount stored in integer cents.
 */
export interface MonthlyBudget {
  id: string;
  categoryId: string;
  yearMonth: string;
  amountCents: number;
  createdAt: Date | number;
  updatedAt: Date | number;
}

/**
 * Financial movement/transaction entity (RF-3).
 * Date is formatted as 'YYYY-MM-DD', amount stored in positive integer cents.
 */
export interface Transaction {
  id: string;
  categoryId: string;
  type: TransactionType;
  amountCents: number;
  date: string;
  yearMonth: string;
  note: string | null;
  createdAt: Date | number;
  updatedAt: Date | number;
}

/**
 * Computed financial metrics for an individual category in a month (RF-4).
 */
export interface CategoryMetrics {
  budgetCents: number;
  actualCents: number;
  remainingCents?: number;
  differenceCents?: number;
  percentage: number | null;
  status: CategoryStatus;
}

/**
 * Input item required to calculate aggregated monthly summaries.
 */
export interface CategoryMetricsItem {
  type: TransactionType;
  budgetCents: number;
  actualCents: number;
}

/**
 * Consolidated monthly summary metrics and net deviation (RF-5).
 */
export interface MonthlySummary {
  totalPlannedIncome: number;
  totalPlannedExpense: number;
  netPlannedBalance: number;
  totalActualIncome: number;
  totalActualExpense: number;
  netActualBalance: number;
  netDeviation: number;
  deviationType: SummaryDeviation;
}

/**
 * Validation and status result for calendar period navigation (RF-5).
 */
export interface PeriodNavigationResult {
  yearMonth: string;
  isFuture: boolean;
  allowsTransactions: boolean;
  allowsBudgeting: boolean;
}
