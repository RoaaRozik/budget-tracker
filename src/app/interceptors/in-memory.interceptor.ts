import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

/**
 * In-Memory HTTP Interceptor
 * Intercepts HTTP requests to /api/* and returns mock data
 * This replaces the in-memory-web-api module which doesn't work well with standalone apps
 */

// In-memory database
let users: any[] = [
  {
    id: 1,
    email: 'demo@example.com',
    password: 'demo123',
    firstName: 'Demo',
    lastName: 'User',
    createdAt: new Date('2024-01-01')
  }
];

let expenses: any[] = [
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

let incomes: any[] = [
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

let budgets: any[] = [
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

let goals: any[] = [
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

// Helper function to get next ID
function getNextId(collection: any[]): number {
  return collection.length > 0
    ? Math.max(...collection.map(item => item.id)) + 1
    : 1;
}

export const inMemoryInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const url = req.url;
  
  // Only intercept /api/* requests
  if (!url.startsWith('/api/') && !url.startsWith('api/')) {
    return next(req);
  }

  console.log('🟢 INTERCEPTOR: Intercepting request to:', url);
  console.log('🟢 INTERCEPTOR: Method:', req.method);

  // Parse the URL
  const urlWithoutApi = url.replace(/^\/?api\//, '');
  const urlWithoutQuery = urlWithoutApi.split('?')[0];
  const urlParts = urlWithoutQuery.split('/');
  const collection = urlParts[0]; // users, expenses, etc.
  const id = urlParts[1] ? parseInt(urlParts[1]) : null;
  
  // Parse query parameters
  const queryString = url.includes('?') ? url.split('?')[1] : '';
  const queryParams = new URLSearchParams(queryString);

  // Handle GET requests
  if (req.method === 'GET') {
    let data: any[] = [];
    
    switch (collection) {
      case 'users':
        data = users;
        break;
      case 'expenses':
        data = expenses;
        // Filter by userId if query param exists
        const expenseUserId = queryParams.get('userId');
        if (expenseUserId) {
          data = data.filter(e => e.userId === parseInt(expenseUserId));
        }
        break;
      case 'incomes':
        data = incomes;
        const incomeUserId = queryParams.get('userId');
        if (incomeUserId) {
          data = data.filter(i => i.userId === parseInt(incomeUserId));
        }
        break;
      case 'budgets':
        data = budgets;
        const budgetUserId = queryParams.get('userId');
        if (budgetUserId) {
          data = data.filter(b => b.userId === parseInt(budgetUserId));
        }
        break;
      case 'goals':
        data = goals;
        const goalUserId = queryParams.get('userId');
        if (goalUserId) {
          data = data.filter(g => g.userId === parseInt(goalUserId));
        }
        break;
      default:
        return next(req);
    }

    // If ID is specified, return single item
    if (id) {
      const item = data.find(d => d.id === id);
      if (item) {
        console.log('🟢 INTERCEPTOR: Returning item:', item);
        return of(new HttpResponse({ status: 200, body: item }));
      } else {
        return of(new HttpResponse({ status: 404, body: { error: 'Not found' } }));
      }
    }

    console.log('🟢 INTERCEPTOR: Returning collection:', data);
    return of(new HttpResponse({ status: 200, body: data }));
  }

  // Handle POST requests (create)
  if (req.method === 'POST') {
    const newItem = { ...req.body, id: 0 };
    
    switch (collection) {
      case 'users':
        newItem.id = getNextId(users);
        users.push(newItem);
        console.log('🟢 INTERCEPTOR: Created user:', newItem);
        return of(new HttpResponse({ status: 201, body: newItem }));
      case 'expenses':
        newItem.id = getNextId(expenses);
        expenses.push(newItem);
        console.log('🟢 INTERCEPTOR: Created expense:', newItem);
        return of(new HttpResponse({ status: 201, body: newItem }));
      case 'incomes':
        newItem.id = getNextId(incomes);
        incomes.push(newItem);
        console.log('🟢 INTERCEPTOR: Created income:', newItem);
        return of(new HttpResponse({ status: 201, body: newItem }));
      case 'budgets':
        newItem.id = getNextId(budgets);
        budgets.push(newItem);
        console.log('🟢 INTERCEPTOR: Created budget:', newItem);
        return of(new HttpResponse({ status: 201, body: newItem }));
      case 'goals':
        newItem.id = getNextId(goals);
        goals.push(newItem);
        console.log('🟢 INTERCEPTOR: Created goal:', newItem);
        return of(new HttpResponse({ status: 201, body: newItem }));
      default:
        return next(req);
    }
  }

  // Handle PUT requests (update)
  if (req.method === 'PUT' && id) {
    let collectionData: any[] = [];
    
    switch (collection) {
      case 'users':
        collectionData = users;
        break;
      case 'expenses':
        collectionData = expenses;
        break;
      case 'incomes':
        collectionData = incomes;
        break;
      case 'budgets':
        collectionData = budgets;
        break;
      case 'goals':
        collectionData = goals;
        break;
      default:
        return next(req);
    }

    const index = collectionData.findIndex(item => item.id === id);
    if (index !== -1) {
      collectionData[index] = { ...collectionData[index], ...req.body };
      console.log('🟢 INTERCEPTOR: Updated item:', collectionData[index]);
      return of(new HttpResponse({ status: 200, body: collectionData[index] }));
    } else {
      return of(new HttpResponse({ status: 404, body: { error: 'Not found' } }));
    }
  }

  // Handle DELETE requests
  if (req.method === 'DELETE' && id) {
    let collectionData: any[] = [];
    
    switch (collection) {
      case 'users':
        collectionData = users;
        break;
      case 'expenses':
        collectionData = expenses;
        break;
      case 'incomes':
        collectionData = incomes;
        break;
      case 'budgets':
        collectionData = budgets;
        break;
      case 'goals':
        collectionData = goals;
        break;
      default:
        return next(req);
    }

    const index = collectionData.findIndex(item => item.id === id);
    if (index !== -1) {
      collectionData.splice(index, 1);
      console.log('🟢 INTERCEPTOR: Deleted item with id:', id);
      return of(new HttpResponse({ status: 200, body: {} }));
    } else {
      return of(new HttpResponse({ status: 404, body: { error: 'Not found' } }));
    }
  }

  // If we can't handle it, pass through
  return next(req);
};

