
export interface BudgetCategory {
  category: string;
  limit: number; 
}


export interface Budget {
  id: number;
  userId: number; 
  month: number; 
  year: number;
  totalIncome: number; 
  categories: BudgetCategory[];
  createdAt: Date;
}

