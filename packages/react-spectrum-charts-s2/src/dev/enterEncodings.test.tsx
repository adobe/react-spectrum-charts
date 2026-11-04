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
import { ComponentType } from 'react';

import { act } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { Spec } from 'vega';
import * as vegaEmbed from 'vega-embed';

import { render } from '../test-utils/index.js';
import { DashboardDefinition } from './dashboardCoverage.js';
import { stubS2BrowserApis } from './dashboardTestUtils.js';

// Keyed items persist across data updates and don't re-run `enter`, so it may only hold constants.

type Encode = Record<string, Record<string, unknown> | undefined>;
type Node = { name?: string; type?: string; encode?: Encode; marks?: Node[] };

const findDashboardFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findDashboardFiles(fullPath);
    return entry.name.endsWith('.dashboard.tsx') ? [fullPath] : [];
  });

const isConstant = (rule: unknown): boolean =>
  typeof rule === 'object' && rule !== null && !Array.isArray(rule) && Object.keys(rule).join() === 'value';

const getEnterErrors = (encode: Encode | undefined, location: string): string[] => {
  if (!encode) return [];
  const sets = 'enter' in encode || 'update' in encode ? { '': encode } : encode;
  return Object.entries(sets).flatMap(([part, set]) => {
    const enter = (set as Encode | undefined)?.enter ?? {};
    const prefix = part ? `${location}.${part}` : location;
    return Object.entries(enter)
      .filter(([, rule]) => rule !== undefined && !isConstant(rule))
      .map(([property]) => `${prefix}.enter.${property}`);
  });
};

const getMarkErrors = (marks: Node[] | undefined, parent: string): string[] =>
  (marks ?? []).flatMap((mark, i) => {
    const fallbackName = `${mark.type}[${i}]`;
    const location = `${parent}/${mark.name ?? fallbackName}`;
    return [...getEnterErrors(mark.encode, location), ...getMarkErrors(mark.marks, location)];
  });

const getSpecErrors = (spec: Spec): string[] => {
  const guides = [
    ...(spec.axes ?? []).map((axis, i) => getEnterErrors(axis.encode as Encode, `axis[${i}]`)),
    ...(spec.legends ?? []).map((legend, i) => getEnterErrors(legend.encode as Encode, `legend[${i}]`)),
    getEnterErrors((spec.title as Node | undefined)?.encode, 'title'),
  ];
  return [...guides.flat(), ...getMarkErrors(spec.marks as Node[], '')];
};

type DashboardModule = { dashboard: DashboardDefinition } & Record<string, unknown>;

const dashboards = findDashboardFiles(__dirname).map((file) => {
  const module = jest.requireActual<DashboardModule>(file);
  const [Dashboard] = Object.entries(module)
    .filter(([name, value]) => name.endsWith('Dashboard') && typeof value === 'function')
    .map(([, value]) => value as ComponentType);
  return [module.dashboard.chartType, Dashboard] as const;
});

beforeAll(stubS2BrowserApis);
beforeEach(() => localStorage.clear());

test.each(dashboards)('%s dashboard specs only encode constants on enter', async (_, Dashboard) => {
  const specs: Spec[] = [];
  const embedSpy = jest.spyOn(vegaEmbed, 'default').mockImplementation((_el, spec) => {
    specs.push(spec as Spec);
    return new Promise(() => undefined);
  });

  const mounted = render(<Dashboard />);
  // charts embed after their first layout, so wait until no new specs arrive
  let count = -1;
  while (count !== specs.length) {
    count = specs.length;
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
  }
  mounted.unmount();
  embedSpy.mockRestore();

  expect([...new Set(specs.flatMap(getSpecErrors))].sort()).toEqual([]);
});
