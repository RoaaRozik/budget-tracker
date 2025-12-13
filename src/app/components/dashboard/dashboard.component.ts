import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Chart, registerables } from 'chart.js';

import { AuthService } from '../../services/auth.service';

// Register Chart.js components
Chart.register(...registerables);
import { ExpenseService } from '../../services/expense.service';
import { IncomeService } from '../../services/income.service';
import { BudgetService } from '../../services/budget.service';
import { GoalService } from '../../services/goal.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUserId: number | null = null;
  isLoading = false;
  
  // Summary data
  totalIncome = 0;
  totalExpenses = 0;
  savings = 0;
  totalGoals = 0;
  goalsProgress = 0;

  // Chart data
  pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{
      data: []
    }]
  };

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  // Chart options
  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right'
      },
      title: {
        display: true,
        text: 'Expenses by Category'
      }
    }
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      },
      title: {
        display: true,
        text: 'Income vs Expenses (This Month)'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true
      },
      title: {
        display: true,
        text: 'Savings Progress Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private expenseService: ExpenseService,
    private incomeService: IncomeService,
    private budgetService: BudgetService,
    private goalService: GoalService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id;
      this.loadDashboardData();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load all data needed for dashboard
   * Uses combineLatest to load multiple observables in parallel
   */
  loadDashboardData(): void {
    if (!this.currentUserId) return;

    this.isLoading = true;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Load all data in parallel
    const expenses$ = this.expenseService.getExpenses(this.currentUserId);
    const incomes$ = this.incomeService.getIncomes(this.currentUserId);
    const budgets$ = this.budgetService.getBudgets(this.currentUserId);
    const goals$ = this.goalService.getGoals(this.currentUserId);

    const sub = combineLatest([expenses$, incomes$, budgets$, goals$]).subscribe({
      next: ([expenses, incomes, budgets, goals]) => {
        // Calculate totals for current month
        const monthExpenses = expenses.filter(e => {
          const d = new Date(e.date);
          return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
        });
        const monthIncomes = incomes.filter(i => {
          const d = new Date(i.date);
          return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
        });

        this.totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
        this.totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
        this.savings = this.totalIncome - this.totalExpenses;

        // Goals data
        this.totalGoals = goals.length;
        const totalGoalProgress = goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0);
        this.goalsProgress = this.totalGoals > 0 ? (totalGoalProgress / this.totalGoals) * 100 : 0;

        // Setup charts
        this.setupPieChart(monthExpenses);
        this.setupBarChart(monthIncomes, monthExpenses);
        this.setupLineChart(incomes, expenses);

        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading dashboard data:', error);
      }
    });

    this.subscriptions.add(sub);
  }

  /**
   * Setup pie chart for expenses by category
   */
  private setupPieChart(expenses: any[]): void {
    const categoryTotals: { [key: string]: number } = {};
    
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // Only set chart data if there's data to display
    if (labels.length > 0 && data.length > 0) {
      this.pieChartData = {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
          ]
        }]
      };
    } else {
      // Provide empty data structure for Chart.js
      this.pieChartData = {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#E0E0E0']
        }]
      };
    }
  }

  /**
   * Setup bar chart for income vs expenses
   */
  private setupBarChart(incomes: any[], expenses: any[]): void {
    const incomeTotal = incomes.reduce((sum, i) => sum + i.amount, 0);
    const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

    this.barChartData = {
      labels: ['This Month'],
      datasets: [
        {
          label: 'Income',
          data: [incomeTotal],
          backgroundColor: '#4CAF50'
        },
        {
          label: 'Expenses',
          data: [expenseTotal],
          backgroundColor: '#F44336'
        }
      ]
    };
  }

  /**
   * Setup line chart for savings progress
   */
  private setupLineChart(incomes: any[], expenses: any[]): void {
    // Group by month for last 6 months
    const months: string[] = [];
    const savingsData: number[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthIncome = incomes
        .filter(inc => {
          const d = new Date(inc.date);
          return d.getMonth() + 1 === month && d.getFullYear() === year;
        })
        .reduce((sum, inc) => sum + inc.amount, 0);
      
      const monthExpense = expenses
        .filter(exp => {
          const d = new Date(exp.date);
          return d.getMonth() + 1 === month && d.getFullYear() === year;
        })
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      months.push(monthName);
      savingsData.push(monthIncome - monthExpense);
    }

    // Ensure we have data to display
    if (months.length > 0 && savingsData.length > 0) {
      this.lineChartData = {
        labels: months,
        datasets: [{
          label: 'Savings',
          data: savingsData,
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          fill: true,
          tension: 0.4
        }]
      };
    } else {
      // Provide empty data structure
      this.lineChartData = {
        labels: ['No Data'],
        datasets: [{
          label: 'Savings',
          data: [0],
          borderColor: '#1976d2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          fill: true,
          tension: 0.4
        }]
      };
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}

