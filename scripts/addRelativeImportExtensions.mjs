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

// Rewrites relative import specifiers in ESM packages to the fully specified paths Node requires:
// `./foo` -> `./foo.js`, `./dir` -> `./dir/index.js`, and adds `with { type: 'json' }` to JSON imports.
// Usage: node scripts/addRelativeImportExtensions.mjs [--check] <package dir>...
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.d.ts', '.js'];
const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'coverage']);

const args = process.argv.slice(2);
const check = args.includes('--check');
const roots = args.filter((arg) => arg !== '--check');

if (roots.length === 0) {
  console.error('Usage: node scripts/addRelativeImportExtensions.mjs [--check] <package dir>...');
  process.exit(1);
}

const isFile = (file) => fs.statSync(file, { throwIfNoEntry: false })?.isFile() ?? false;

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) yield* walk(path.join(dir, entry.name));
    } else if (/\.tsx?$/.test(entry.name)) {
      yield path.join(dir, entry.name);
    }
  }
}

/**
 * Resolves a relative specifier to its fully specified form, or returns undefined if it already is one.
 * @param {string} file importing file
 * @param {string} specifier relative import specifier
 * @returns {string | undefined}
 */
function fullySpecify(file, specifier) {
  const target = path.resolve(path.dirname(file), specifier);
  if (path.extname(specifier) && isFile(target)) return undefined;
  if (specifier.endsWith('.js') && SOURCE_EXTENSIONS.some((ext) => isFile(target.slice(0, -3) + ext))) return undefined;
  if (SOURCE_EXTENSIONS.some((ext) => isFile(target + ext))) return `${specifier}.js`;
  if (SOURCE_EXTENSIONS.some((ext) => isFile(path.join(target, `index${ext}`)))) {
    return `${specifier.replace(/\/$/, '')}/index.js`;
  }
  throw new Error(`${file}: cannot resolve "${specifier}"`);
}

/**
 * Returns the module specifier literal of an import, export, or dynamic import node.
 * @param {ts.Node} node
 * @returns {ts.StringLiteral | undefined}
 */
function getSpecifier(node) {
  if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
    return ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier : undefined;
  }
  if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
    const [arg] = node.arguments;
    return arg && ts.isStringLiteral(arg) ? arg : undefined;
  }
  if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
    return node.argument.literal;
  }
  return undefined;
}

const changedFiles = [];
for (const root of roots) {
  for (const file of walk(path.resolve(root))) {
    const text = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const edits = [];

    const visit = (node) => {
      const literal = getSpecifier(node);
      if (literal && literal.text.startsWith('.')) {
        const replacement = fullySpecify(file, literal.text);
        if (replacement) edits.push({ start: literal.getStart() + 1, end: literal.getEnd() - 1, text: replacement });
        if (ts.isImportDeclaration(node) && literal.text.endsWith('.json') && !node.attributes) {
          edits.push({ start: literal.getEnd(), end: literal.getEnd(), text: " with { type: 'json' }" });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);

    if (edits.length === 0) continue;
    changedFiles.push(path.relative(process.cwd(), file));
    if (check) continue;
    let output = text;
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
    }
    fs.writeFileSync(file, output);
  }
}

if (check && changedFiles.length > 0) {
  console.error(`Relative imports must be fully specified (run without --check to fix):\n${changedFiles.join('\n')}`);
  process.exit(1);
}
console.log(`${check ? 'Checked' : 'Updated'} ${changedFiles.length} file(s).`);
