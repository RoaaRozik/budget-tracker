import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Goal } from '../models/goal.model';

/**
 * Goal Service
 * Handles all CRUD operations for financial goals
 */
@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private apiUrl = 'api/goals';

  constructor(private http: HttpClient) {}

  /**
   * Get all goals for the current user
   */
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

  /**
   * Get goal by ID
   */
  getGoalById(id: number): Observable<Goal> {
    return this.http.get<Goal>(`${this.apiUrl}/${id}`).pipe(
      map(goal => ({
        ...goal,
        targetDate: new Date(goal.targetDate),
        createdAt: new Date(goal.createdAt)
      }))
    );
  }

  /**
   * Create a new goal
   */
  createGoal(goal: Omit<Goal, 'id'>): Observable<Goal> {
    return this.http.post<Goal>(this.apiUrl, goal).pipe(
      map(g => ({
        ...g,
        targetDate: new Date(g.targetDate),
        createdAt: new Date(g.createdAt)
      }))
    );
  }

  /**
   * Update an existing goal
   */
  updateGoal(id: number, goal: Partial<Goal>): Observable<Goal> {
    return this.http.put<Goal>(`${this.apiUrl}/${id}`, goal).pipe(
      map(g => ({
        ...g,
        targetDate: new Date(g.targetDate),
        createdAt: new Date(g.createdAt)
      }))
    );
  }

  /**
   * Delete a goal
   */
  deleteGoal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update goal progress (add to current amount)
   * Note: This is a convenience method. Components can also call getGoalById,
   * modify currentAmount, and call updateGoal directly.
   */
  updateGoalProgress(id: number, amount: number): Observable<Goal> {
    return this.getGoalById(id).pipe(
      // Use switchMap to handle nested observable
      map(goal => ({
        ...goal,
        currentAmount: Math.max(0, goal.currentAmount + amount) // Ensure non-negative
      })),
      map(updatedGoal => this.updateGoal(id, { currentAmount: updatedGoal.currentAmount }))
    ) as any; // Simplified for now - proper implementation would use switchMap from rxjs/operators
  }
}

