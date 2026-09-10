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

/**
 * Compiles the data navigator's ICU source strings (intl/<locale>.json) into per-locale modules of
 * formatter functions, mirroring react-aria's build-time i18n pipeline (@internationalized/string-compiler
 * + LocalizedStringDictionary). Run via `yarn workspace @spectrum-charts/react-spectrum-charts-s2 compile:intl`;
 * it also runs before build:s2. The generated files under intl/compiled/ are committed so tests and tsc see them.
 */
import { compileString } from '@internationalized/string-compiler';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const intlDir = join(scriptDir, '../src/dataNavigator/intl');
const outDir = join(intlDir, 'compiled');

const COPYRIGHT = `/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */`;

/** en-US → enUS, fr-FR → frFR — a valid JS identifier for the locale's import binding. */
const identFor = (locale) => locale.replace(/[^a-zA-Z0-9]/g, '');

const localeFiles = readdirSync(intlDir)
  .filter((file) => file.endsWith('.json'))
  .sort();
if (!localeFiles.includes('en-US.json')) {
  throw new Error('intl/en-US.json is required as the source-of-truth locale.');
}

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const locales = [];
for (const file of localeFiles) {
  const locale = basename(file, '.json');
  locales.push(locale);
  const messages = JSON.parse(readFileSync(join(intlDir, file), 'utf8'));
  const entries = Object.entries(messages)
    .map(([key, icu]) => `  ${JSON.stringify(key)}: ${compileString(icu)},`)
    .join('\n');
  const content = `${COPYRIGHT}
/* eslint-disable */
// @ts-nocheck -- compiled formatter functions call protected LocalizedStringFormatter members, exactly as react-aria's untyped-JS intl output does.
// AUTO-GENERATED from intl/${file} by scripts/compileIntl.mjs. Do not edit by hand.
import type { LocalizedString } from '@internationalized/string';

const messages: Record<string, LocalizedString> = {
${entries}
};

export default messages;
`;
  writeFileSync(join(outDir, `${locale}.ts`), content);
}

const messageKeys = Object.keys(JSON.parse(readFileSync(join(intlDir, 'en-US.json'), 'utf8')));
const keyUnion = messageKeys.map((key) => `  | ${JSON.stringify(key)}`).join('\n');
const importLines = locales.map((locale) => `import ${identFor(locale)} from './${locale}';`).join('\n');
const dictEntries = locales.map((locale) => `  '${locale}': ${identFor(locale)},`).join('\n');

const indexContent = `${COPYRIGHT}
/* eslint-disable */
// AUTO-GENERATED from intl/*.json by scripts/compileIntl.mjs. Do not edit by hand.
import type { LocalizedString } from '@internationalized/string';

${importLines}

/** Every message key available to the data navigator's accessible descriptions. */
export type DataNavigatorMessageKey =
${keyUnion};

/** Compiled localized strings keyed by BCP-47 locale, consumed by LocalizedStringDictionary. */
export const dataNavigatorStrings: Record<string, Record<DataNavigatorMessageKey, LocalizedString>> = {
${dictEntries}
};
`;
writeFileSync(join(outDir, 'index.ts'), indexContent);

console.log(`Compiled data navigator intl for: ${locales.join(', ')}`);
