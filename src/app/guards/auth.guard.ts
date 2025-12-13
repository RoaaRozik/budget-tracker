import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard
 * Protects routes that require authentication
 * If user is not logged in, redirects to login page
 * 
 * This is a functional guard (Angular 15+ style)
 * It's a function that returns a CanActivateFn
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is logged in
  if (authService.isLoggedIn()) {
    return true; // Allow access to the route
  } else {
    // User is not logged in - redirect to login
    // Save the attempted URL so we can redirect back after login
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false; // Deny access to the route
  }
};

