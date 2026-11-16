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

// Compiles each package's `intl/<locale>.json` ICU message catalogs into `src/intl/compiled.ts`.
// Usage: node scripts/compileIntl.mjs [packageDir...] [--check]
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { compileStrings } = require('@internationalized/string-compiler');

const SOURCE_LOCALE = 'en-US';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const header = (await readFile(fileURLToPath(import.meta.url), 'utf8')).split('*/')[0] + '*/\n';

const args = process.argv.slice(2);
const check = args.includes('--check');
const requestedDirs = args.filter((arg) => !arg.startsWith('--'));

const findPackagesWithIntl = async () => {
  const packagesDir = path.join(repoRoot, 'packages');
  const names = await readdir(packagesDir);
  return names.map((name) => path.join(packagesDir, name)).filter((dir) => existsSync(path.join(dir, 'intl')));
};

const readCatalog = async (file) => {
  const catalog = JSON.parse(await readFile(file, 'utf8'));
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
    throw new Error(`${file} must contain a JSON object of message keys to ICU strings.`);
  }
  return catalog;
};

const compileCatalog = (messages) => compileStrings(messages, { format: 'esm' }).replace(/^export default\s*/, '').trim();

const buildSource = async (packageDir) => {
  const intlDir = path.join(packageDir, 'intl');
  const files = (await readdir(intlDir)).filter((file) => file.endsWith('.json')).sort();
  if (!files.includes(`${SOURCE_LOCALE}.json`)) {
    throw new Error(`${intlDir} must contain ${SOURCE_LOCALE}.json.`);
  }

  const source = await readCatalog(path.join(intlDir, `${SOURCE_LOCALE}.json`));
  const keys = Object.keys(source).sort();
  const locales = [];
  for (const file of files) {
    const locale = file.slice(0, -'.json'.length);
    if (Intl.getCanonicalLocales(locale)[0] !== locale) {
      throw new Error(`${file} must be named with a canonical locale code (e.g. fr-FR.json).`);
    }
    const catalog = await readCatalog(path.join(intlDir, file));
    const unknownKeys = Object.keys(catalog).filter((key) => !Object.hasOwn(source, key));
    if (unknownKeys.length) {
      throw new Error(`${file} has keys not in ${SOURCE_LOCALE}.json: ${unknownKeys.join(', ')}`);
    }
    // Untranslated keys fall back to English so a partial catalog never throws at runtime.
    const messages = Object.fromEntries(keys.map((key) => [key, catalog[key] ?? source[key]]));
    locales.push(`  '${locale}': ${compileCatalog(messages)},`);
  }

  const keyUnion = keys.map((key) => `  | '${key}'`).join('\n');
  return (
    `${header}/* eslint-disable @typescript-eslint/ban-ts-comment */\n// @ts-nocheck\n` +
    `// AUTO-GENERATED from intl/*.json by \`yarn intl:compile\`. Do not edit by hand.\n` +
    `import type { LocalizedString } from '@internationalized/string';\n\n` +
    `export type MessageKey =\n${keyUnion};\n\n` +
    `export const messages: Record<string, Record<MessageKey, LocalizedString>> = {\n${locales.join('\n')}\n};\n`
  );
};

const packageDirs = requestedDirs.length ? requestedDirs.map((dir) => path.resolve(dir)) : await findPackagesWithIntl();
const stale = [];
for (const packageDir of packageDirs) {
  const target = path.join(packageDir, 'src', 'intl', 'compiled.ts');
  const content = await buildSource(packageDir);
  const relativeTarget = path.relative(repoRoot, target);
  if (check) {
    const current = existsSync(target) ? await readFile(target, 'utf8') : '';
    if (current !== content) stale.push(relativeTarget);
  } else {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
    console.log(`Compiled ${relativeTarget}`);
  }
}

if (stale.length) {
  console.error(`Stale compiled messages (run yarn intl:compile): ${stale.join(', ')}`);
  process.exit(1);
}
