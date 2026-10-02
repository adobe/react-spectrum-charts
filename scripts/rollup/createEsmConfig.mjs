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
import json from '@rollup/plugin-json';
import fs from 'node:fs';
import path from 'node:path';
import esbuild from 'rollup-plugin-esbuild';
import preserveDirectives from 'rollup-plugin-preserve-directives';

// Directive and sourcemap-location warnings come from preserved "use client"; any other warning, including a circular import, fails the build.
const IGNORED_WARNINGS = new Set(['MODULE_LEVEL_DIRECTIVE', 'SOURCEMAP_ERROR']);

const isBareSpecifier = (id) => !id.startsWith('.') && !path.isAbsolute(id) && !id.startsWith('\0');

/**
 * Keeps side-effect CSS imports verbatim and copies each CSS file to the matching place in the output.
 * @param {string} root package directory that output paths mirror
 * @param {string} outDir output directory
 */
function copyCssImports(root, outDir) {
  return {
    name: 'copy-css-imports',
    resolveId(source, importer) {
      if (!source.endsWith('.css') || !importer) return null;
      const file = path.resolve(path.dirname(importer), source);
      const target = path.join(outDir, path.relative(root, file));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(file, target);
      return { id: source, external: true };
    },
  };
}

/**
 * Creates an unbundled ESM Rollup config: one output module per source module, every package import external.
 * @param {object} options
 * @param {string} options.root package directory
 * @param {Record<string, string>} options.input entry name to source path, relative to root
 * @param {string} [options.outDir] output directory relative to root
 * @param {string} [options.extension] output file extension
 * @param {string[]} [options.sideEffects] source files, relative to root, that run code on import; must match package.json sideEffects
 * @returns {import('rollup').RollupOptions}
 */
export function createEsmConfig({ root, input, outDir = 'dist', extension = '.js', sideEffects = [] }) {
  const dir = path.join(root, outDir);
  const sideEffectFiles = new Set(sideEffects.map((file) => path.join(root, file)));
  const { name, version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  return {
    input: Object.fromEntries(Object.entries(input).map(([key, file]) => [key, path.join(root, file)])),
    external: isBareSpecifier,
    // Without this, re-exports through barrel files leave bare imports that consumer bundlers warn about and drop.
    treeshake: { moduleSideEffects: (id, external) => external || sideEffectFiles.has(id) },
    makeAbsoluteExternalsRelative: false,
    plugins: [
      copyCssImports(root, dir),
      json({ preferConst: true }),
      esbuild({ target: 'es2017', jsx: 'automatic', tsconfig: false }),
      preserveDirectives(),
    ],
    output: {
      dir,
      format: 'es',
      preserveModules: true,
      preserveModulesRoot: root,
      entryFileNames: `[name]${extension}`,
      sourcemap: true,
      banner: `/*! ${name}@v${version} */`,
    },
    onwarn(warning) {
      if (IGNORED_WARNINGS.has(warning.code)) return;
      throw new Error(`${warning.code}: ${warning.message}`);
    },
  };
}
