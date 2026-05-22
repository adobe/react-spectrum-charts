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
 * Unit tests for the hover-context resolver.
 *
 * One `describe` per matrix cell (A–F). Each cell:
 *   1. Snapshots the full `HoverContext` object produced by `getHoverContext`.
 *   2. Snapshots `getSeriesHoverPredicate(ctx)` — the series-level filter / opacity expression.
 *   3. Snapshots `getItemHoverPredicate(ctx, MARK_ID)` — the item-level filter expression.
 *
 * Matrix cells (see planning/issues/displayOnHover-hover-namespace-audit.md):
 *
 *   | Cell | parent interactive | trendline interactive | interactionMode |
 *   |------|--------------------|-----------------------|-----------------|
 *   | A    | yes                | no                    | item            |
 *   | B    | yes                | yes                   | item            |
 *   | C    | yes                | no                    | dimension       |
 *   | D    | yes                | yes                   | dimension       |
 *   | E    | no                 | yes                   | item            |
 *   | F    | no                 | yes                   | dimension       |
 */

import { MARK_ID } from '@spectrum-charts/constants';

import { defaultLineOptions } from '../trendline/trendlineTestUtils';
import { LineSpecOptions } from '../types';
import { HoverContext, getHoverContext, getItemHoverPredicate, getSeriesHoverPredicate } from './hoverContext';

type Cell = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/** Builds a LineSpecOptions for the given matrix cell using minimal interactivity flags. */
const buildOptions = (cell: Cell): LineSpecOptions => {
  const parentTooltip = cell === 'A' || cell === 'B' || cell === 'C' || cell === 'D';
  const trendlineTooltip = cell === 'B' || cell === 'D' || cell === 'E' || cell === 'F';
  const dimensionMode = cell === 'C' || cell === 'D' || cell === 'F';
  const interactiveMarkName = parentTooltip ? 'line0' : trendlineTooltip ? 'line0Trendline' : undefined;

  return {
    ...defaultLineOptions,
    chartTooltips: parentTooltip ? [{}] : [],
    trendlines: trendlineTooltip ? [{ method: 'linear', chartTooltips: [{}] }] : [],
    interactionMode: dimensionMode ? 'dimension' : 'nearest',
    interactiveMarkName,
  };
};

const buildCtx = (cell: Cell): HoverContext => getHoverContext(buildOptions(cell));

describe('getHoverContext — cell A (parent tooltip, item mode)', () => {
  let ctx: HoverContext;

  beforeEach(() => {
    ctx = buildCtx('A');
  });

  test('context shape', () => {
    expect(ctx).toStrictEqual({
      itemPrefixes: ['line0'],
      dimensionPrefixes: [],
      isHighlightedByGroupParent: false,
      isHighlightedByGroupTrendline: false,
      hasPopoverInteractivity: false,
      dimensionField: undefined,
      hasSelection: true,
    });
  });

  test('getSeriesHoverPredicate references line0_hoveredItem only (no dimension, no trendline)', () => {
    const expr = getSeriesHoverPredicate(ctx);
    expect(expr).toContain('line0_hoveredItem');
    expect(expr).not.toContain('line0Trendline');
    expect(expr).not.toContain('dimensionHoverArea');
    expect(expr).toContain('selectedSeries');
    expect(expr).toContain('controlledHighlightedTable');
    expect(expr).toContain('controlledHighlightedSeries');
  });

  test('getSeriesHoverPredicate snapshot', () => {
    expect(getSeriesHoverPredicate(ctx)).toMatchInlineSnapshot(
      `"isValid(line0_hoveredItem) && line0_hoveredItem.rscSeriesId === datum.rscSeriesId || isValid(selectedSeries) && selectedSeries === datum.rscSeriesId || indexof(pluck(data('controlledHighlightedTable'), 'rscSeriesId'), datum.rscSeriesId) > -1 || isValid(controlledHighlightedSeries) && controlledHighlightedSeries === datum.rscSeriesId"`
    );
  });

  test('getItemHoverPredicate references line0_hoveredItem, idKey-level (no dimension, no trendline)', () => {
    const expr = getItemHoverPredicate(ctx, MARK_ID);
    expect(expr).toContain('line0_hoveredItem');
    expect(expr).toContain(MARK_ID);
    expect(expr).not.toContain('line0Trendline');
    expect(expr).not.toContain('dimensionHoverArea');
    expect(expr).toContain('controlledHighlightedItem');
  });

  test('getItemHoverPredicate snapshot', () => {
    expect(getItemHoverPredicate(ctx, MARK_ID)).toMatchInlineSnapshot(
      `"isArray(controlledHighlightedItem) && indexof(controlledHighlightedItem, datum.rscMarkId) > -1 || isValid(line0_hoveredItem) && line0_hoveredItem.rscMarkId === datum.rscMarkId"`
    );
  });
});

