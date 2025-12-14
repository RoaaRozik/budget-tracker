import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {

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

