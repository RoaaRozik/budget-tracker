/**
 * Income Model
 * Represents a single income transaction
 */
export interface Income {
  id: number;
  userId: number; // Links income to a user
  amount: number;
  source: string; // e.g., "Salary", "Freelance", "Investment"
  description?: string;
  date: Date;
}

