import { SelectedCell } from '../types';

/**
 * Compute date range from an array of date strings
 */
export function computeDateRange(dates: string[]): { 
  earliest: string | null; 
  latest: string | null; 
  differenceInDays: number | null;
  totalDays: number;
  debugInfo?: string;
} {
  if (dates.length === 0) {
    return { earliest: null, latest: null, differenceInDays: null, totalDays: 0, debugInfo: 'No dates provided' };
  }

  // Debug: log the input dates
  console.log('Input dates:', dates);

  const validDates = dates
    .map(dateStr => {
      // Handle different date formats and ensure we parse correctly
      const date = new Date(dateStr);
      console.log(`Parsing "${dateStr}" -> ${date.toISOString()} (valid: ${!isNaN(date.getTime())})`);
      return date;
    })
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  console.log('Valid dates after parsing:', validDates.map(d => d.toISOString()));

  if (validDates.length === 0) {
    return { earliest: null, latest: null, differenceInDays: null, totalDays: 0, debugInfo: 'No valid dates found' };
  }

  if (validDates.length === 1) {
    return { 
      earliest: validDates[0].toISOString().split('T')[0], 
      latest: validDates[0].toISOString().split('T')[0], 
      differenceInDays: 0, 
      totalDays: 1,
      debugInfo: 'Only one date selected'
    };
  }

  const earliest = validDates[0];
  const latest = validDates[validDates.length - 1];
  const differenceInDays = Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24));

  console.log(`Date range: ${earliest.toISOString()} to ${latest.toISOString()}, difference: ${differenceInDays} days`);

  return {
    earliest: earliest.toISOString().split('T')[0],
    latest: latest.toISOString().split('T')[0],
    differenceInDays,
    totalDays: validDates.length,
    debugInfo: `${validDates.length} valid dates, ${differenceInDays} day range`
  };
}

/**
 * Compute numerical values based on specified type
 */
export function computeNumerical(
  numbers: number[], 
  type: 'sum' | 'average' | 'range' | 'count' | 'countUnique'
): number | string {
  if (numbers.length === 0) return 0;

  const validNumbers = numbers.filter(num => !isNaN(num) && isFinite(num));
  
  if (validNumbers.length === 0) return 0;

  switch (type) {
    case 'sum':
      return validNumbers.reduce((sum, num) => sum + num, 0);
    
    case 'average':
      return validNumbers.reduce((sum, num) => sum + num, 0) / validNumbers.length;
    
    case 'range':
      const min = Math.min(...validNumbers);
      const max = Math.max(...validNumbers);
      return max - min;
    
    case 'count':
      return validNumbers.length;
    
    case 'countUnique':
      return getUniqueValues(validNumbers).length;
    
    default:
      return 0;
  }
}

/**
 * Get unique values from an array
 */
export function getUniqueValues(values: any[]): any[] {
  return Array.from(new Set(values));
}

/**
 * Format number based on data type
 */
export function formatNumber(value: number, dataType: string): string {
  if (dataType === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  
  if (dataType === 'number' && value % 1 !== 0) {
    return value.toFixed(2);
  }
  
  return value.toString();
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Group selected cells by field name and data type
 */
export function groupSelectedCells(selectedCells: SelectedCell[]): Record<string, SelectedCell[]> {
  return selectedCells.reduce((groups, cell) => {
    const key = `${cell.fieldName}-${cell.dataType}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(cell);
    return groups;
  }, {} as Record<string, SelectedCell[]>);
}