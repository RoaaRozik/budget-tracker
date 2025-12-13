import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Expense } from '../../models/expense.model';
import { ExpenseService } from '../../services/expense.service';
import { AuthService } from '../../services/auth.service';

/**
 * Expense Categories - Predefined list for consistency
 */
const EXPENSE_CATEGORIES = [
  'Housing',
  'Food',
  'Transportation',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Shopping',
  'Education',
  'Other'
];

/**
 * Expenses Component
 * Displays list of expenses and allows CRUD operations
 * Uses Material Table for display and Dialog for add/edit
 */
@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.css'
})
export class ExpensesComponent implements OnInit, OnDestroy {
  expenses: Expense[] = [];
  displayedColumns: string[] = ['date', 'category', 'description', 'amount', 'recurring', 'actions'];
  categories = EXPENSE_CATEGORIES;
  isLoading = false;
  currentUserId: number | null = null;
  
  expenseForm: FormGroup;
  isEditMode = false;
  editingExpenseId: number | null = null;
  
  private subscriptions = new Subscription();

  constructor(
    private expenseService: ExpenseService,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    // Initialize form
    this.expenseForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      category: ['', Validators.required],
      description: ['', Validators.required],
      date: [new Date(), Validators.required],
      isRecurring: [false],
      recurringFrequency: ['monthly']
    });
  }

  ngOnInit(): void {
    // Get current user
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id;
      this.loadExpenses();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load all expenses for the current user
   */
  loadExpenses(): void {
    if (!this.currentUserId) return;
    
    this.isLoading = true;
    const sub = this.expenseService.getExpenses(this.currentUserId).subscribe({
      next: (expenses) => {
        this.expenses = expenses.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime() // Sort by date, newest first
        );
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open('Error loading expenses', 'Close', { duration: 3000 });
        console.error('Error loading expenses:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  /**
   * Open dialog/form to add new expense
   */
  openAddDialog(): void {
    this.isEditMode = false;
    this.editingExpenseId = null;
    this.expenseForm.reset({
      amount: '',
      category: '',
      description: '',
      date: new Date(),
      isRecurring: false,
      recurringFrequency: 'monthly'
    });
  }

  /**
   * Open dialog/form to edit existing expense
   */
  openEditDialog(expense: Expense): void {
    this.isEditMode = true;
    this.editingExpenseId = expense.id;
    this.expenseForm.patchValue({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: new Date(expense.date),
      isRecurring: expense.isRecurring,
      recurringFrequency: expense.recurringFrequency || 'monthly'
    });
  }

  /**
   * Save expense (create or update)
   */
  saveExpense(): void {
    if (this.expenseForm.valid && this.currentUserId) {
      const formValue = this.expenseForm.value;
      const expenseData: Omit<Expense, 'id'> = {
        userId: this.currentUserId,
        amount: formValue.amount,
        category: formValue.category,
        description: formValue.description,
        date: formValue.date,
        isRecurring: formValue.isRecurring,
        recurringFrequency: formValue.isRecurring ? formValue.recurringFrequency : undefined
      };

      if (this.isEditMode && this.editingExpenseId) {
        // Update existing expense
        const sub = this.expenseService.updateExpense(this.editingExpenseId, expenseData).subscribe({
          next: () => {
            this.snackBar.open('Expense updated successfully', 'Close', { duration: 3000 });
            this.loadExpenses();
            this.expenseForm.reset();
          },
          error: (error) => {
            this.snackBar.open('Error updating expense', 'Close', { duration: 3000 });
            console.error('Error updating expense:', error);
          }
        });
        this.subscriptions.add(sub);
      } else {
        // Create new expense
        const sub = this.expenseService.createExpense(expenseData).subscribe({
          next: () => {
            this.snackBar.open('Expense added successfully', 'Close', { duration: 3000 });
            this.loadExpenses();
            this.expenseForm.reset();
          },
          error: (error) => {
            this.snackBar.open('Error adding expense', 'Close', { duration: 3000 });
            console.error('Error adding expense:', error);
          }
        });
        this.subscriptions.add(sub);
      }
    } else {
      this.expenseForm.markAllAsTouched();
    }
  }

  /**
   * Delete expense with confirmation
   */
  deleteExpense(id: number): void {
    if (confirm('Are you sure you want to delete this expense?')) {
      const sub = this.expenseService.deleteExpense(id).subscribe({
        next: () => {
          this.snackBar.open('Expense deleted successfully', 'Close', { duration: 3000 });
          this.loadExpenses();
        },
        error: (error) => {
          this.snackBar.open('Error deleting expense', 'Close', { duration: 3000 });
          console.error('Error deleting expense:', error);
        }
      });
      this.subscriptions.add(sub);
    }
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}

