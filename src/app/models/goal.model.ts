/**
 * Goal Model
 * Represents a financial savings goal
 */
export interface Goal {
  id: number;
  userId: number; // Links goal to a user
  title: string;
  description?: string;
  targetAmount: number; // Total amount to save
  currentAmount: number; // Amount saved so far
  targetDate: Date; // When the goal should be achieved
  createdAt: Date;
}

