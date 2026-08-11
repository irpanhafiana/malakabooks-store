import { TruncatePipe } from './truncate.pipe';
import { describe, it, expect } from 'vitest';

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();

  it('should return empty string for null or empty input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null as any)).toBe('');
  });

  it('should return original text if length <= limit', () => {
    expect(pipe.transform('Hello World', 20)).toBe('Hello World');
  });

  it('should truncate text longer than limit with trailing dots', () => {
    expect(pipe.transform('Hello World, this is a long text', 10)).toBe('Hello Worl...');
  });

  it('should respect custom trail parameter', () => {
    expect(pipe.transform('Hello World', 5, '***')).toBe('Hello***');
  });
});
