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
 * Hover-namespace matrix tests.
 *
 * Documents the current behavior of every consumer that builds a hover-signal expression,
 * across the matrix of (parent owns interactivity × trendline owns interactivity × interactionMode).
 *
 * Cells (see planning/issues/displayOnHover-hover-namespace-audit.md):
 *
 *   | Cell | parent _hoveredItem | trendline _hoveredItem | interactionMode | interactiveMarkName |
 *   |------|---------------------|------------------------|-----------------|---------------------|
 *   | A    | yes                 | no                     | item            | line0               |
 *   | B    | yes                 | yes                    | item            | line0               |
 *   | C    | yes                 | no                     | dimension       | line0               |
 *   | D    | yes                 | yes                    | dimension       | line0               |
 *   | E    | no                  | yes                    | item            | line0Trendline      |
 *   | F    | no                  | yes                    | dimension*      | line0Trendline      |
 *
 *   * Cell F: parent declares interactionMode='dimension' but is not isInteractive(), so the
 *     trendline owns the dimension-strip signal and x-axis voronoi.
 *
 * All cells have been migrated to the HoverContext resolver. Assertions in each cell
 * describe the correct post-migration behavior.
 */

import { Signal } from 'vega';

import { CONTROLLED_HIGHLIGHTED_TABLE, DIMENSION_HOVER_AREA, HOVERED_ITEM, SELECTED_SERIES } from '@spectrum-charts/constants';

import { getLineHighlightedData } from '../line/lineDataUtils';
import { getMetricRangeData } from '../metricRange/metricRangeUtils';
import { getMetricRangeHoverVisibilityOpacityRules } from './markUtils';
import { getHoverContext } from './hoverContext';
import { defaultLineOptions } from '../trendline/trendlineTestUtils';
import { getTrendlineData, getTrendlineDisplayOnHoverData } from '../trendline/trendlineDataUtils';
import { setTrendlineSignals } from '../trendline/trendlineSignalUtils';
import { LineSpecOptions } from '../types';

type Cell = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

const ITEM_HOVER_LINE = `line0_${HOVERED_ITEM}`;
const ITEM_HOVER_TRENDLINE = `line0Trendline_${HOVERED_ITEM}`;
const DIM_HOVER_LINE = `line0_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM}`;
const DIM_HOVER_TRENDLINE = `line0Trendline_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM}`;

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

/** Returns the filter expr produced by `addData`'s line highlighted-data step for the given cell. */
const lineHighlightExpr = (cell: Cell): string => {
  const data = getLineHighlightedData(buildOptions(cell));
  return (data.transform?.[0] as { expr: string }).expr;
};

/** Returns the filter expr for the trendline `_highlightedData` (drives hover rule + point). */
const trendlineHighlightExpr = (cell: Cell): string => {
  const opts = buildOptions(cell);
  const data = getTrendlineData(opts);
  const trendlineHighlighted = data.find((d) => d.name === 'line0Trendline_highlightedData');
  const transform = trendlineHighlighted?.transform?.[0];
  if (!transform || !('expr' in transform)) return '';
  return transform.expr as string;
};

/** Returns the filter expr for the metricRange displayOnHover data (cell-agnostic; uses parent). */
const metricRangeDisplayOnHoverExpr = (cell: Cell): string => {
  const opts: LineSpecOptions = {
    ...buildOptions(cell),
    metricRanges: [{ metricStart: 'low', metricEnd: 'high', displayOnHover: true }],
  };
  const data = getMetricRangeData(opts);
  const transform = data[0]?.transform?.[0];
  if (!transform || !('expr' in transform)) return '';
  return transform.expr as string;
};

/** Returns the filter expr for displayOnHover trendline data (cell-aware, but only valid when trendline owns). */
const trendlineDisplayOnHoverExpr = (cell: Cell): string => {
  const opts = buildOptions(cell);
  const ctx = getHoverContext(opts);
  const data = getTrendlineDisplayOnHoverData('line0Trendline0', 'linear', ctx);
  return (data.transform?.[0] as { expr: string }).expr;
};

/** Returns the signal names produced by setTrendlineSignals. */
const trendlineSignalNames = (cell: Cell): string[] => {
  const signals: Signal[] = [];
  setTrendlineSignals(signals, buildOptions(cell));
  return signals.map((s) => s.name);
};

