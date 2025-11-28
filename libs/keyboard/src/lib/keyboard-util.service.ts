import { Injectable } from '@angular/core';
import { KeyboardConfig } from './keyboard.store';

@Injectable({ providedIn: 'root' })
export class KeyboardUtilService {
  /**
   * Generate a numeric keyboard config
   */
  getNumericConfig(field: string, title: string, value: string, allowDecimal = true): KeyboardConfig {
    return {
      type: 'numeric',
      title,
      initialValue: value ?? '',
      allowDecimal,
    };
  }

  /**
   * Generate a custom keyboard config for equipment fields
   */
  getEquipmentConfig(field: string, title: string, value: string, options: string[]): KeyboardConfig {
    return {
      type: 'custom',
      title,
      initialValue: value ?? '',
      simpleButtons: this.sortEquipmentOptions(options),
    };
  }

  /**
   * Sort equipment options: numbers before letters, then alpha
   */
  sortEquipmentOptions(options: string[]): string[] {
    return [...options].sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      const isNumA = !isNaN(numA);
      const isNumB = !isNaN(numB);
      if (isNumA && isNumB) return numA - numB;
      if (isNumA) return -1;
      if (isNumB) return 1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }
}
