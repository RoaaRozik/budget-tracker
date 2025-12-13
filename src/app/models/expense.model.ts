/**
 * Expense Model
 * Represents a single expense transaction
 */
export interface Expense {
  id: number;
  userId: number; // Links expense to a user
  amount: number;
  category: string;
  description: string;
  date: Date;
  isRecurring: boolean; // Whether this expense repeats monthly
  recurringFrequency?: string; // e.g., "monthly", "weekly"
}

