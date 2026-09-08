import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('Formatting: .prettierrc exists and is valid JSON', () => {
  const prettierrcPath = path.join(rootDir, '.prettierrc');
  assert.ok(fs.existsSync(prettierrcPath), '.prettierrc must exist in root directory');

  const content = fs.readFileSync(prettierrcPath, 'utf8');
  const config = JSON.parse(content);
  assert.equal(config.singleQuote, true, '.prettierrc should use singleQuote: true');
  assert.equal(config.semi, true, '.prettierrc should use semi: true');
});

test('Formatting: .prettierignore exists and ignores build/cache dirs', () => {
  const ignorePath = path.join(rootDir, '.prettierignore');
  assert.ok(fs.existsSync(ignorePath), '.prettierignore must exist in root directory');

  const content = fs.readFileSync(ignorePath, 'utf8');
  assert.ok(content.includes('node_modules'), '.prettierignore must ignore node_modules');
  assert.ok(content.includes('.next'), '.prettierignore must ignore .next');
  assert.ok(content.includes('package-lock.json'), '.prettierignore must ignore package-lock.json');
});

test('Formatting: package.json contains format scripts and prettier dependency', () => {
  const pkgPath = path.join(rootDir, 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'package.json must exist');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.ok(pkg.scripts?.['format:check'], 'package.json must have script "format:check"');
  assert.ok(pkg.scripts?.['format:write'], 'package.json must have script "format:write"');
  assert.ok(pkg.devDependencies?.prettier, 'package.json must have prettier in devDependencies');
});