describe('hover namespace matrix (PR1: current-behavior snapshots)', () => {
  describe('cell A — parent tooltip, item mode', () => {
    test('lineHighlightedData filter references line0_hoveredItem only', () => {
      const expr = lineHighlightExpr('A');
      expect(expr).toContain(ITEM_HOVER_LINE);
      expect(expr).not.toContain(ITEM_HOVER_TRENDLINE);
      expect(expr).not.toContain(DIM_HOVER_LINE);
    });
    test('trendlineDisplayOnHover filter uses parent prefix when parent owns', () => {
      // When trendline is not interactive, displayOnHover doesn't fire — but if it did,
      // the filter would use the interactiveMarkName (parent).
      const expr = trendlineDisplayOnHoverExpr('A');
      expect(expr).toContain(ITEM_HOVER_LINE);
      expect(expr).not.toContain(ITEM_HOVER_TRENDLINE);
    });
    test('setTrendlineSignals adds no signals (no trendline tooltip)', () => {
      expect(trendlineSignalNames('A')).toEqual([]);
    });
  });

  describe('cell B — parent + trendline tooltip, item mode', () => {
    test('lineHighlightedData filter references line0_hoveredItem', () => {
      const expr = lineHighlightExpr('B');
      expect(expr).toContain(ITEM_HOVER_LINE);
      expect(expr).not.toContain(ITEM_HOVER_TRENDLINE);
    });
    test('trendline highlightedData filter references both line0_hoveredItem and line0Trendline_hoveredItem', () => {
      // FIXED: hovering either the parent line or the trendline now lights the trendline point.
      const expr = trendlineHighlightExpr('B');
      expect(expr).toContain(ITEM_HOVER_TRENDLINE);
      expect(expr).toContain(ITEM_HOVER_LINE);
    });
    test('trendlineDisplayOnHover filter references both parent and trendline hover signals', () => {
      const expr = trendlineDisplayOnHoverExpr('B');
      expect(expr).toContain(ITEM_HOVER_LINE);
      expect(expr).toContain(ITEM_HOVER_TRENDLINE);
    });
    test('setTrendlineSignals adds line0Trendline_hoveredItem', () => {
      expect(trendlineSignalNames('B')).toContain(ITEM_HOVER_TRENDLINE);
    });
  });

  describe('cell C — parent tooltip, dimension mode', () => {
    test('lineHighlightedData filter references both line0_hoveredItem and line0_dimensionHoverArea_hoveredItem', () => {
      const expr = lineHighlightExpr('C');
      expect(expr).toContain(ITEM_HOVER_LINE);
      expect(expr).toContain(DIM_HOVER_LINE);
      expect(expr).not.toContain(DIM_HOVER_TRENDLINE);
    });
    test('trendlineDisplayOnHover filter includes both item and dimension hover signals', () => {
      // FIXED: filter now includes both line0_hoveredItem and line0_dimensionHoverArea_hoveredItem.
      const expr = trendlineDisplayOnHoverExpr('C');
      expect(expr).toContain(ITEM_HOVER_LINE);
      expect(expr).toContain(DIM_HOVER_LINE);
    });
    test('metricRange displayOnHover filter includes dimension hover signal', () => {
      // FIXED: strip hover now triggers the metric range to appear.
      const expr = metricRangeDisplayOnHoverExpr('C');
      expect(expr).toContain(ITEM_HOVER_LINE);
      expect(expr).toContain(DIM_HOVER_LINE);
    });
    test('setTrendlineSignals adds no signals (no trendline tooltip)', () => {
      expect(trendlineSignalNames('C')).toEqual([]);
    });
  });

  describe('cell D — parent + trendline tooltip, dimension mode', () => {
    test('lineHighlightedData references both parent prefixes', () => {
      const expr = lineHighlightExpr('D');
      expect(expr).toContain(ITEM_HOVER_LINE);
      expect(expr).toContain(DIM_HOVER_LINE);
    });
    test('trendline highlightedData filter references all four hover signal namespaces', () => {
      // FIXED: trendline highlight fires for any of the four signals.
      const expr = trendlineHighlightExpr('D');
      expect(expr).toContain(ITEM_HOVER_TRENDLINE);
      expect(expr).toContain(ITEM_HOVER_LINE);
      expect(expr).toContain(DIM_HOVER_LINE);
      expect(expr).toContain(DIM_HOVER_TRENDLINE);
    });
    test('setTrendlineSignals adds line0Trendline_dimensionHoverArea_hoveredItem (via parent xAxisVoronoi)', () => {
      // FIXED: trendline dimension signal is now wired to the parent's xAxisVoronoi.
      const names = trendlineSignalNames('D');
      expect(names).toContain(ITEM_HOVER_TRENDLINE);
      expect(names).toContain(DIM_HOVER_TRENDLINE);
    });
  });

  describe('cell E — trendline-only tooltip, item mode', () => {
    test('lineHighlightedData filter has no hover branch (parent not interactive)', () => {
      const expr = lineHighlightExpr('E');
      expect(expr).not.toContain(ITEM_HOVER_LINE);
      expect(expr).not.toContain(ITEM_HOVER_TRENDLINE);
    });
    test('trendline highlightedData filter references line0Trendline_hoveredItem only', () => {
      const expr = trendlineHighlightExpr('E');
      expect(expr).toContain(ITEM_HOVER_TRENDLINE);
      expect(expr).not.toContain(ITEM_HOVER_LINE);
    });
    test('setTrendlineSignals adds line0Trendline_hoveredItem', () => {
      expect(trendlineSignalNames('E')).toEqual([ITEM_HOVER_TRENDLINE]);
    });
  });

  describe('cell F — trendline-only tooltip, parent declares dimension mode', () => {
    test('lineHighlightedData filter has no hover branch (parent not interactive)', () => {
      const expr = lineHighlightExpr('F');
      expect(expr).not.toContain(ITEM_HOVER_LINE);
      expect(expr).not.toContain(DIM_HOVER_LINE);
    });
    test('trendline highlightedData filter references the trendline dimension signal', () => {
      const expr = trendlineHighlightExpr('F');
      expect(expr).toContain(ITEM_HOVER_TRENDLINE);
      expect(expr).toContain(DIM_HOVER_TRENDLINE);
    });
    test('setTrendlineSignals adds the trendline dimension-strip signal for cell F', () => {
      const names = trendlineSignalNames('F');
      expect(names).toContain(ITEM_HOVER_TRENDLINE);
      expect(names).toContain(DIM_HOVER_TRENDLINE);
    });
  });
});

