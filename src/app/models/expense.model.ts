
export interface Expense {
  id: number;
  userId: number;
  amount: number;
  category: string;
  description: string;
  date: Date;
  isRecurring: boolean; 
  recurringFrequency?: string; 
}

