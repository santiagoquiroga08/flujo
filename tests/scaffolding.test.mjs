import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('Scaffolding: package.json exists and has valid configuration', () => {
  const pkgPath = path.join(rootDir, 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'package.json must exist in root directory');
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.equal(pkg.name, 'flujo', 'package.json name should be "flujo"');
  assert.ok(pkg.scripts?.build, 'package.json must have a build script');
  assert.ok(pkg.scripts?.dev, 'package.json must have a dev script');
  assert.ok(pkg.dependencies?.next, 'package.json must depend on next');
  assert.ok(pkg.devDependencies?.typescript, 'package.json must have typescript');
  assert.ok(pkg.devDependencies?.tailwindcss, 'package.json must have tailwindcss');
});

test('Scaffolding: tsconfig.json exists and enforces strict mode', () => {
  const tsconfigPath = path.join(rootDir, 'tsconfig.json');
  assert.ok(fs.existsSync(tsconfigPath), 'tsconfig.json must exist in root directory');
  
  const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');
  // tsconfig created by Next.js is standard JSON with no comments
  const tsconfig = JSON.parse(tsconfigContent);
  assert.equal(tsconfig.compilerOptions?.strict, true, 'tsconfig.json must have compilerOptions.strict set to true');
  assert.ok(tsconfig.compilerOptions?.paths?.['@/*'], 'tsconfig.json must define @/* path alias');
});

test('Scaffolding: tailwind.config.ts exists', () => {
  const tailwindConfigPath = path.join(rootDir, 'tailwind.config.ts');
  assert.ok(fs.existsSync(tailwindConfigPath), 'tailwind.config.ts must exist');
});

test('Scaffolding: Next.js App Router basic structure exists', () => {
  assert.ok(fs.existsSync(path.join(rootDir, 'src', 'app', 'layout.tsx')), 'src/app/layout.tsx must exist');
  assert.ok(fs.existsSync(path.join(rootDir, 'src', 'app', 'page.tsx')), 'src/app/page.tsx must exist');
});
