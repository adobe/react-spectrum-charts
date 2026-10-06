/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
// Packs each built ESM package and validates its exports and types with publint and arethetypeswrong,
// checks that published declarations only import packages whose types consumers will get,
// then imports every export in plain Node to catch output that only works through a bundler.
// Usage: node scripts/checkPackageExports.mjs (run after yarn build:s2)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

// nodeImport is false for packages whose modules import CSS, which only bundlers can load.
const PACKAGES = {
  'core-s2': { nodeImport: true },
  schemas: { nodeImport: true },
  'vega-spec-builder-s2': { nodeImport: true },
  'react-spectrum-charts-s2': { nodeImport: false },
};

const bin = (name) => path.join(root, 'node_modules', '.bin', name);
const run = (command, args, options = {}) => execFileSync(command, args, { stdio: 'inherit', ...options });

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const declarationFiles = (dir) =>
  fs.readdirSync(dir, { recursive: true }).filter((file) => file.endsWith('.d.ts')).map((file) => path.join(dir, file));
const packageNameOf = (specifier) => specifier.split('/').slice(0, specifier.startsWith('@') ? 2 : 1).join('/');
const typesPackageOf = (name) => `@types/${name.replace(/^@/, '').replace('/', '__')}`;
const shipsTypes = (name) => {
  const dir = path.join(root, 'node_modules', name);
  const manifest = readJson(path.join(dir, 'package.json'));
  return Boolean(
    manifest.types || manifest.typings || JSON.stringify(manifest.exports ?? {}).includes('"types"') || fs.existsSync(path.join(dir, 'index.d.ts'))
  );
};

// Returns packages imported by published declarations that consumers would not get types for.
const findUndeclaredTypeDependencies = (packageDir, manifest) => {
  const dependencies = manifest.dependencies ?? {};
  const peers = manifest.peerDependencies ?? {};
  const specifiers = new Set();
  for (const file of declarationFiles(path.join(packageDir, 'dist'))) {
    for (const [, specifier] of fs.readFileSync(file, 'utf8').matchAll(/(?:from|import\(?)\s*['"]([^'"]+)['"]/g)) {
      if (!specifier.startsWith('.') && !specifier.startsWith('node:')) specifiers.add(packageNameOf(specifier));
    }
  }
  const problems = [];
  for (const name of [...specifiers].filter((specifier) => specifier !== manifest.name).sort()) {
    if (peers[name]) continue;
    if (!dependencies[name]) problems.push(`${name} is not a dependency or peer dependency`);
    else if (!shipsTypes(name) && !dependencies[typesPackageOf(name)]) problems.push(`${name} needs ${typesPackageOf(name)} as a dependency`);
  }
  return problems;
};

const packDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rsc-pack-'));
const failures = [];
try {
  for (const [name, { nodeImport }] of Object.entries(PACKAGES)) {
    const packageName = `@spectrum-charts/${name}`;
    console.log(`\n=== ${packageName}`);
    const packageDir = path.join(root, 'packages', name);
    const output = execFileSync('npm', ['pack', '--silent', '--pack-destination', packDir], {
      cwd: packageDir,
      encoding: 'utf8',
    });
    const tarball = path.join(packDir, output.trim().split('\n').pop());
    const manifest = readJson(path.join(packageDir, 'package.json'));
    const typeProblems = findUndeclaredTypeDependencies(packageDir, manifest);
    for (const problem of typeProblems) console.error(`declarations: ${problem}`);
    if (typeProblems.length) failures.push(`${name}: declaration dependencies`);
    else console.log('declaration dependencies: ok');
    for (const [tool, args] of [
      ['publint', [tarball, '--strict', '--level', 'warning']],
      ['attw', [tarball, '--profile', 'esm-only', '--format', 'table-flipped']],
    ]) {
      try {
        run(bin(tool), args);
      } catch {
        failures.push(`${name}: ${tool}`);
      }
    }
    if (!nodeImport) continue;
    for (const subpath of Object.keys(manifest.exports).filter((key) => !key.endsWith('.json'))) {
      const specifier = path.posix.join(packageName, subpath);
      try {
        run(process.execPath, ['--input-type=module', '--eval', `await import('${specifier}');`], { cwd: root });
        console.log(`node import ${specifier}: ok`);
      } catch {
        failures.push(`${name}: node import ${specifier}`);
      }
    }
  }
} finally {
  fs.rmSync(packDir, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\nPackage export checks failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('\nAll package export checks passed.');
