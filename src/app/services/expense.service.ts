import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Expense } from '../models/expense.model';

/**
 * Expense Service
 * Handles all CRUD operations for expenses
 * Uses HTTP client to communicate with the API
 */
@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = 'api/expenses';

  constructor(private http: HttpClient) {}

  /**
   * Get all expenses for the current user
   * GET /api/expenses?userId=X
   */
  getExpenses(userId: number): Observable<Expense[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<Expense[]>(this.apiUrl, { params }).pipe(
      map(expenses => expenses.map(exp => ({
        ...exp,
        date: new Date(exp.date) // Convert date string to Date object
      })))
    );
  }

  /**
   * Get expense by ID
   * GET /api/expenses/:id
   */
  getExpenseById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/${id}`).pipe(
      map(exp => ({
        ...exp,
        date: new Date(exp.date)
      }))
    );
  }

  /**
   * Get expenses by category
   * GET /api/expenses?userId=X&category=Y
   */
  getExpensesByCategory(userId: number, category: string): Observable<Expense[]> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('category', category);
    return this.http.get<Expense[]>(this.apiUrl, { params }).pipe(
      map(expenses => expenses.map(exp => ({
        ...exp,
        date: new Date(exp.date)
      })))
    );
  }

  /**
   * Get expenses for a specific month
   * GET /api/expenses?userId=X
   * Then filter by month
   */
  getExpensesByMonth(userId: number, month: number, year: number): Observable<Expense[]> {
    return this.getExpenses(userId).pipe(
      map(expenses => expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() + 1 === month && expDate.getFullYear() === year;
      }))
    );
  }

  /**
   * Create a new expense
   * POST /api/expenses
   */
  createExpense(expense: Omit<Expense, 'id'>): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, expense).pipe(
      map(exp => ({
        ...exp,
        date: new Date(exp.date)
      }))
    );
  }

  /**
   * Update an existing expense
   * PUT /api/expenses/:id
   */
  updateExpense(id: number, expense: Partial<Expense>): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/${id}`, expense).pipe(
      map(exp => ({
        ...exp,
        date: new Date(exp.date)
      }))
    );
  }

  /**
   * Delete an expense
   * DELETE /api/expenses/:id
   */
  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

