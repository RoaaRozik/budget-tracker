import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Expense } from '../models/expense.model';


@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = 'api/expenses';

  constructor(private http: HttpClient) {}


  getExpenses(userId: number): Observable<Expense[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<Expense[]>(this.apiUrl, { params }).pipe(
      map(expenses => expenses.map(exp => ({
        ...exp,
        date: new Date(exp.date) 
      })))
    );
  }


  getExpenseById(id: number): Observable<Expense> {
    return this.http.get<Expense>(`${this.apiUrl}/${id}`).pipe(
      map(exp => ({
        ...exp,
        date: new Date(exp.date)
      }))
    );
  }


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


  getExpensesByMonth(userId: number, month: number, year: number): Observable<Expense[]> {
    return this.getExpenses(userId).pipe(
      map(expenses => expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() + 1 === month && expDate.getFullYear() === year;
      }))
    );
  }


  createExpense(expense: Omit<Expense, 'id'>): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, expense).pipe(
      map(exp => ({
        ...exp,
        date: new Date(exp.date)
      }))
    );
  }


  updateExpense(id: number, expense: Partial<Expense>): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/${id}`, expense).pipe(
      map(exp => ({
        ...exp,
        date: new Date(exp.date)
      }))
    );
  }


  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

