import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Goal } from '../models/goal.model';


@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private apiUrl = 'api/goals';

  constructor(private http: HttpClient) {}

  getGoals(userId: number): Observable<Goal[]> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<Goal[]>(this.apiUrl, { params }).pipe(
      map(goals => goals.map(goal => ({
        ...goal,
        targetDate: new Date(goal.targetDate),
        createdAt: new Date(goal.createdAt)
      })))
    );
  }


  getGoalById(id: number): Observable<Goal> {
    return this.http.get<Goal>(`${this.apiUrl}/${id}`).pipe(
      map(goal => ({
        ...goal,
        targetDate: new Date(goal.targetDate),
        createdAt: new Date(goal.createdAt)
      }))
    );
  }


  createGoal(goal: Omit<Goal, 'id'>): Observable<Goal> {
    return this.http.post<Goal>(this.apiUrl, goal).pipe(
      map(g => ({
        ...g,
        targetDate: new Date(g.targetDate),
        createdAt: new Date(g.createdAt)
      }))
    );
  }


  updateGoal(id: number, goal: Partial<Goal>): Observable<Goal> {
    return this.http.put<Goal>(`${this.apiUrl}/${id}`, goal).pipe(
      map(g => ({
        ...g,
        targetDate: new Date(g.targetDate),
        createdAt: new Date(g.createdAt)
      }))
    );
  }


  deleteGoal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


  updateGoalProgress(id: number, amount: number): Observable<Goal> {
    return this.getGoalById(id).pipe(
      
      map(goal => ({
        ...goal,
        currentAmount: Math.max(0, goal.currentAmount + amount) 
      })),
      map(updatedGoal => this.updateGoal(id, { currentAmount: updatedGoal.currentAmount }))
    ) as any; 
  }
}

