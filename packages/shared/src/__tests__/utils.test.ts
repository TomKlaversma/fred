import { describe, expect, it } from 'vitest';
import { slugify } from '../utils';

describe('slugify', () => {
  it('should lowercase the input', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should replace spaces with hyphens', () => {
    expect(slugify('my company name')).toBe('my-company-name');
  });

  it('should remove special characters', () => {
    expect(slugify('Acme Corp.')).toBe('acme-corp');
  });

  it('should collapse consecutive hyphens', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('should trim leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello');
  });

  it('should handle ampersands and symbols', () => {
    expect(slugify('Ben & Jerry\'s')).toBe('ben-jerry-s');
  });

  it('should handle already-slugified strings', () => {
    expect(slugify('already-slugified')).toBe('already-slugified');
  });

  it('should handle empty strings', () => {
    expect(slugify('')).toBe('');
  });

  it('should handle strings with numbers', () => {
    expect(slugify('Company 123')).toBe('company-123');
  });

  it('should trim whitespace before slugifying', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });
});
