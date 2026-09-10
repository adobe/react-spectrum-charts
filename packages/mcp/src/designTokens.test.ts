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
// designTokens.ts does `import themes from '@spectrum-charts/themes'` (default import) because,
// at runtime, it's executed as native Node ESM against a webpack UMD bundle — Node's ESM/CJS
// interop binds the whole module.exports object to the default import in that case. Babel's
// CJS transform (used by Jest) instead expects a literal `.default` export when `__esModule` is
// set, which this UMD bundle doesn't provide, so the default import resolves to `undefined` under
// Jest. Re-export the real module under an explicit `default` key so both loaders behave the same.
jest.mock('@spectrum-charts/themes', () => ({ __esModule: true, default: jest.requireActual('@spectrum-charts/themes'), ...jest.requireActual('@spectrum-charts/themes') }));
jest.mock('@spectrum-charts/constants', () => ({ __esModule: true, default: jest.requireActual('@spectrum-charts/constants'), ...jest.requireActual('@spectrum-charts/constants') }));

import { DESIGN_TOKEN_CATEGORIES, getDesignTokenCategory } from './designTokens';

describe('DESIGN_TOKEN_CATEGORIES', () => {
  it('includes the expected category ids', () => {
    const ids = DESIGN_TOKEN_CATEGORIES.map((category) => category.id);
    expect(ids).toEqual(['colors', 'typography', 'spacing', 'svg-paths']);
  });

  it('has a unique id, title, description, and non-empty tokens for every category', () => {
    const ids = new Set<string>();
    for (const category of DESIGN_TOKEN_CATEGORIES) {
      expect(ids.has(category.id)).toBe(false);
      ids.add(category.id);

      expect(category.title.length).toBeGreaterThan(0);
      expect(category.description.length).toBeGreaterThan(0);
      expect(Object.keys(category.tokens).length).toBeGreaterThan(0);
    }
  });

  it('resolves colors tokens from the themes package', () => {
    const colors = getDesignTokenCategory('colors');
    expect(colors.tokens.scales).toBeDefined();
    expect(colors.tokens.categorical).toMatchObject({
      s2Categorical6: expect.anything(),
      s2Categorical12: expect.anything(),
      s2Categorical16: expect.anything(),
      s2Categorical20: expect.anything(),
    });
    expect(typeof colors.tokens.defaultFontColorToken).toBe('string');
  });

  it('resolves svg path tokens as non-empty strings', () => {
    const svgPaths = getDesignTokenCategory('svg-paths');
    expect(typeof svgPaths.tokens.referenceLineCaretPath).toBe('string');
    expect((svgPaths.tokens.referenceLineCaretPath as string).length).toBeGreaterThan(0);
    expect(typeof svgPaths.tokens.roundedSquarePath).toBe('string');
    expect((svgPaths.tokens.roundedSquarePath as string).length).toBeGreaterThan(0);
  });
});

describe('getDesignTokenCategory', () => {
  it('finds a category by id', () => {
    const category = getDesignTokenCategory('typography');
    expect(category.title).toBe('Spectrum 2 Typography');
  });

  it('throws when category not found', () => {
    expect(() => getDesignTokenCategory('nonexistent')).toThrow(
      'Design token category not found for id=nonexistent'
    );
  });
});
