import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Budget } from '../../models/budget.model';
import { BudgetService } from '../../services/budget.service';
import { AuthService } from '../../services/auth.service';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BUDGET_CATEGORIES = [
  'Housing', 'Food', 'Transportation', 'Entertainment',
  'Utilities', 'Healthcare', 'Shopping', 'Education', 'Savings', 'Other'
];

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatSnackBarModule
  ],
  templateUrl: './budgets.component.html',
  styleUrl: './budgets.component.css'
})
export class BudgetsComponent implements OnInit, OnDestroy {
  budgets: Budget[] = [];
  months = MONTHS;
  categories = BUDGET_CATEGORIES;
  isLoading = false;
  currentUserId: number | null = null;
  
  budgetForm: FormGroup;
  isEditMode = false;
  editingBudgetId: number | null = null;
  
  private subscriptions = new Subscription();

  constructor(
    private budgetService: BudgetService,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.budgetForm = this.fb.group({
      month: ['', Validators.required],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
      totalIncome: ['', [Validators.required, Validators.min(0.01)]],
      categories: this.fb.array([]) // FormArray for dynamic categories
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id;
      this.loadBudgets();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadBudgets(): void {
    if (!this.currentUserId) return;
    
    this.isLoading = true;
    const sub = this.budgetService.getBudgets(this.currentUserId).subscribe({
      next: (budgets) => {
        this.budgets = budgets.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open('Error loading budgets', 'Close', { duration: 3000 });
        console.error('Error loading budgets:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  // Getter for categories FormArray
  get categoriesFormArray(): FormArray {
    return this.budgetForm.get('categories') as FormArray;
  }

  // Add a new category to the form
  addCategory(): void {
    const categoryGroup = this.fb.group({
      category: ['', Validators.required],
      limit: ['', [Validators.required, Validators.min(0.01)]]
    });
    this.categoriesFormArray.push(categoryGroup);
  }

  // Remove a category from the form
  removeCategory(index: number): void {
    this.categoriesFormArray.removeAt(index);
  }

  openAddDialog(): void {
    this.isEditMode = false;
    this.editingBudgetId = null;
    this.budgetForm.reset({
      month: '',
      year: new Date().getFullYear(),
      totalIncome: '',
      categories: []
    });
    // Clear FormArray
    while (this.categoriesFormArray.length !== 0) {
      this.categoriesFormArray.removeAt(0);
    }
    // Add one empty category by default
    this.addCategory();
  }

  openEditDialog(budget: Budget): void {
    this.isEditMode = true;
    this.editingBudgetId = budget.id;
    this.budgetForm.patchValue({
      month: budget.month,
      year: budget.year,
      totalIncome: budget.totalIncome
    });
    
    // Clear and populate FormArray
    while (this.categoriesFormArray.length !== 0) {
      this.categoriesFormArray.removeAt(0);
    }
    budget.categories.forEach(cat => {
      const categoryGroup = this.fb.group({
        category: [cat.category, Validators.required],
        limit: [cat.limit, [Validators.required, Validators.min(0.01)]]
      });
      this.categoriesFormArray.push(categoryGroup);
    });
  }

  saveBudget(): void {
    if (this.budgetForm.valid && this.currentUserId && this.categoriesFormArray.length > 0) {
      const formValue = this.budgetForm.value;
      const budgetData: Omit<Budget, 'id'> = {
        userId: this.currentUserId,
        month: parseInt(formValue.month),
        year: parseInt(formValue.year),
        totalIncome: formValue.totalIncome,
        categories: formValue.categories,
        createdAt: new Date()
      };

      if (this.isEditMode && this.editingBudgetId) {
        const sub = this.budgetService.updateBudget(this.editingBudgetId, budgetData).subscribe({
          next: () => {
            this.snackBar.open('Budget updated successfully', 'Close', { duration: 3000 });
            this.loadBudgets();
            this.budgetForm.reset();
          },
          error: (error) => {
            this.snackBar.open('Error updating budget', 'Close', { duration: 3000 });
            console.error('Error updating budget:', error);
          }
        });
        this.subscriptions.add(sub);
      } else {
        const sub = this.budgetService.createBudget(budgetData).subscribe({
          next: () => {
            this.snackBar.open('Budget created successfully', 'Close', { duration: 3000 });
            this.loadBudgets();
            this.budgetForm.reset();
          },
          error: (error) => {
            this.snackBar.open('Error creating budget', 'Close', { duration: 3000 });
            console.error('Error creating budget:', error);
          }
        });
        this.subscriptions.add(sub);
      }
    } else {
      this.budgetForm.markAllAsTouched();
      if (this.categoriesFormArray.length === 0) {
        this.snackBar.open('Please add at least one category', 'Close', { duration: 3000 });
      }
    }
  }

  deleteBudget(id: number): void {
    if (confirm('Are you sure you want to delete this budget?')) {
      const sub = this.budgetService.deleteBudget(id).subscribe({
        next: () => {
          this.snackBar.open('Budget deleted successfully', 'Close', { duration: 3000 });
          this.loadBudgets();
        },
        error: (error) => {
          this.snackBar.open('Error deleting budget', 'Close', { duration: 3000 });
          console.error('Error deleting budget:', error);
        }
      });
      this.subscriptions.add(sub);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getMonthName(month: number): string {
    return this.months[month - 1] || '';
  }

  /**
   * Calculate total budgeted amount for a budget
   * This method is used in the template instead of inline reduce()
   */
  getTotalBudgeted(budget: Budget): number {
    return budget.categories.reduce((sum, cat) => sum + cat.limit, 0);
  }
}

