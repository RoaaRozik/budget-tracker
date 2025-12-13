import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription, combineLatest } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../services/auth.service';
import { ExpenseService } from '../../services/expense.service';
import { IncomeService } from '../../services/income.service';
import { BudgetService } from '../../services/budget.service';

interface CategoryReport {
  category: string;
  budgeted: number;
  spent: number;
  variance: number;
  percentage: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit, OnDestroy {
  currentUserId: number | null = null;
  isLoading = false;
  
  reportForm: FormGroup;
  
  // Report data
  totalIncome = 0;
  totalExpenses = 0;
  netSavings = 0;
  categoryReports: CategoryReport[] = [];
  displayedColumns: string[] = ['category', 'budgeted', 'spent', 'variance', 'percentage'];
  
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private expenseService: ExpenseService,
    private incomeService: IncomeService,
    private budgetService: BudgetService,
    private fb: FormBuilder
  ) {
    const now = new Date();
    this.reportForm = this.fb.group({
      startDate: [new Date(now.getFullYear(), now.getMonth(), 1)],
      endDate: [now]
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id;
      this.generateReport();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  generateReport(): void {
    if (!this.currentUserId) return;

    this.isLoading = true;
    const { startDate, endDate } = this.reportForm.value;

    const expenses$ = this.expenseService.getExpenses(this.currentUserId);
    const incomes$ = this.incomeService.getIncomes(this.currentUserId);
    const budgets$ = this.budgetService.getBudgets(this.currentUserId);

    const sub = combineLatest([expenses$, incomes$, budgets$]).subscribe({
      next: ([expenses, incomes, budgets]) => {
        // Filter data by date range
        const filteredExpenses = expenses.filter(e => {
          const date = new Date(e.date);
          return date >= startDate && date <= endDate;
        });

        const filteredIncomes = incomes.filter(i => {
          const date = new Date(i.date);
          return date >= startDate && date <= endDate;
        });

        // Calculate totals
        this.totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
        this.totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        this.netSavings = this.totalIncome - this.totalExpenses;

        // Calculate category reports
        this.calculateCategoryReports(filteredExpenses, budgets, startDate, endDate);

        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error generating report:', error);
      }
    });

    this.subscriptions.add(sub);
  }

  private calculateCategoryReports(expenses: any[], budgets: any[], startDate: Date, endDate: Date): void {
    const categoryMap: { [key: string]: { budgeted: number; spent: number } } = {};

    // Get current month budget
    const now = new Date(startDate);
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentBudget = budgets.find(b => b.month === currentMonth && b.year === currentYear);

    // Initialize from budget
    if (currentBudget) {
      currentBudget.categories.forEach((cat: any) => {
        categoryMap[cat.category] = { budgeted: cat.limit, spent: 0 };
      });
    }

    // Calculate spent by category
    expenses.forEach(expense => {
      if (!categoryMap[expense.category]) {
        categoryMap[expense.category] = { budgeted: 0, spent: 0 };
      }
      categoryMap[expense.category].spent += expense.amount;
    });

    // Convert to array and calculate variance
    this.categoryReports = Object.keys(categoryMap).map(category => {
      const data = categoryMap[category];
      const variance = data.budgeted - data.spent;
      const percentage = data.budgeted > 0 ? (data.spent / data.budgeted) * 100 : 0;

      return {
        category,
        budgeted: data.budgeted,
        spent: data.spent,
        variance,
        percentage
      };
    }).sort((a, b) => b.spent - a.spent);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getVarianceColor(variance: number): string {
    if (variance > 0) return 'positive';
    if (variance < 0) return 'negative';
    return 'neutral';
  }
}

