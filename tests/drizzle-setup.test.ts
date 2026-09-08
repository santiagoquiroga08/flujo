import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

describe('SQLite and Drizzle ORM Setup (TASK-05)', () => {
  it('package.json contains drizzle-orm and better-sqlite3 in dependencies', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(pkg.dependencies?.['drizzle-orm']).toBeDefined();
    expect(pkg.dependencies?.['better-sqlite3']).toBeDefined();
  });

  it('package.json contains drizzle-kit and @types/better-sqlite3 in devDependencies', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    expect(pkg.devDependencies?.['drizzle-kit']).toBeDefined();
    expect(pkg.devDependencies?.['@types/better-sqlite3']).toBeDefined();
  });

  it('package.json contains db:generate and db:push scripts', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    expect(pkg.scripts?.['db:generate']).toBe('drizzle-kit generate');
    expect(pkg.scripts?.['db:push']).toBe('drizzle-kit push');
  });

  it('drizzle.config.ts exists and configures sqlite dialect and schema path', () => {
    const configPath = path.join(rootDir, 'drizzle.config.ts');
    expect(fs.existsSync(configPath)).toBe(true);

    const content = fs.readFileSync(configPath, 'utf8');
    expect(content).toContain('dialect');
    expect(content).toContain('sqlite');
    expect(content).toContain('./src/db/schema.ts');
  });

  it('better-sqlite3 initializes and executes queries in memory', async () => {
    const Database = (await import('better-sqlite3')).default;
    const db = new Database(':memory:');
    const row = db.prepare('SELECT 1 as val').get() as { val: number };
    expect(row.val).toBe(1);
    db.close();
  });
});
