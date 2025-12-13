import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Income } from '../../models/income.model';
import { IncomeService } from '../../services/income.service';
import { AuthService } from '../../services/auth.service';

const INCOME_SOURCES = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Rental',
  'Other'
];

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  templateUrl: './income.component.html',
  styleUrl: './income.component.css'
})
export class IncomeComponent implements OnInit, OnDestroy {
  incomes: Income[] = [];
  displayedColumns: string[] = ['date', 'source', 'description', 'amount', 'actions'];
  sources = INCOME_SOURCES;
  isLoading = false;
  currentUserId: number | null = null;
  
  incomeForm: FormGroup;
  isEditMode = false;
  editingIncomeId: number | null = null;
  
  private subscriptions = new Subscription();

  constructor(
    private incomeService: IncomeService,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.incomeForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      source: ['', Validators.required],
      description: [''],
      date: [new Date(), Validators.required]
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id;
      this.loadIncomes();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadIncomes(): void {
    if (!this.currentUserId) return;
    
    this.isLoading = true;
    const sub = this.incomeService.getIncomes(this.currentUserId).subscribe({
      next: (incomes) => {
        this.incomes = incomes.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open('Error loading income', 'Close', { duration: 3000 });
        console.error('Error loading income:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  openAddDialog(): void {
    this.isEditMode = false;
    this.editingIncomeId = null;
    this.incomeForm.reset({
      amount: '',
      source: '',
      description: '',
      date: new Date()
    });
  }

  openEditDialog(income: Income): void {
    this.isEditMode = true;
    this.editingIncomeId = income.id;
    this.incomeForm.patchValue({
      amount: income.amount,
      source: income.source,
      description: income.description || '',
      date: new Date(income.date)
    });
  }

  saveIncome(): void {
    if (this.incomeForm.valid && this.currentUserId) {
      const formValue = this.incomeForm.value;
      const incomeData: Omit<Income, 'id'> = {
        userId: this.currentUserId,
        amount: formValue.amount,
        source: formValue.source,
        description: formValue.description || undefined,
        date: formValue.date
      };

      if (this.isEditMode && this.editingIncomeId) {
        const sub = this.incomeService.updateIncome(this.editingIncomeId, incomeData).subscribe({
          next: () => {
            this.snackBar.open('Income updated successfully', 'Close', { duration: 3000 });
            this.loadIncomes();
            this.incomeForm.reset();
          },
          error: (error) => {
            this.snackBar.open('Error updating income', 'Close', { duration: 3000 });
            console.error('Error updating income:', error);
          }
        });
        this.subscriptions.add(sub);
      } else {
        const sub = this.incomeService.createIncome(incomeData).subscribe({
          next: () => {
            this.snackBar.open('Income added successfully', 'Close', { duration: 3000 });
            this.loadIncomes();
            this.incomeForm.reset();
          },
          error: (error) => {
            this.snackBar.open('Error adding income', 'Close', { duration: 3000 });
            console.error('Error adding income:', error);
          }
        });
        this.subscriptions.add(sub);
      }
    } else {
      this.incomeForm.markAllAsTouched();
    }
  }

  deleteIncome(id: number): void {
    if (confirm('Are you sure you want to delete this income?')) {
      const sub = this.incomeService.deleteIncome(id).subscribe({
        next: () => {
          this.snackBar.open('Income deleted successfully', 'Close', { duration: 3000 });
          this.loadIncomes();
        },
        error: (error) => {
          this.snackBar.open('Error deleting income', 'Close', { duration: 3000 });
          console.error('Error deleting income:', error);
        }
      });
      this.subscriptions.add(sub);
    }
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}

