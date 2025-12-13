import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Budget } from '../models/budget.model';

/**
 * Budget Service
 * Handles all CRUD operations for budgets
 */
@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = 'api/budgets';

  constructor(private http: HttpClient) {}

  /**
   * Get all budgets for the current user
   */
  getBudgets(userId: number): Observable<Budget[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<Budget[]>(this.apiUrl, { params }).pipe(
      map(budgets => budgets.map(budget => ({
        ...budget,
        createdAt: new Date(budget.createdAt)
      })))
    );
  }

  /**
   * Get budget by ID
   */
  getBudgetById(id: number): Observable<Budget> {
    return this.http.get<Budget>(`${this.apiUrl}/${id}`).pipe(
      map(budget => ({
        ...budget,
        createdAt: new Date(budget.createdAt)
      }))
    );
  }

  /**
   * Get budget for a specific month and year
   */
  getBudgetByMonth(userId: number, month: number, year: number): Observable<Budget | null> {
    return this.getBudgets(userId).pipe(
      map(budgets => {
        const budget = budgets.find(b => b.month === month && b.year === year);
        return budget || null;
      })
    );
  }

  /**
   * Create a new budget
   */
  createBudget(budget: Omit<Budget, 'id'>): Observable<Budget> {
    return this.http.post<Budget>(this.apiUrl, budget).pipe(
      map(b => ({
        ...b,
        createdAt: new Date(b.createdAt)
      }))
    );
  }

  /**
   * Update an existing budget
   */
  updateBudget(id: number, budget: Partial<Budget>): Observable<Budget> {
    return this.http.put<Budget>(`${this.apiUrl}/${id}`, budget).pipe(
      map(b => ({
        ...b,
        createdAt: new Date(b.createdAt)
      }))
    );
  }

  /**
   * Delete a budget
   */
  deleteBudget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

