/**
 * Utilities for generating key labels in the onboarding flow
 */

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const ALPHABET_NO_IO = ALPHABET.filter((l) => l !== 'I' && l !== 'O');

/**
 * Generate series labels with optional prefix (e.g., Z1-Z14, L1-L20, or pure numbers 1-48)
 * @param prefix - Optional prefix (e.g., "Z", "L", "Apt "). Empty string = pure numbers
 * @param from - Starting number (inclusive)
 * @param to - Ending number (inclusive)
 */
export function generateSeries(prefix: string, from: number, to: number): string[] {
  if (from > to || from < 1 || to > 9999) {
    return [];
  }
  return Array.from({ length: to - from + 1 }, (_, i) => {
    const num = from + i;
    return prefix ? `${prefix}${num}` : `${num}`;
  });
}

/**
 * Generate preview string for series
 */
export function generateSeriesPreview(prefix: string, from: number, to: number): string {
  if (!from || !to || from > to || from < 1 || to > 9999) {
    return 'Invalid range';
  }

  const first = prefix ? `${prefix}${from}` : `${from}`;
  const last = prefix ? `${prefix}${to}` : `${to}`;
  const count = to - from + 1;

  if (count <= 3) {
    return generateSeries(prefix, from, to).join(', ');
  }

  return `${first}, ${prefix ? `${prefix}${from + 1}` : `${from + 1}`}, ... ${last} (${count} keys)`;
}

/**
 * Validate a key label
 */
export function validateLabel(label: string): boolean {
  return label.length > 0 && label.length <= 50;
}

/**
 * Check if label is unique in the list
 */
export function isLabelUnique(label: string, existingLabels: string[]): boolean {
  return !existingLabels.includes(label);
}

/**
 * Default access area suggestions for Swedish housing cooperatives (BRF)
 */
export const DEFAULT_ACCESS_AREAS = [
  'Port',
  'Laundry',
  'Basement',
  'Attic',
  'Garage',
  'Bike room',
  'Storage',
];
