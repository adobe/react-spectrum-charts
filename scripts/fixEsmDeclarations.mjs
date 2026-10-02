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
// Adds extensions to relative specifiers in emitted declarations so they resolve under node16/nodenext ESM.
// Usage: node scripts/fixEsmDeclarations.mjs <typesDir> [--out <dir>] [--ext .js|.mjs]
// --ext .mjs writes a .d.mts tree for packages whose `import` condition points at .mjs output.
import fs from 'node:fs';
import path from 'node:path';

const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}(?:\/[^'"]*)?)\2/g;
const CSS_IMPORT = /^\s*import\s+['"][^'"]+\.css['"];?\s*$/gm;

/**
 * Lists every non-test declaration file under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function listDeclarations(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return listDeclarations(file);
    return entry.name.endsWith('.d.ts') && !/\.test\.d\.ts$/.test(entry.name) ? [file] : [];
  });
}

/**
 * Resolves an extensionless relative specifier to the fully specified path of its runtime module.
 * @param {string} specifier
 * @param {string} fromFile declaration file containing the specifier
 * @param {string} ext runtime file extension
 * @returns {string}
 */
export function resolveSpecifier(specifier, fromFile, ext) {
  if (/\.(m?js|json)$/.test(specifier)) return specifier;
  const base = path.resolve(path.dirname(fromFile), specifier);
  if (fs.existsSync(`${base}.d.ts`)) return `${specifier}${ext}`;
  if (fs.existsSync(path.join(base, 'index.d.ts'))) return `${specifier.replace(/\/$/, '')}/index${ext}`;
  throw new Error(`Cannot resolve "${specifier}" from ${fromFile}`);
}

/**
 * Rewrites one declaration file's contents.
 * @param {string} source
 * @param {string} file
 * @param {string} ext
 * @returns {string}
 */
export function fixDeclaration(source, file, ext) {
  const fixed = source
    .replace(CSS_IMPORT, '')
    .replace(
      SPECIFIER,
      (_, prefix, quote, specifier) => `${prefix}${quote}${resolveSpecifier(specifier, file, ext)}${quote}`
    );
  // Declaration maps describe the .d.ts files, so a .d.mts copy must not point at them.
  return ext === '.mjs' ? fixed.replace(/^\/\/# sourceMappingURL=.*$/m, '') : fixed;
}

function main() {
  const [typesArg, ...rest] = process.argv.slice(2);
  const option = (name, fallback) => {
    const index = rest.indexOf(name);
    return index === -1 ? fallback : rest[index + 1];
  };
  if (!typesArg) throw new Error('Usage: fixEsmDeclarations.mjs <typesDir> [--out <dir>] [--ext .js|.mjs]');
  const typesDir = path.resolve(typesArg);
  const outDir = path.resolve(option('--out', typesArg));
  const ext = option('--ext', '.js');
  const declarationExt = ext === '.mjs' ? '.d.mts' : '.d.ts';

  const files = listDeclarations(typesDir);
  for (const file of files) {
    const target = path.join(outDir, path.relative(typesDir, file)).replace(/\.d\.ts$/, declarationExt);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, fixDeclaration(fs.readFileSync(file, 'utf8'), file, ext));
  }
  console.log(
    `fixEsmDeclarations: wrote ${files.length} ${declarationExt} files to ${path.relative(process.cwd(), outDir)}`
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
