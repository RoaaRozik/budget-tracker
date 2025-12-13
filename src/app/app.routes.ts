import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

/**
 * Application Routes Configuration
 * Defines all routes in the application with their guards
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard] // Protected route - requires authentication
  },
  {
    path: 'expenses',
    loadComponent: () => import('./components/expenses/expenses.component').then(m => m.ExpensesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'income',
    loadComponent: () => import('./components/income/income.component').then(m => m.IncomeComponent),
    canActivate: [authGuard]
  },
  {
    path: 'budgets',
    loadComponent: () => import('./components/budgets/budgets.component').then(m => m.BudgetsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'goals',
    loadComponent: () => import('./components/goals/goals.component').then(m => m.GoalsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'reports',
    loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [authGuard]
  },
  {
    path: '**', // Wildcard route - catches all unmatched routes
    redirectTo: '/dashboard'
  }
];
