
export interface Goal {
  id: number;
  userId: number; 
  title: string;
  description?: string;
  targetAmount: number; 
  currentAmount: number; 
  targetDate: Date; 
  createdAt: Date;
}

