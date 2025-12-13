import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Income } from '../models/income.model';

/**
 * Income Service
 * Handles all CRUD operations for income
 */
@Injectable({
  providedIn: 'root'
})
export class IncomeService {
  private apiUrl = 'api/incomes';

  constructor(private http: HttpClient) {}

  /**
   * Get all income for the current user
   */
  getIncomes(userId: number): Observable<Income[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<Income[]>(this.apiUrl, { params }).pipe(
      map(incomes => incomes.map(inc => ({
        ...inc,
        date: new Date(inc.date)
      })))
    );
  }

  /**
   * Get income by ID
   */
  getIncomeById(id: number): Observable<Income> {
    return this.http.get<Income>(`${this.apiUrl}/${id}`).pipe(
      map(inc => ({
        ...inc,
        date: new Date(inc.date)
      }))
    );
  }

  /**
   * Get income for a specific month
   */
  getIncomesByMonth(userId: number, month: number, year: number): Observable<Income[]> {
    return this.getIncomes(userId).pipe(
      map(incomes => incomes.filter(inc => {
        const incDate = new Date(inc.date);
        return incDate.getMonth() + 1 === month && incDate.getFullYear() === year;
      }))
    );
  }

  /**
   * Create a new income
   */
  createIncome(income: Omit<Income, 'id'>): Observable<Income> {
    return this.http.post<Income>(this.apiUrl, income).pipe(
      map(inc => ({
        ...inc,
        date: new Date(inc.date)
      }))
    );
  }

  /**
   * Update an existing income
   */
  updateIncome(id: number, income: Partial<Income>): Observable<Income> {
    return this.http.put<Income>(`${this.apiUrl}/${id}`, income).pipe(
      map(inc => ({
        ...inc,
        date: new Date(inc.date)
      }))
    );
  }

  /**
   * Delete an income
   */
  deleteIncome(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

