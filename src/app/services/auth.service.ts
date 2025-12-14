import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { User } from '../models/user.model';


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

 
  register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Observable<User> {
    
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(() => of([])), 
      switchMap(existingUsers => {
        
        const emailLower = userData.email.toLowerCase().trim();
        const exists = existingUsers.some(u => 
          u.email && u.email.toLowerCase().trim() === emailLower
        );
        
        if (exists) {
          return throwError(() => new Error('A user with this email already exists'));
        }
        
        
        return this.http.post<User>(this.apiUrl, {
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          createdAt: new Date()
        });
      })
      
    );
  }


  login(email: string, password: string): Observable<User | null> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(() => {
     
        return of([]);
      }),
      map(users => {
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
