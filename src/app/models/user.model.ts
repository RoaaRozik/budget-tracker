/**
 * User Model
 * Represents a user account in the budget tracking system
 */
export interface User {
  id: number;
  email: string;
  password: string; // In a real app, this would be hashed
  firstName: string;
  lastName: string;
  createdAt: Date;
}