describe('getHoverContext — cell B (parent + trendline tooltip, item mode)', () => {
  let ctx: HoverContext;

  beforeEach(() => {
    ctx = buildCtx('B');
  });

  test('context shape', () => {
    expect(ctx).toStrictEqual({
      itemPrefixes: ['line0', 'line0Trendline'],
      dimensionPrefixes: [],
      isHighlightedByGroupParent: false,
      isHighlightedByGroupTrendline: false,
      hasPopoverInteractivity: false,
      dimensionField: undefined,
      hasSelection: true,
    });
  });

  test('getSeriesHoverPredicate references both prefixes, no dimension', () => {
    const expr = getSeriesHoverPredicate(ctx);
    expect(expr).toContain('line0_hoveredItem');
    expect(expr).toContain('line0Trendline_hoveredItem');
    expect(expr).not.toContain('dimensionHoverArea');
  });

  test('getSeriesHoverPredicate snapshot', () => {
    expect(getSeriesHoverPredicate(ctx)).toMatchInlineSnapshot(
      `"isValid(line0_hoveredItem) && line0_hoveredItem.rscSeriesId === datum.rscSeriesId || isValid(line0Trendline_hoveredItem) && line0Trendline_hoveredItem.rscSeriesId === datum.rscSeriesId || isValid(selectedSeries) && selectedSeries === datum.rscSeriesId || indexof(pluck(data('controlledHighlightedTable'), 'rscSeriesId'), datum.rscSeriesId) > -1 || isValid(controlledHighlightedSeries) && controlledHighlightedSeries === datum.rscSeriesId"`
    );
  });

  test('getItemHoverPredicate references both prefixes, idKey-level', () => {
    const expr = getItemHoverPredicate(ctx, MARK_ID);
    expect(expr).toContain('line0_hoveredItem');
    expect(expr).toContain('line0Trendline_hoveredItem');
    expect(expr).not.toContain('dimensionHoverArea');
  });

  test('getItemHoverPredicate snapshot', () => {
    expect(getItemHoverPredicate(ctx, MARK_ID)).toMatchInlineSnapshot(
      `"isArray(controlledHighlightedItem) && indexof(controlledHighlightedItem, datum.rscMarkId) > -1 || isValid(line0_hoveredItem) && line0_hoveredItem.rscMarkId === datum.rscMarkId || isValid(line0Trendline_hoveredItem) && line0Trendline_hoveredItem.rscMarkId === datum.rscMarkId"`
    );
  });
});

