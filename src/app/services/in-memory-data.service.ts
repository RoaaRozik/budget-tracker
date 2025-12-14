import { InMemoryDbService } from 'angular-in-memory-web-api';
import { User } from '../models/user.model';
import { Expense } from '../models/expense.model';
import { Income } from '../models/income.model';
import { Budget } from '../models/budget.model';
import { Goal } from '../models/goal.model';


export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const users: User[] = [
      {
        id: 1,
        email: 'demo@example.com',
        password: 'demo123',
        firstName: 'Demo',
        lastName: 'User',
        createdAt: new Date('2024-01-01')
      }
    ];

    const expenses: Expense[] = [
      {
        id: 1,
        userId: 1,
        amount: 1200,
        category: 'Housing',
        description: 'Monthly rent',
        date: new Date('2024-01-05'),
        isRecurring: true,
        recurringFrequency: 'monthly'
      },
      {
        id: 2,
        userId: 1,
        amount: 150,
        category: 'Food',
        description: 'Grocery shopping',
        date: new Date('2024-01-10'),
        isRecurring: false
      },
      {
        id: 3,
        userId: 1,
        amount: 80,
        category: 'Transportation',
        description: 'Gas and parking',
        date: new Date('2024-01-15'),
        isRecurring: false
      },
      {
        id: 4,
        userId: 1,
        amount: 200,
        category: 'Food',
        description: 'Restaurant meals',
        date: new Date('2024-01-20'),
        isRecurring: false
      },
      {
        id: 5,
        userId: 1,
        amount: 100,
        category: 'Entertainment',
        description: 'Movie tickets and streaming',
        date: new Date('2024-01-25'),
        isRecurring: false
      }
    ];


    const incomes: Income[] = [
      {
        id: 1,
        userId: 1,
        amount: 5000,
        source: 'Salary',
        description: 'Monthly salary',
        date: new Date('2024-01-01')
      },
      {
        id: 2,
        userId: 1,
        amount: 500,
        source: 'Freelance',
        description: 'Web development project',
        date: new Date('2024-01-15')
      }
    ];


    const budgets: Budget[] = [
      {
        id: 1,
        userId: 1,
        month: 1, 
        year: 2024,
        totalIncome: 5500,
        categories: [
          { category: 'Housing', limit: 1200 },
          { category: 'Food', limit: 400 },
          { category: 'Transportation', limit: 200 },
          { category: 'Entertainment', limit: 150 },
          { category: 'Utilities', limit: 150 },
          { category: 'Savings', limit: 3000 }
        ],
        createdAt: new Date('2024-01-01')
      }
    ];

    const goals: Goal[] = [
      {
        id: 1,
        userId: 1,
        title: 'Emergency Fund',
        description: 'Build 6 months of expenses',
        targetAmount: 10000,
        currentAmount: 2500,
        targetDate: new Date('2024-12-31'),
        createdAt: new Date('2024-01-01')
      },
      {
        id: 2,
        userId: 1,
        title: 'Vacation to Europe',
        description: 'Save for summer vacation',
        targetAmount: 5000,
        currentAmount: 1200,
        targetDate: new Date('2024-06-30'),
        createdAt: new Date('2024-01-01')
      }
    ];

    const db = { users, expenses, incomes, budgets, goals };
    console.log('🟢 IN-MEMORY-DB: Database created with', users.length, 'users');
    return db;
  }


  genId<T extends { id: number }>(collection: T[], collectionName: string): number {
    return collection.length > 0
      ? Math.max(...collection.map(item => item.id)) + 1
      : 1;
  }
}

