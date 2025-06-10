import { describe, it, expect } from 'vitest';
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formats a valid date string', () => {
    const result = formatDate('2024-01-02T03:04:05Z');
    expect(result).toBe('02.01.2024 03:04');
  });

  it('returns hyphen for invalid or null input', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate('not-a-date')).toBe('-');
  });
});
