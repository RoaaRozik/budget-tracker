/**
 * Budget Category Model
 * Represents a single category within a budget
 */
export interface BudgetCategory {
  category: string;
  limit: number; // Maximum amount allocated for this category
}

/**
 * Budget Model
 * Represents a monthly budget with multiple categories
 */
export interface Budget {
  id: number;
  userId: number; // Links budget to a user
  month: number; // 1-12
  year: number;
  totalIncome: number; // Expected income for this month
  categories: BudgetCategory[]; // Array of category limits
  createdAt: Date;
}

