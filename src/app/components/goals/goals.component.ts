import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Goal } from '../../models/goal.model';
import { GoalService } from '../../services/goal.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './goals.component.html',
  styleUrl: './goals.component.css'
})
export class GoalsComponent implements OnInit, OnDestroy {
  goals: Goal[] = [];
  isLoading = false;
  currentUserId: number | null = null;
  
  goalForm: FormGroup;
  isEditMode = false;
  editingGoalId: number | null = null;
  
  private subscriptions = new Subscription();

  constructor(
    private goalService: GoalService,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.goalForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      targetAmount: ['', [Validators.required, Validators.min(0.01)]],
      currentAmount: [0, [Validators.required, Validators.min(0)]],
      targetDate: [new Date(), Validators.required]
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id;
      this.loadGoals();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadGoals(): void {
    if (!this.currentUserId) return;
    
    this.isLoading = true;
    const sub = this.goalService.getGoals(this.currentUserId).subscribe({
      next: (goals) => {
        this.goals = goals.sort((a, b) => 
          new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
        );
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open('Error loading goals', 'Close', { duration: 3000 });
        console.error('Error loading goals:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  openAddDialog(): void {
    this.isEditMode = false;
    this.editingGoalId = null;
    this.goalForm.reset({
      title: '',
      description: '',
      targetAmount: '',
      currentAmount: 0,
      targetDate: new Date()
    });
  }

  openEditDialog(goal: Goal): void {
    this.isEditMode = true;
    this.editingGoalId = goal.id;
    this.goalForm.patchValue({
      title: goal.title,
      description: goal.description || '',
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: new Date(goal.targetDate)
    });
  }

  saveGoal(): void {
    if (this.goalForm.valid && this.currentUserId) {
      const formValue = this.goalForm.value;
      const goalData: Omit<Goal, 'id'> = {
        userId: this.currentUserId,
        title: formValue.title,
        description: formValue.description || undefined,
        targetAmount: formValue.targetAmount,
        currentAmount: formValue.currentAmount || 0,
        targetDate: formValue.targetDate,
        createdAt: new Date()
      };

      if (this.isEditMode && this.editingGoalId) {
        const sub = this.goalService.updateGoal(this.editingGoalId, goalData).subscribe({
          next: () => {
            this.snackBar.open('Goal updated successfully', 'Close', { duration: 3000 });
            this.loadGoals();
            this.goalForm.reset();
          },
          error: (error) => {
            this.snackBar.open('Error updating goal', 'Close', { duration: 3000 });
            console.error('Error updating goal:', error);
          }
        });
        this.subscriptions.add(sub);
      } else {
        const sub = this.goalService.createGoal(goalData).subscribe({
          next: () => {
            this.snackBar.open('Goal created successfully', 'Close', { duration: 3000 });
            this.loadGoals();
            this.goalForm.reset();
          },
          error: (error) => {
            this.snackBar.open('Error creating goal', 'Close', { duration: 3000 });
            console.error('Error creating goal:', error);
          }
        });
        this.subscriptions.add(sub);
      }
    } else {
      this.goalForm.markAllAsTouched();
    }
  }

  deleteGoal(id: number): void {
    if (confirm('Are you sure you want to delete this goal?')) {
      const sub = this.goalService.deleteGoal(id).subscribe({
        next: () => {
          this.snackBar.open('Goal deleted successfully', 'Close', { duration: 3000 });
          this.loadGoals();
        },
        error: (error) => {
          this.snackBar.open('Error deleting goal', 'Close', { duration: 3000 });
          console.error('Error deleting goal:', error);
        }
      });
      this.subscriptions.add(sub);
    }
  }

  // Calculate progress percentage
  getProgress(goal: Goal): number {
    if (goal.targetAmount === 0) return 0;
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  }

  // Check if goal is completed
  isCompleted(goal: Goal): boolean {
    return goal.currentAmount >= goal.targetAmount;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}

