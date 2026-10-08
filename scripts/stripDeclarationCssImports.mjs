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
// Removes side-effect CSS imports from emitted declarations; they carry no types and don't resolve for consumers.
// Usage: node scripts/stripDeclarationCssImports.mjs <typesDir>
import fs from 'node:fs';
import path from 'node:path';

const CSS_IMPORT = /^\s*import\s+['"][^'"]+\.css['"];?[ \t]*\r?\n?/gm;

/**
 * Lists every declaration file under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function listDeclarations(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return listDeclarations(file);
    return entry.name.endsWith('.d.ts') ? [file] : [];
  });
}

const [typesDir] = process.argv.slice(2);
if (!typesDir) throw new Error('Usage: node scripts/stripDeclarationCssImports.mjs <typesDir>');

let changed = 0;
for (const file of listDeclarations(path.resolve(typesDir))) {
  const source = fs.readFileSync(file, 'utf8');
  const stripped = source.replace(CSS_IMPORT, '');
  if (stripped !== source) {
    fs.writeFileSync(file, stripped);
    changed++;
  }
}
console.log(`stripDeclarationCssImports: removed CSS imports from ${changed} file(s)`);
