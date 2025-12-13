import { Pipe, PipeTransform } from '@angular/core';

/**
 * Currency Format Pipe
 * Custom pipe to format numbers as currency
 * Usage: {{ amount | currencyFormat }}
 * 
 * This demonstrates Angular pipes - a way to transform data in templates
 */
@Pipe({
  name: 'currencyFormat',
  standalone: true // Standalone pipe (Angular 15+)
})
export class CurrencyFormatPipe implements PipeTransform {
  /**
   * Transform a number into a formatted currency string
   * @param value - The number to format
   * @param currency - Currency code (default: 'USD')
   * @returns Formatted currency string
   */
  transform(value: number | null | undefined, currency: string = 'USD'): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '$0.00';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value);
  }
}

