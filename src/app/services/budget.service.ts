import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Budget } from '../models/budget.model';


@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = 'api/budgets';

  constructor(private http: HttpClient) {}


  getBudgets(userId: number): Observable<Budget[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<Budget[]>(this.apiUrl, { params }).pipe(
      map(budgets => budgets.map(budget => ({
        ...budget,
        createdAt: new Date(budget.createdAt)
      })))
    );
  }

  getBudgetById(id: number): Observable<Budget> {
    return this.http.get<Budget>(`${this.apiUrl}/${id}`).pipe(
      map(budget => ({
        ...budget,
        createdAt: new Date(budget.createdAt)
      }))
    );
  }

 
  getBudgetByMonth(userId: number, month: number, year: number): Observable<Budget | null> {
    return this.getBudgets(userId).pipe(
      map(budgets => {
        const budget = budgets.find(b => b.month === month && b.year === year);
        return budget || null;
      })
    );
  }

  createBudget(budget: Omit<Budget, 'id'>): Observable<Budget> {
    return this.http.post<Budget>(this.apiUrl, budget).pipe(
      map(b => ({
        ...b,
        createdAt: new Date(b.createdAt)
      }))
    );
  }


  updateBudget(id: number, budget: Partial<Budget>): Observable<Budget> {
    return this.http.put<Budget>(`${this.apiUrl}/${id}`, budget).pipe(
      map(b => ({
        ...b,
        createdAt: new Date(b.createdAt)
      }))
    );
  }


  deleteBudget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