describe('getHoverContext — cell C (parent tooltip, dimension mode)', () => {
  let ctx: HoverContext;

  beforeEach(() => {
    ctx = buildCtx('C');
  });

  test('context shape', () => {
    expect(ctx).toStrictEqual({
      itemPrefixes: ['line0'],
      dimensionPrefixes: ['line0'],
      isHighlightedByGroupParent: false,
      isHighlightedByGroupTrendline: false,
      hasPopoverInteractivity: false,
      dimensionField: 'datetime0',
      hasSelection: true,
    });
  });

  test('getSeriesHoverPredicate includes item hover and dimension hover for parent prefix', () => {
    const expr = getSeriesHoverPredicate(ctx);
    expect(expr).toContain('line0_hoveredItem');
    expect(expr).toContain('line0_dimensionHoverArea_hoveredItem');
    expect(expr).not.toContain('line0Trendline');
  });

  test('getSeriesHoverPredicate snapshot', () => {
    expect(getSeriesHoverPredicate(ctx)).toMatchInlineSnapshot(
      `"isValid(line0_hoveredItem) && line0_hoveredItem.rscSeriesId === datum.rscSeriesId || isValid(line0_dimensionHoverArea_hoveredItem) || isValid(selectedSeries) && selectedSeries === datum.rscSeriesId || indexof(pluck(data('controlledHighlightedTable'), 'rscSeriesId'), datum.rscSeriesId) > -1 || isValid(controlledHighlightedSeries) && controlledHighlightedSeries === datum.rscSeriesId"`
    );
  });

  test('getItemHoverPredicate includes item hover and dimension-field match', () => {
    const expr = getItemHoverPredicate(ctx, MARK_ID);
    expect(expr).toContain('line0_hoveredItem');
    expect(expr).toContain('line0_dimensionHoverArea_hoveredItem');
    expect(expr).toContain('datetime0');
  });

  test('getItemHoverPredicate snapshot', () => {
    expect(getItemHoverPredicate(ctx, MARK_ID)).toMatchInlineSnapshot(
      `"isArray(controlledHighlightedItem) && indexof(controlledHighlightedItem, datum.rscMarkId) > -1 || isValid(line0_hoveredItem) && line0_hoveredItem.rscMarkId === datum.rscMarkId || isValid(line0_dimensionHoverArea_hoveredItem) && +line0_dimensionHoverArea_hoveredItem.datetime0 === +datum.datetime0"`
    );
  });
});

describe('getHoverContext — cell D (parent + trendline tooltip, dimension mode)', () => {
  let ctx: HoverContext;

  beforeEach(() => {
    ctx = buildCtx('D');
  });

  test('context shape', () => {
    expect(ctx).toStrictEqual({
      itemPrefixes: ['line0', 'line0Trendline'],
      dimensionPrefixes: ['line0', 'line0Trendline'],
      isHighlightedByGroupParent: false,
      isHighlightedByGroupTrendline: false,
      hasPopoverInteractivity: false,
      dimensionField: 'datetime0',
      hasSelection: true,
    });
  });

  test('getSeriesHoverPredicate references all four signal namespaces', () => {
    const expr = getSeriesHoverPredicate(ctx);
    expect(expr).toContain('line0_hoveredItem');
    expect(expr).toContain('line0Trendline_hoveredItem');
    expect(expr).toContain('line0_dimensionHoverArea_hoveredItem');
    expect(expr).toContain('line0Trendline_dimensionHoverArea_hoveredItem');
  });

  test('getSeriesHoverPredicate snapshot', () => {
    expect(getSeriesHoverPredicate(ctx)).toMatchInlineSnapshot(
      `"isValid(line0_hoveredItem) && line0_hoveredItem.rscSeriesId === datum.rscSeriesId || isValid(line0Trendline_hoveredItem) && line0Trendline_hoveredItem.rscSeriesId === datum.rscSeriesId || isValid(line0_dimensionHoverArea_hoveredItem) || isValid(line0Trendline_dimensionHoverArea_hoveredItem) || isValid(selectedSeries) && selectedSeries === datum.rscSeriesId || indexof(pluck(data('controlledHighlightedTable'), 'rscSeriesId'), datum.rscSeriesId) > -1 || isValid(controlledHighlightedSeries) && controlledHighlightedSeries === datum.rscSeriesId"`
    );
  });

  test('getItemHoverPredicate references all four signal namespaces', () => {
    const expr = getItemHoverPredicate(ctx, MARK_ID);
    expect(expr).toContain('line0_hoveredItem');
    expect(expr).toContain('line0Trendline_hoveredItem');
    expect(expr).toContain('line0_dimensionHoverArea_hoveredItem');
    expect(expr).toContain('line0Trendline_dimensionHoverArea_hoveredItem');
  });

  test('getItemHoverPredicate snapshot', () => {
    expect(getItemHoverPredicate(ctx, MARK_ID)).toMatchInlineSnapshot(
      `"isArray(controlledHighlightedItem) && indexof(controlledHighlightedItem, datum.rscMarkId) > -1 || isValid(line0_hoveredItem) && line0_hoveredItem.rscMarkId === datum.rscMarkId || isValid(line0Trendline_hoveredItem) && line0Trendline_hoveredItem.rscMarkId === datum.rscMarkId || isValid(line0_dimensionHoverArea_hoveredItem) && +line0_dimensionHoverArea_hoveredItem.datetime0 === +datum.datetime0 || isValid(line0Trendline_dimensionHoverArea_hoveredItem) && +line0Trendline_dimensionHoverArea_hoveredItem.datetime0 === +datum.datetime0"`
    );
  });
});

