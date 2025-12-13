import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

/**
 * Navigation Component
 * Main navigation bar with user menu and logout
 * Shows different links based on authentication state
 */
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css'
})
export class NavComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to current user changes
    // This will update the nav when user logs in/out
    this.userSubscription = this.authService.currentUser$.subscribe(
      user => {
        this.currentUser = user;
      }
    );
  }

  ngOnDestroy(): void {
    // Clean up subscription to prevent memory leaks
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  /**
   * Handle logout
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Get user's full name for display
   */
  getUserName(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    return 'User';
  }
}

