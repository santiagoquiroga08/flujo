import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

describe('Testing Setup: Vitest Configuration (TASK-04)', () => {
  it('package.json contains test script executing vitest run', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(pkg.scripts?.test).toBeDefined();
    expect(pkg.scripts.test).toMatch(/vitest\s+run/);
    expect(pkg.devDependencies?.vitest).toBeDefined();
  });

  it('vitest.config.ts exists and configures @/* path alias aligned with tsconfig.json', () => {
    const vitestConfigPath = path.join(rootDir, 'vitest.config.ts');
    expect(fs.existsSync(vitestConfigPath)).toBe(true);

    const content = fs.readFileSync(vitestConfigPath, 'utf8');
    expect(content).toContain('@');
    expect(content).toMatch(/['"]\.\/src['"]/);
  });

  it('executes TypeScript unit tests and basic assertions correctly', () => {
    const sum = (a: number, b: number): number => a + b;
    expect(sum(10, 20)).toBe(30);
  });
});