describe('getHoverContext — cell E (trendline-only tooltip, item mode)', () => {
  let ctx: HoverContext;

  beforeEach(() => {
    ctx = buildCtx('E');
  });

  test('context shape', () => {
    expect(ctx).toStrictEqual({
      itemPrefixes: ['line0Trendline'],
      dimensionPrefixes: [],
      isHighlightedByGroupParent: false,
      isHighlightedByGroupTrendline: false,
      hasPopoverInteractivity: false,
      dimensionField: undefined,
      hasSelection: true,
    });
  });

  test('getSeriesHoverPredicate references only line0Trendline_hoveredItem', () => {
    const expr = getSeriesHoverPredicate(ctx);
    expect(expr).toContain('line0Trendline_hoveredItem');
    expect(expr).not.toContain('line0_hoveredItem');
    expect(expr).not.toContain('dimensionHoverArea');
  });

  test('getSeriesHoverPredicate snapshot', () => {
    expect(getSeriesHoverPredicate(ctx)).toMatchInlineSnapshot(
      `"isValid(line0Trendline_hoveredItem) && line0Trendline_hoveredItem.rscSeriesId === datum.rscSeriesId || isValid(selectedSeries) && selectedSeries === datum.rscSeriesId || indexof(pluck(data('controlledHighlightedTable'), 'rscSeriesId'), datum.rscSeriesId) > -1 || isValid(controlledHighlightedSeries) && controlledHighlightedSeries === datum.rscSeriesId"`
    );
  });

  test('getItemHoverPredicate references only line0Trendline_hoveredItem, no dimension', () => {
    const expr = getItemHoverPredicate(ctx, MARK_ID);
    expect(expr).toContain('line0Trendline_hoveredItem');
    expect(expr).not.toContain('line0_hoveredItem');
    expect(expr).not.toContain('dimensionHoverArea');
  });

  test('getItemHoverPredicate snapshot', () => {
    expect(getItemHoverPredicate(ctx, MARK_ID)).toMatchInlineSnapshot(
      `"isArray(controlledHighlightedItem) && indexof(controlledHighlightedItem, datum.rscMarkId) > -1 || isValid(line0Trendline_hoveredItem) && line0Trendline_hoveredItem.rscMarkId === datum.rscMarkId"`
    );
  });
});

