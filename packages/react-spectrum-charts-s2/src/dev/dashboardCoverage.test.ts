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
import fs from 'fs';
import path from 'path';

import { DashboardDefinition, getDashboardCoverageErrors } from './dashboardCoverage.js';

const findDashboardFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findDashboardFiles(fullPath);
    return entry.name.endsWith('.dashboard.tsx') ? [fullPath] : [];
  });

const probe: DashboardDefinition['variations'][number] = {
  id: 'probe',
  title: 'Probe',
  description: 'Probe',
  dataset: 'test',
  coverage: [],
  render: () => null,
};

describe('getDashboardCoverageErrors', () => {
  test('accepts known ids and reasoned skips', () => {
    expect(
      getDashboardCoverageErrors({
        chartType: 'Test',
        variations: [probe],
        coverage: { Test: { a: ['probe'], b: { skip: 'Not visual' } } },
      })
    ).toEqual([]);
  });

  test('reports unknown ids, empty entries, blank skips and duplicate ids', () => {
    expect(
      getDashboardCoverageErrors({
        chartType: 'Test',
        variations: [probe, probe],
        coverage: { Test: { a: ['missing'], b: [], c: { skip: ' ' } } },
      })
    ).toEqual([
      'Test: duplicate variation id "probe"',
      'Test: Test.a references unknown variation "missing"',
      'Test: Test.b has no variations',
      'Test: Test.c skips coverage without a reason',
    ]);
  });
});

describe('variation dashboards', () => {
  const files = findDashboardFiles(__dirname);

  test('at least one dashboard is discovered', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  test.each(files.map((file) => [path.relative(__dirname, file), file]))('%s has a valid coverage map', (_, file) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { dashboard } = require(file) as { dashboard?: DashboardDefinition };
    expect(dashboard).toBeDefined();
    expect(getDashboardCoverageErrors(dashboard as DashboardDefinition)).toEqual([]);
  });
});