describe('hover namespace matrix — opacity rules', () => {
  // getMetricRangeHoverVisibilityOpacityRules is now context-driven via HoverContext.
  // show mode: [{ test: combined_predicate, value: 1 }, { value: 0 }]
  // fade mode: per-rule per active prefix.

  test('cell A: show mode combines hovered-series + selection + controlled into single test, no dimension', () => {
    const ctx = getHoverContext(buildOptions('A'));
    const rules = getMetricRangeHoverVisibilityOpacityRules(ctx, 'show') as Array<{ test?: string; value?: number }>;
    const flat = JSON.stringify(rules);
    expect(flat).toContain(ITEM_HOVER_LINE);
    expect(flat).toContain(SELECTED_SERIES);
    expect(flat).toContain(CONTROLLED_HIGHLIGHTED_TABLE);
    expect(flat).not.toContain(DIMENSION_HOVER_AREA);
    // FIXED: single combined test, not 5 separate rules
    expect(rules).toHaveLength(2);
    expect(rules[rules.length - 1]).toEqual({ value: 0 });
  });

  test('cell C: dimension mode combined test includes dimension-strip signal', () => {
    const ctx = getHoverContext(buildOptions('C'));
    const rules = getMetricRangeHoverVisibilityOpacityRules(ctx, 'show') as Array<{ test?: string; value?: number }>;
    expect(JSON.stringify(rules)).toContain(DIM_HOVER_LINE);
    expect(rules).toHaveLength(2);
  });

  test('cell E: trendline-only ownership now references line0Trendline_hoveredItem', () => {
    // FIXED: previously returned [{ value: 0 }] regardless of trendline hover.
    const ctx = getHoverContext(buildOptions('E'));
    const rules = getMetricRangeHoverVisibilityOpacityRules(ctx, 'show') as Array<{ test?: string; value?: number }>;
    expect(JSON.stringify(rules)).toContain(ITEM_HOVER_TRENDLINE);
    expect(rules).toHaveLength(2);
    expect(rules[rules.length - 1]).toEqual({ value: 0 });
  });
});
