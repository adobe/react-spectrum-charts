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
import { FOCUSED_DIMENSION, FOCUSED_ITEM } from '@spectrum-charts/constants';

import { getFocusedGroupOrItemMatchExpr } from './focusMatchUtils';

/** Evaluates a generated Vega boolean expression as JS, standing in for Vega's own `isValid`/`indexof`/`length` functions. */
const evalMatchExpr = (
  expr: string,
  datum: Record<string, unknown>,
  focusedDimension: unknown,
  focusedItem: unknown
): boolean => {
  const isValid = (v: unknown) => v !== null && v !== undefined;
  const indexof = (str: string, substr: string) => str.indexOf(substr);
  const length = (str: string) => str.length;
  // eslint-disable-next-line no-new-func
  const fn = new Function('datum', 'focusedDimension', 'focusedItem', 'isValid', 'indexof', 'length', `return (${expr});`);
  return Boolean(fn(datum, focusedDimension, focusedItem, isValid, indexof, length));
};

describe('getFocusedGroupOrItemMatchExpr()', () => {
  test('matches when the group itself is the focused dimension, regardless of convention', () => {
    const expr = getFocusedGroupOrItemMatchExpr('datum.series', 'prefix');
    expect(evalMatchExpr(expr, { series: 'A' }, 'A', null)).toBe(true);
    expect(evalMatchExpr(expr, { series: 'A' }, 'B', null)).toBe(false);
  });

  // Line's leaf id scheme is segmentId(color, index) — the color value is a prefix.
  test('prefix convention matches a focused leaf whose id is prefixed by the group value (Line)', () => {
    const expr = getFocusedGroupOrItemMatchExpr('datum.series', 'prefix');
    expect(evalMatchExpr(expr, { series: 'A' }, null, 'A__rsc__3')).toBe(true);
    expect(evalMatchExpr(expr, { series: 'A' }, null, 'B__rsc__3')).toBe(false);
  });

  // Bar's leaf id scheme is segmentId(dimension, color) — the color value is a suffix.
  test('suffix convention matches a focused leaf whose id is suffixed by the group value (Bar)', () => {
    const expr = getFocusedGroupOrItemMatchExpr('datum.color', 'suffix');
    expect(evalMatchExpr(expr, { color: 'Windows' }, null, 'Chrome__rsc__Windows')).toBe(true);
    expect(evalMatchExpr(expr, { color: 'Windows' }, null, 'Chrome__rsc__Mac')).toBe(false);
  });

  // Regression: each convention only checks its own half of the composite id, so a value that
  // happens to look like the OTHER convention's fragment must not false-match.
  test('prefix convention does not false-match a value that looks like a suffix', () => {
    const expr = getFocusedGroupOrItemMatchExpr('datum.series', 'prefix');
    // FOCUSED_ITEM 'Alpha__rsc__3' ends with '__rsc__3', but series '3' is not its prefix.
    expect(evalMatchExpr(expr, { series: '3' }, null, 'Alpha__rsc__3')).toBe(false);
  });

  test('suffix convention does not false-match a value that looks like a prefix', () => {
    const expr = getFocusedGroupOrItemMatchExpr('datum.color', 'suffix');
    // FOCUSED_ITEM 'Windows__rsc__Chrome' starts with 'Windows__rsc__', but color 'Windows' is not its suffix.
    expect(evalMatchExpr(expr, { color: 'Windows' }, null, 'Windows__rsc__Chrome')).toBe(false);
  });

  test('does not match when neither the group nor a focused item is relevant', () => {
    const expr = getFocusedGroupOrItemMatchExpr('datum.series', 'prefix');
    expect(evalMatchExpr(expr, { series: 'A' }, null, null)).toBe(false);
  });

  test('references FOCUSED_DIMENSION and FOCUSED_ITEM, and works with an arbitrary match expression', () => {
    const expr = getFocusedGroupOrItemMatchExpr('datum.value', 'suffix');
    expect(expr).toContain(FOCUSED_DIMENSION);
    expect(expr).toContain(FOCUSED_ITEM);
    expect(expr).toContain('datum.value');
  });
});
