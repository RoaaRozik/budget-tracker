
export interface Income {
  id: number;
  userId: number;
  amount: number;
  source: string; 
  description?: string;
  date: Date;
}

