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
import { CHART_FEATURE_CATALOG, getChartFeatureById } from './featureCatalog';

const VALID_CATEGORIES = ['mark', 'decoration', 'chart-level'];

describe('CHART_FEATURE_CATALOG', () => {
  it('has a unique id for every feature', () => {
    const ids = new Set<string>();
    for (const feature of CHART_FEATURE_CATALOG) {
      expect(ids.has(feature.id)).toBe(false);
      ids.add(feature.id);
    }
  });

  it('gives every feature a valid category and non-empty name/description', () => {
    for (const feature of CHART_FEATURE_CATALOG) {
      expect(VALID_CATEGORIES).toContain(feature.category);
      expect(feature.name.length).toBeGreaterThan(0);
      expect(feature.description.length).toBeGreaterThan(0);
    }
  });

  it('points every appliesTo entry at either "chart" or another catalog feature id', () => {
    const ids = new Set(CHART_FEATURE_CATALOG.map((feature) => feature.id));
    for (const feature of CHART_FEATURE_CATALOG) {
      expect(feature.appliesTo.length).toBeGreaterThan(0);
      for (const target of feature.appliesTo) {
        expect(target === 'chart' || ids.has(target)).toBe(true);
      }
    }
  });

  it('gives every feature an optionsType with a typeName and filePath', () => {
    for (const feature of CHART_FEATURE_CATALOG) {
      expect(feature.optionsType.typeName.length).toBeGreaterThan(0);
      expect(feature.optionsType.filePath.length).toBeGreaterThan(0);
    }
  });

  it('only sets s1Maturity/s2Maturity when the corresponding rscSupport flag is true', () => {
    for (const feature of CHART_FEATURE_CATALOG) {
      const { s1, s2, s1Maturity, s2Maturity } = feature.rscSupport;
      if (s1Maturity) expect(s1).toBe(true);
      if (s2Maturity) expect(s2).toBe(true);
    }
  });
});

describe('getChartFeatureById', () => {
  it('finds a feature by id', () => {
    const feature = getChartFeatureById('line');
    expect(feature.name).toBe('Line');
    expect(feature.category).toBe('mark');
  });

  it('throws when feature not found', () => {
    expect(() => getChartFeatureById('nonexistent')).toThrow('Chart feature not found for id=nonexistent');
  });
});