describe('getHoverContext — cell F (trendline-only tooltip, parent declares dimension mode)', () => {
  let ctx: HoverContext;

  beforeEach(() => {
    ctx = buildCtx('F');
  });

  test('context shape', () => {
    expect(ctx).toStrictEqual({
      itemPrefixes: ['line0Trendline'],
      dimensionPrefixes: ['line0Trendline'],
      isHighlightedByGroupParent: false,
      isHighlightedByGroupTrendline: false,
      hasPopoverInteractivity: false,
      dimensionField: 'datetime0',
      hasSelection: true,
    });
  });

  test('getSeriesHoverPredicate references trendline item hover AND trendline dimension hover', () => {
    const expr = getSeriesHoverPredicate(ctx);
    expect(expr).toContain('line0Trendline_hoveredItem');
    expect(expr).toContain('line0Trendline_dimensionHoverArea_hoveredItem');
    expect(expr).not.toContain('line0_hoveredItem');
    expect(expr).not.toContain('line0_dimensionHoverArea_hoveredItem');
  });

  test('getSeriesHoverPredicate snapshot', () => {
    expect(getSeriesHoverPredicate(ctx)).toMatchInlineSnapshot(
      `"isValid(line0Trendline_hoveredItem) && line0Trendline_hoveredItem.rscSeriesId === datum.rscSeriesId || isValid(line0Trendline_dimensionHoverArea_hoveredItem) || isValid(selectedSeries) && selectedSeries === datum.rscSeriesId || indexof(pluck(data('controlledHighlightedTable'), 'rscSeriesId'), datum.rscSeriesId) > -1 || isValid(controlledHighlightedSeries) && controlledHighlightedSeries === datum.rscSeriesId"`
    );
  });

  test('getItemHoverPredicate references trendline item hover AND dimension-field match', () => {
    const expr = getItemHoverPredicate(ctx, MARK_ID);
    expect(expr).toContain('line0Trendline_hoveredItem');
    expect(expr).toContain('line0Trendline_dimensionHoverArea_hoveredItem');
    expect(expr).toContain('datetime0');
    expect(expr).not.toContain('line0_hoveredItem');
  });

  test('getItemHoverPredicate snapshot', () => {
    expect(getItemHoverPredicate(ctx, MARK_ID)).toMatchInlineSnapshot(
      `"isArray(controlledHighlightedItem) && indexof(controlledHighlightedItem, datum.rscMarkId) > -1 || isValid(line0Trendline_hoveredItem) && line0Trendline_hoveredItem.rscMarkId === datum.rscMarkId || isValid(line0Trendline_dimensionHoverArea_hoveredItem) && +line0Trendline_dimensionHoverArea_hoveredItem.datetime0 === +datum.datetime0"`
    );
  });
});

describe('getHoverContext — popover gate', () => {
  test('getItemHoverPredicate prepends selectedItem gate when hasPopoverInteractivity is true', () => {
    const ctx = getHoverContext({
      ...buildOptions('A'),
      chartPopovers: [{}],
      popoverMarkName: 'line0',
    });
    expect(ctx.hasPopoverInteractivity).toBe(true);
    const expr = getItemHoverPredicate(ctx, MARK_ID);
    expect(expr).toMatch(/^selectedItem && selectedItem === datum/);
    expect(expr).toContain('!selectedItem &&');
  });
});

describe('getHoverContext — empty (no interactivity)', () => {
  test('context has empty prefixes and hasSelection false', () => {
    const ctx = getHoverContext({
      ...defaultLineOptions,
      chartTooltips: [],
      trendlines: [],
      interactiveMarkName: undefined,
    });
    expect(ctx.itemPrefixes).toEqual([]);
    expect(ctx.dimensionPrefixes).toEqual([]);
    expect(ctx.hasSelection).toBe(false);
  });

  test('getSeriesHoverPredicate still includes controlled clauses even with no interactive prefixes', () => {
    const ctx = getHoverContext({
      ...defaultLineOptions,
      chartTooltips: [],
      trendlines: [],
      interactiveMarkName: undefined,
    });
    const expr = getSeriesHoverPredicate(ctx);
    expect(expr).not.toContain('hoveredItem');
    expect(expr).toContain('controlledHighlightedTable');
    expect(expr).toContain('controlledHighlightedSeries');
  });
});
