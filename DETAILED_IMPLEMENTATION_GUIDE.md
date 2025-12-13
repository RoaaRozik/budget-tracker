# Budget Tracker - Detailed Implementation Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Application Bootstrap & Configuration](#application-bootstrap--configuration)
3. [Data Models](#data-models)
4. [Services Layer](#services-layer)
5. [Authentication System](#authentication-system)
6. [Routing & Guards](#routing--guards)
7. [In-Memory API Implementation](#in-memory-api-implementation)
8. [Component Architecture](#component-architecture)
9. [UI/UX Implementation](#uiux-implementation)
10. [Data Flow & State Management](#data-flow--state-management)

---

## Architecture Overview

### Technology Stack
- **Framework**: Angular 21 (Standalone Components)
- **UI Library**: Angular Material
- **Charts**: Chart.js + ng2-charts
- **State Management**: RxJS Observables with BehaviorSubject
- **Mock Backend**: Custom HTTP Interceptor (in-memory API)
- **Forms**: Reactive Forms with FormBuilder
- **Routing**: Angular Router with lazy loading

### Project Structure Philosophy

I organized this project following Angular best practices with a clear separation of concerns:

```
src/app/
├── components/     # Feature components (UI layer)
├── services/       # Business logic & data access
├── models/         # TypeScript interfaces (data contracts)
├── guards/         # Route protection
├── interceptors/   # HTTP request/response manipulation
├── pipes/          # Data transformation utilities
└── directives/     # DOM manipulation utilities
```

**Why Standalone Components?**
- Modern Angular approach (v15+)
- No NgModules needed - components manage their own dependencies
- Better tree-shaking and smaller bundle sizes
- Simpler import structure

---

## Application Bootstrap & Configuration

### Entry Point: `main.ts`

```typescript
bootstrapApplication(App, appConfig)
```

This is the modern Angular bootstrap approach. Instead of bootstrapping an NgModule, we bootstrap the root `App` component directly with `appConfig`.

### App Configuration: `app.config.ts`

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),  // Global error handling
    provideRouter(routes),                 // Router configuration
    provideHttpClient(                     // HTTP client with interceptor
      withInterceptors([inMemoryInterceptor])
    ),
    provideAnimations()                   // Material animations
  ]
};
```

**Key Decisions:**
1. **Functional Interceptors**: Using `withInterceptors()` instead of class-based interceptors (Angular 15+ pattern)
2. **Lazy Loading Routes**: All routes use `loadComponent()` for code splitting
3. **Global Error Listeners**: Catches unhandled errors application-wide

### Root Component: `app.ts`

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
```

**Design Pattern**: Minimal root component
- Only contains navigation and router outlet
- All business logic lives in feature components
- Navigation is always visible (persistent across routes)

### Routing: `app.routes.ts`

```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'login',
    loadComponent: () => import('./components/login/login.component')
      .then(m => m.LoginComponent)
  },
  // ... other routes with canActivate: [authGuard]
];
```

**Route Protection Strategy:**
- Public routes: `/login`, `/register` (no guard)
- Protected routes: All feature routes use `authGuard`
- Default redirect: Empty path → `/dashboard`
- Wildcard: `**` → `/dashboard` (catch-all for 404s)

**Why Lazy Loading?**
- Each component loads only when needed
- Reduces initial bundle size
- Better performance for large applications

---

## Data Models

### Model Design Philosophy

I created TypeScript interfaces (not classes) because:
1. **Compile-time type safety** without runtime overhead
2. **JSON serialization** works seamlessly
3. **No methods needed** - models are pure data structures

### User Model

```typescript
export interface User {
  id: number;
  email: string;
  password: string;  // ⚠️ In production, this would be hashed
  firstName: string;
  lastName: string;
  createdAt: Date;
}
```

**Security Note**: In production, passwords should NEVER be stored in plain text. This is a demo app.

### Budget Model

```typescript
export interface Budget {
  id: number;
  userId: number;           // Foreign key to User
  month: number;             // 1-12
  year: number;
  totalIncome: number;
  categories: BudgetCategory[];  // Array of category limits
  createdAt: Date;
}

export interface BudgetCategory {
  category: string;
  limit: number;
}
```

**Design Decision**: Budgets are monthly entities with multiple categories. This allows:
- Flexible category management
- Easy comparison between budgeted vs actual spending
- Monthly budget planning

### Expense Model

```typescript
export interface Expense {
  id: number;
  userId: number;
  amount: number;
  category: string;
  description: string;
  date: Date;
  isRecurring: boolean;
  recurringFrequency?: string;  // Optional: 'monthly', 'weekly', 'yearly'
}
```

**Recurring Expenses**: The `isRecurring` flag allows users to mark expenses that repeat, useful for future budget planning.

### Income Model

```typescript
export interface Income {
  id: number;
  userId: number;
  amount: number;
  source: string;        // 'Salary', 'Freelance', etc.
  description?: string;  // Optional
  date: Date;
}
```

### Goal Model

```typescript
export interface Goal {
  id: number;
  userId: number;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;  // Progress tracking
  targetDate: Date;
  createdAt: Date;
}
```

**Progress Tracking**: `currentAmount` allows users to update progress toward their goals incrementally.

---

## Services Layer

### Service Architecture Pattern

All services follow the same pattern:
1. **Injectable** with `providedIn: 'root'` (singleton)
2. **HttpClient** for API communication
3. **Observable-based** methods (RxJS)
4. **Type-safe** with TypeScript generics
5. **Date transformation** (JSON dates → Date objects)

### AuthService: Authentication & User Management

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
}
```

**State Management Pattern:**
- `BehaviorSubject` holds current user state
- Components subscribe to `currentUser$` for reactive updates
- `localStorage` persists user across page refreshes

**Login Flow:**
```typescript
login(email: string, password: string): Observable<User | null> {
  return this.http.get<User[]>(this.apiUrl).pipe(
    map(users => {
      const user = users.find(u => 
        u.email.toLowerCase().trim() === email.toLowerCase().trim() && 
        u.password === password
      );
      if (user) {
        this.setCurrentUser(user);  // Updates BehaviorSubject + localStorage
        return user;
      }
      return null;
    })
  );
}
```

**Registration Flow:**
```typescript
register(userData): Observable<User> {
  return this.http.get<User[]>(this.apiUrl).pipe(
    switchMap(existingUsers => {
      // Check for duplicate email
      if (exists) {
        return throwError(() => new Error('Email already exists'));
      }
      // Create new user
      return this.http.post<User>(this.apiUrl, { ...userData, createdAt: new Date() });
    }),
    tap(user => this.setCurrentUser(user))  // Auto-login after registration
  );
}
```

**Why Auto-Login After Registration?**
- Better UX - user doesn't need to log in again
- Common pattern in modern web apps

### ExpenseService: CRUD Operations

```typescript
getExpenses(userId: number): Observable<Expense[]> {
  const params = new HttpParams().set('userId', userId.toString());
  return this.http.get<Expense[]>(this.apiUrl, { params }).pipe(
    map(expenses => expenses.map(exp => ({
      ...exp,
      date: new Date(exp.date)  // Convert JSON date string to Date object
    })))
  );
}
```

**Key Features:**
1. **User Filtering**: All queries filter by `userId` for data isolation
2. **Date Transformation**: JSON dates are strings, we convert to Date objects
3. **Type Safety**: Full TypeScript typing throughout

**CRUD Methods:**
- `getExpenses(userId)` - Get all user expenses
- `getExpenseById(id)` - Get single expense
- `getExpensesByCategory(userId, category)` - Filter by category
- `getExpensesByMonth(userId, month, year)` - Filter by date range
- `createExpense(expense)` - POST request
- `updateExpense(id, expense)` - PUT request
- `deleteExpense(id)` - DELETE request

### BudgetService: Budget Management

```typescript
getBudgetByMonth(userId: number, month: number, year: number): Observable<Budget | null> {
  return this.getBudgets(userId).pipe(
    map(budgets => {
      const budget = budgets.find(b => b.month === month && b.year === year);
      return budget || null;
    })
  );
}
```

**Design Pattern**: Client-side filtering for simplicity. In production, this would be a server-side query.

### IncomeService & GoalService

Similar patterns to ExpenseService:
- User-scoped queries
- Date transformation
- Full CRUD operations

---

## Authentication System

### Auth Guard: Route Protection

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};
```

**Functional Guard Pattern** (Angular 15+):
- Uses `inject()` instead of constructor injection
- Returns `CanActivateFn` function
- Saves attempted URL for post-login redirect

**Flow:**
1. User tries to access `/dashboard`
2. Guard checks `authService.isLoggedIn()`
3. If not logged in → redirect to `/login?returnUrl=/dashboard`
4. After login → redirect back to original URL

### Login Component

**Form Setup:**
```typescript
this.loginForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(6)]]
});
```

**Reactive Forms Benefits:**
- Type-safe form controls
- Built-in validators
- Easy custom validation
- Programmatic form manipulation

**Submit Handler:**
```typescript
onSubmit(): void {
  if (this.loginForm.valid) {
    this.isLoading = true;
    this.authService.login(email, password).subscribe({
      next: (user) => {
        if (user) {
          this.router.navigate(['/dashboard']);
          this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
        } else {
          this.snackBar.open('Invalid credentials', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        // Error handling
      }
    });
  }
}
```

**UX Features:**
- Loading state (`isLoading`)
- Success/error notifications (Material Snackbar)
- Form validation feedback
- Demo credentials hint

### Register Component

**Custom Validator:**
```typescript
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
}
```

**Form with Cross-Field Validation:**
```typescript
this.registerForm = this.fb.group({
  firstName: ['', [Validators.required, Validators.minLength(2)]],
  lastName: ['', [Validators.required, Validators.minLength(2)]],
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(6)]],
  confirmPassword: ['', [Validators.required]]
}, {
  validators: passwordMatchValidator  // Form-level validator
});
```

**Why Form-Level Validator?**
- Compares two fields (`password` and `confirmPassword`)
- Can't be done at field level
- Runs after all field validators pass

---

## In-Memory API Implementation

### Why Custom Interceptor Instead of angular-in-memory-web-api?

The `angular-in-memory-web-api` package doesn't work well with standalone components and modern Angular. I built a custom interceptor that:

1. **Intercepts HTTP requests** to `/api/*`
2. **Maintains in-memory data** (arrays in memory)
3. **Implements RESTful operations** (GET, POST, PUT, DELETE)
4. **Supports query parameters** (`?userId=1`)
5. **Handles ID-based routes** (`/api/expenses/1`)

### Interceptor Implementation

```typescript
export const inMemoryInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url;
  
  // Only intercept /api/* requests
  if (!url.startsWith('/api/')) {
    return next(req);  // Pass through to real backend
  }

  // Parse URL: /api/expenses?userId=1 → collection='expenses', id=null
  const urlParts = url.replace(/^\/?api\//, '').split('/');
  const collection = urlParts[0];
  const id = urlParts[1] ? parseInt(urlParts[1]) : null;
  
  // Handle GET requests
  if (req.method === 'GET') {
    let data = getCollection(collection);
    
    // Filter by userId if query param exists
    const userId = queryParams.get('userId');
    if (userId) {
      data = data.filter(item => item.userId === parseInt(userId));
    }
    
    // Return single item or collection
    if (id) {
      const item = data.find(d => d.id === id);
      return of(new HttpResponse({ status: item ? 200 : 404, body: item || { error: 'Not found' } }));
    }
    
    return of(new HttpResponse({ status: 200, body: data }));
  }
  
  // Handle POST (create)
  if (req.method === 'POST') {
    const newItem = { ...req.body, id: getNextId(collection) };
    addToCollection(collection, newItem);
    return of(new HttpResponse({ status: 201, body: newItem }));
  }
  
  // Handle PUT (update)
  if (req.method === 'PUT' && id) {
    const updated = updateInCollection(collection, id, req.body);
    return of(new HttpResponse({ status: updated ? 200 : 404, body: updated }));
  }
  
  // Handle DELETE
  if (req.method === 'DELETE' && id) {
    const deleted = deleteFromCollection(collection, id);
    return of(new HttpResponse({ status: deleted ? 200 : 404, body: {} }));
  }
  
  return next(req);
};
```

**Data Storage:**
- Arrays stored in module scope (persist during app lifetime)
- Each collection: `users[]`, `expenses[]`, `incomes[]`, `budgets[]`, `goals[]`
- ID generation: `Math.max(...ids) + 1`

**Benefits:**
- No backend needed for development
- Fast iteration
- Easy to test
- Can switch to real API by removing interceptor

---

## Component Architecture

### Component Design Patterns

All feature components follow this structure:

```typescript
export class FeatureComponent implements OnInit, OnDestroy {
  // Data
  items: Item[] = [];
  isLoading = false;
  currentUserId: number | null = null;
  
  // Form
  itemForm: FormGroup;
  isEditMode = false;
  editingItemId: number | null = null;
  
  // Subscriptions (for cleanup)
  private subscriptions = new Subscription();

  ngOnInit(): void {
    // Get user, load data
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.subscriptions.unsubscribe();
  }
}
```

### Dashboard Component: Data Aggregation

**Key Challenge**: Load multiple data sources and aggregate them.

**Solution**: `combineLatest` operator

```typescript
loadDashboardData(): void {
  const expenses$ = this.expenseService.getExpenses(this.currentUserId);
  const incomes$ = this.incomeService.getIncomes(this.currentUserId);
  const budgets$ = this.budgetService.getBudgets(this.currentUserId);
  const goals$ = this.goalService.getGoals(this.currentUserId);

  combineLatest([expenses$, incomes$, budgets$, goals$]).subscribe({
    next: ([expenses, incomes, budgets, goals]) => {
      // All data loaded - calculate summaries
      this.totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      this.totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
      this.savings = this.totalIncome - this.totalExpenses;
      
      // Setup charts
      this.setupPieChart(expenses);
      this.setupBarChart(incomes, expenses);
      this.setupLineChart(incomes, expenses);
    }
  });
}
```

**Why `combineLatest`?**
- Waits for ALL observables to emit
- Emits whenever ANY observable emits (after initial load)
- Perfect for aggregating multiple data sources

**Chart Integration:**
- Uses `ng2-charts` (wrapper for Chart.js)
- Three chart types: Pie (expenses by category), Bar (income vs expenses), Line (savings over time)
- Chart data updated reactively when data changes

### Expenses Component: CRUD with Material Table

**Table Setup:**
```typescript
displayedColumns: string[] = ['date', 'category', 'description', 'amount', 'recurring', 'actions'];
```

**Material Table Pattern:**
```html
<table mat-table [dataSource]="expenses">
  <ng-container matColumnDef="date">
    <th mat-header-cell *matHeaderCellDef>Date</th>
    <td mat-cell *matCellDef="let expense">{{ formatDate(expense.date) }}</td>
  </ng-container>
  <!-- More columns... -->
  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
</table>
```

**Form Management:**
- Single form for both add and edit
- `isEditMode` flag determines behavior
- `editingItemId` tracks which item is being edited

**Save Logic:**
```typescript
saveExpense(): void {
  if (this.isEditMode && this.editingExpenseId) {
    // Update existing
    this.expenseService.updateExpense(this.editingExpenseId, expenseData).subscribe({
      next: () => {
        this.snackBar.open('Expense updated', 'Close');
        this.loadExpenses();  // Refresh list
      }
    });
  } else {
    // Create new
    this.expenseService.createExpense(expenseData).subscribe({
      next: () => {
        this.snackBar.open('Expense added', 'Close');
        this.loadExpenses();
      }
    });
  }
}
```

### Budgets Component: Dynamic FormArray

**Challenge**: Budgets have variable number of categories.

**Solution**: Angular `FormArray`

```typescript
this.budgetForm = this.fb.group({
  month: ['', Validators.required],
  year: [new Date().getFullYear(), Validators.required],
  totalIncome: ['', Validators.required],
  categories: this.fb.array([])  // Dynamic array
});

// Getter for easy access
get categoriesFormArray(): FormArray {
  return this.budgetForm.get('categories') as FormArray;
}

// Add category dynamically
addCategory(): void {
  const categoryGroup = this.fb.group({
    category: ['', Validators.required],
    limit: ['', [Validators.required, Validators.min(0.01)]]
  });
  this.categoriesFormArray.push(categoryGroup);
}

// Remove category
removeCategory(index: number): void {
  this.categoriesFormArray.removeAt(index);
}
```

**Template Binding:**
```html
<div formArrayName="categories">
  <div *ngFor="let category of categoriesFormArray.controls; let i = index" 
       [formGroupName]="i">
    <mat-form-field>
      <mat-select formControlName="category">...</mat-select>
    </mat-form-field>
    <mat-form-field>
      <input formControlName="limit" type="number">
    </mat-form-field>
    <button (click)="removeCategory(i)">Remove</button>
  </div>
</div>
```

**Why FormArray?**
- Dynamic number of form controls
- Each category has its own validation
- Easy to add/remove categories
- Type-safe access to nested controls

### Goals Component: Progress Tracking

**Progress Calculation:**
```typescript
getProgress(goal: Goal): number {
  if (goal.targetAmount === 0) return 0;
  return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
}

isCompleted(goal: Goal): boolean {
  return goal.currentAmount >= goal.targetAmount;
}
```

**Visual Progress:**
- Material Progress Bar component
- Color changes when completed
- Percentage display

### Reports Component: Date Range Filtering

**Filter Form:**
```typescript
this.reportForm = this.fb.group({
  startDate: [new Date(now.getFullYear(), now.getMonth(), 1)],  // First day of month
  endDate: [now]  // Today
});
```

**Report Generation:**
```typescript
generateReport(): void {
  const { startDate, endDate } = this.reportForm.value;
  
  combineLatest([expenses$, incomes$, budgets$]).subscribe({
    next: ([expenses, incomes, budgets]) => {
      // Filter by date range
      const filteredExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date >= startDate && date <= endDate;
      });
      
      // Calculate category reports
      this.calculateCategoryReports(filteredExpenses, budgets);
    }
  });
}
```

**Category Analysis:**
- Compares budgeted vs actual spending
- Calculates variance (budgeted - spent)
- Shows percentage of budget used
- Color-coded variance (positive/negative)

---

## UI/UX Implementation

### Angular Material Integration

**Why Angular Material?**
- Consistent design system
- Accessibility built-in
- Responsive components
- Theming support

**Key Components Used:**
- `MatCard` - Content containers
- `MatTable` - Data tables
- `MatFormField` - Form inputs with labels/errors
- `MatButton` - Buttons with icons
- `MatSnackBar` - Toast notifications
- `MatProgressBar` - Progress indicators
- `MatDatepicker` - Date selection
- `MatSelect` - Dropdowns
- `MatToolbar` - Navigation bar
- `MatMenu` - User menu

### Navigation Component

**Reactive User Display:**
```typescript
ngOnInit(): void {
  this.userSubscription = this.authService.currentUser$.subscribe(
    user => {
      this.currentUser = user;  // Updates when user logs in/out
    }
  );
}
```

**Template:**
```html
<nav *ngIf="currentUser" class="nav-links">
  <a mat-button routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
  <!-- More links... -->
</nav>

<div *ngIf="currentUser" class="user-menu">
  <button mat-button [matMenuTriggerFor]="userMenu">
    {{ getUserName() }}
  </button>
  <mat-menu #userMenu="matMenu">
    <button mat-menu-item (click)="logout()">Logout</button>
  </mat-menu>
</div>
```

**Features:**
- Conditional rendering (`*ngIf="currentUser"`)
- Active route highlighting (`routerLinkActive`)
- User menu with logout

### Form Validation & Error Display

**Template Pattern:**
```html
<mat-form-field appearance="outline">
  <mat-label>Amount</mat-label>
  <input matInput type="number" formControlName="amount">
  <mat-error *ngIf="expenseForm.get('amount')?.hasError('required')">
    Amount is required
  </mat-error>
  <mat-error *ngIf="expenseForm.get('amount')?.hasError('min')">
    Amount must be greater than 0
  </mat-error>
</mat-form-field>
```

**Why This Pattern?**
- Real-time validation feedback
- Specific error messages per validator
- Only shows errors after user interaction (`touched`)

### Loading States

**Pattern:**
```typescript
isLoading = false;

loadData(): void {
  this.isLoading = true;
  this.service.getData().subscribe({
    next: (data) => {
      this.data = data;
      this.isLoading = false;
    },
    error: () => {
      this.isLoading = false;
    }
  });
}
```

**Template:**
```html
<div *ngIf="isLoading" class="loading-container">
  <mat-spinner></mat-spinner>
  <p>Loading...</p>
</div>

<div *ngIf="!isLoading">
  <!-- Actual content -->
</div>
```

### Empty States

**User-Friendly Messages:**
```html
<div *ngIf="items.length === 0 && !isLoading" class="empty-state">
  <mat-icon>receipt_long</mat-icon>
  <p>No expenses yet. Add your first expense to get started!</p>
</div>
```

**Why Empty States Matter:**
- Better UX than blank screens
- Guides users on next steps
- Reduces confusion

---

## Data Flow & State Management

### State Management Strategy

**Simple Observable Pattern** (no NgRx/Redux):

1. **Services hold state** via `BehaviorSubject`
2. **Components subscribe** to observables
3. **Actions trigger updates** through service methods

**Example Flow:**

```
User clicks "Add Expense"
  ↓
Component calls expenseService.createExpense()
  ↓
Service makes HTTP POST request
  ↓
Interceptor handles request (in-memory)
  ↓
Service returns Observable<Expense>
  ↓
Component subscribes and updates local state
  ↓
Component calls loadExpenses() to refresh list
```

### Subscription Management

**Problem**: Memory leaks from unsubscribed observables

**Solution**: Subscription tracking

```typescript
private subscriptions = new Subscription();

ngOnInit(): void {
  const sub1 = this.service.getData().subscribe(...);
  const sub2 = this.service.getOtherData().subscribe(...);
  
  this.subscriptions.add(sub1);
  this.subscriptions.add(sub2);
}

ngOnDestroy(): void {
  this.subscriptions.unsubscribe();  // Cleanup all subscriptions
}
```

**Why This Pattern?**
- Prevents memory leaks
- Easy to manage multiple subscriptions
- Automatic cleanup on component destroy

### Date Handling

**Challenge**: JSON serialization converts Date objects to strings

**Solution**: Transform dates in service layer

```typescript
getExpenses(userId: number): Observable<Expense[]> {
  return this.http.get<Expense[]>(this.apiUrl, { params }).pipe(
    map(expenses => expenses.map(exp => ({
      ...exp,
      date: new Date(exp.date)  // Convert string back to Date
    })))
  );
}
```

**Why Transform in Service?**
- Centralized transformation logic
- Components always receive Date objects
- Consistent date handling across app

---

## Key Design Decisions Summary

1. **Standalone Components**: Modern Angular, better tree-shaking
2. **Custom In-Memory Interceptor**: Works with standalone components
3. **Reactive Forms**: Type-safe, powerful validation
4. **Material Design**: Consistent, accessible UI
5. **RxJS Observables**: Reactive data flow
6. **User-Scoped Data**: All queries filter by userId
7. **FormArray for Dynamic Forms**: Flexible budget categories
8. **combineLatest for Aggregation**: Load multiple data sources
9. **Subscription Management**: Prevent memory leaks
10. **Date Transformation**: Handle JSON date serialization

---

## Future Enhancements (Not Implemented)

1. **Real Backend API**: Replace interceptor with HTTP calls
2. **JWT Authentication**: Secure token-based auth
3. **Password Hashing**: bcrypt or similar
4. **Data Export**: CSV/PDF reports
5. **Recurring Expense Automation**: Auto-create recurring expenses
6. **Budget Alerts**: Notifications when approaching limits
7. **Multi-Currency Support**: International users
8. **Data Visualization**: More chart types
9. **Mobile App**: Ionic/Capacitor wrapper
10. **Offline Support**: Service workers, IndexedDB

---

This implementation demonstrates modern Angular patterns, best practices, and a complete full-stack application architecture (even with a mock backend). The code is production-ready in structure, though security and backend integration would need to be added for a real deployment.

