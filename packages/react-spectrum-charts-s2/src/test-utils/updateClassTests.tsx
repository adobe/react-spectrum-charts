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
import { ReactElement, isValidElement } from 'react';

import { View } from 'vega';

import { UpdateClassification } from '@spectrum-charts/vega-spec-builder-s2';

import { getAppliedClass, setupChartHarness } from './chartStability.js';

/** A change to one prop: mount with `a`, update to `b`. */
export interface UpdateCase<P> {
  /** Props to mount with; defaults to none */
  a?: Partial<P>;
  /** Props to update to */
  b: Partial<P>;
  /** Issue that fixes a known disagreement; the test is expected to fail until it merges */
  knownIssue?: string;
  /** Runs before mounting, e.g. to enable draw-in; returns a function that undoes it */
  setup?: () => () => void;
}

/** Skips a prop whose change can't be tested by mounting and updating a chart. */
export interface SkippedUpdateCase {
  skip: string;
}

/** Changes to test for every prop, so a new prop fails type-checking until it has a case or a reason to skip. */
export type UpdateCases<P> = {
  [K in keyof Required<P>]-?: UpdateCase<P> | UpdateCase<P>[] | SkippedUpdateCase;
};

/** Builds a chart that renders the component under test with the given props. */
export type UpdateCaseChart<P> = (props: Partial<P>, onVegaViewReady: (view: View) => void) => ReactElement;

const toCases = <P,>(entry: UpdateCase<P> | UpdateCase<P>[] | SkippedUpdateCase): UpdateCase<P>[] | undefined => {
  if ('skip' in entry) {
    return undefined;
  }
  return Array.isArray(entry) ? entry : [entry];
};

const describeChange = <P,>({ a, b }: UpdateCase<P>, prop: string): string => {
  const format = (props: Partial<P> | undefined) => {
    const value = (props as Record<string, unknown> | undefined)?.[prop];
    if (typeof value === 'function') {
      return 'function';
    }
    if (isValidElement(value) || (Array.isArray(value) && value.some((entry) => isValidElement(entry)))) {
      return 'elements';
    }
    return JSON.stringify(value) ?? 'undefined';
  };
  return `${format(a)} → ${format(b)}`.slice(0, 80);
};

/**
 * Tests that every prop change routes as its declared update class and that the update matches a fresh mount.
 * @param component - component name, for test names
 * @param table - declared update class for every prop
 * @param chart - builds a chart that renders the component with the given props
 * @param cases - change to test for every prop
 */
export const describeUpdateClasses = <P,>(
  component: string,
  table: { [K in keyof Required<P>]: UpdateClassification },
  chart: UpdateCaseChart<P>,
  cases: UpdateCases<P>
) => {
  describe(`${component} update classes`, () => {
    const harness = setupChartHarness();
    const factory = (props: Partial<P>) => chart(props, harness.onVegaViewReady);

    const entries = Object.entries(cases) as [keyof P & string, UpdateCase<P> | UpdateCase<P>[] | SkippedUpdateCase][];
    for (const [prop, entry] of entries) {
      const declared = table[prop].update;
      const propCases = toCases(entry);
      if (!propCases) {
        test.skip(`${prop}: ${(entry as SkippedUpdateCase).skip}`, () => undefined);
        continue;
      }
      for (const propCase of propCases) {
        const run = propCase.knownIssue ? test.failing : test;
        const issue = propCase.knownIssue ? ` (fixed by ${propCase.knownIssue})` : '';
        run(`${prop} ${describeChange(propCase, prop)} routes as ${declared} and equals a fresh mount${issue}`, async () => {
          const teardown = propCase.setup?.();
          try {
            const { updated, fresh, applied } = await harness.compareUpdateToMount(
              factory,
              propCase.a ?? {},
              propCase.b
            );

            expect(getAppliedClass(applied)).toBe(declared);
            expect(updated).toEqual(fresh);
          } finally {
            teardown?.();
          }
        });
      }
    }
  });
};
