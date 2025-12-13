import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { User } from '../models/user.model';

/**
 * Authentication Service
 * Handles user authentication (login, register, logout)
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'api/users';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }

  /**
   * Register a new user
   */
  register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Observable<User> {
    // First, get all existing users to check for duplicates
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(() => of([])), // If GET fails, assume no users exist
      switchMap(existingUsers => {
        // Check if email already exists (case-insensitive)
        const emailLower = userData.email.toLowerCase().trim();
        const exists = existingUsers.some(u => 
          u.email && u.email.toLowerCase().trim() === emailLower
        );
        
        if (exists) {
          return throwError(() => new Error('A user with this email already exists'));
        }
        
        // Create new user
        return this.http.post<User>(this.apiUrl, {
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          createdAt: new Date()
        });
      })
      // Note: We don't auto-login after registration - user must log in manually
    );
  }

  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<User | null> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(() => {
        // If request fails, return empty array
        return of([]);
      }),
      map(users => {
        // Find user by email and password (case-insensitive email)
        const emailLower = email.toLowerCase().trim();
        const user = users.find(u => 
          u.email && 
          u.email.toLowerCase().trim() === emailLower && 
          u.password === password
        );
        
        if (user) {
          this.setCurrentUser(user);
          return user;
        } else {
          this.currentUserSubject.next(null);
          return null;
        }
      })
    );
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }
}
