import { describe, it, expect } from 'vitest';
import Home from '@/app/page';

describe('Vitest Setup Smoke Test', () => {
  it('executes TypeScript unit tests and basic assertions correctly', () => {
    const sum = (a: number, b: number): number => a + b;
    expect(sum(10, 20)).toBe(30);
  });

  it('runs in node environment without errors', () => {
    expect(typeof process).toBe('object');
    expect(typeof process.cwd).toBe('function');
  });

  it('resolves @/* path alias correctly to ./src', () => {
    expect(Home).toBeDefined();
    expect(typeof Home).toBe('function');
  });
});
