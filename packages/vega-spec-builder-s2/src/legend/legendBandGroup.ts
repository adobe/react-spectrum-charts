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
import { ColorValueRef, Data, GroupMark, NumericValueRef, ProductionRule, Signal, StringValueRef } from 'vega';

import {
  COMPONENT_NAME,
  DEFAULT_FONT_SIZE,
  DEFAULT_LEGEND_COLUMN_PADDING,
  DEFAULT_LEGEND_SYMBOL_SIZE,
  DEFAULT_LEGEND_SYMBOL_WIDTH,
  FADE_FACTOR,
  FILTERED_TABLE,
  FOCUSED_REGION,
  FOCUSED_SERIES,
  GROUP_ID,
  HOVERED_SERIES,
  LINE_TYPE_SCALE,
  LINE_WIDTH_SCALE,
  OPACITY_SCALE,
  ROUNDED_SQUARE_PATH,
  SYMBOL_SHAPE_SCALE,
} from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { getPathFromSymbolShape } from '../specUtils';
import { ColorScheme, LegendDescription } from '../types';

/**
 * Approach A′ / subview (see planning/research/custom-legend.md): the accessible-navigation legend is
 * rendered as our own marks in a `legend` group placed in the reserved band below the plot. Owning the
 * marks lets us draw the padded per-entry focus ring the built-in legend can't.
 *
 * To reach LegendOptions parity without re-deriving aggregation, the marks read the built-in legend's
 * own data (created by addLegend before its guide is dropped): `${name}Aggregate` (one row per entry,
 * hiddenEntries filtered), `${name}_maxLabelWidth`, the `${name}Entries` scale, and `${name}_labels`.
 * Interaction (hover fade, click-to-toggle, tooltips) reuses the chart's existing signals/handlers:
 * the hit target is named `${name}_legendEntry` with role `legend-symbol` and a `value` field, so the
 * built-in hover signal and the React click/tooltip handlers pick it up unchanged.
 *
 * Layout matches Vega's legendEntryLayout: entries flow into `legendColumns` columns (row-major), and
 * each column is as wide as its widest entry (per-column max width), so entries pack with a uniform
 * columnPadding gap. The grid is centered within the plot width. See parity plan:
 * planning/research/custom-legend-parity-plan.md.
 *
 * jsdom has no font metrics, so entry widths/positions are only real in a browser.
 */

/** Symbol→label gap — the built-in legend's default labelOffset. */
const SYMBOL_LABEL_GAP = 4;
/** Keyboard-focus ring padding on all sides of a focused entry. */
export const LEGEND_RING_PAD = 20;
/** Keyboard-focus ring stroke width + corner radius. */
const FOCUS_RING_STROKE_WIDTH = 2;
const FOCUS_RING_CORNER_RADIUS = 6;
/** Built-in legend symbol stroke width. */
const SYMBOL_STROKE_WIDTH = 1.5;
/**
 * Vega's legend "size metric" S = max(ceil(sqrt(symbolSize) + symbolStrokeWidth), fontSize) — this
 * (18), NOT the geometric swatch width (sqrt(250)≈15.8), drives symbol x (S/2), label x (S+labelOffset),
 * and the per-cell content box. (vega layout/legend.js sizeExpression + legend-symbol-groups.js.)
 */
const SYMBOL_SIZE_METRIC = Math.max(Math.ceil(Math.sqrt(DEFAULT_LEGEND_SYMBOL_SIZE) + SYMBOL_STROKE_WIDTH), DEFAULT_FONT_SIZE);
/** Cell content height = ceil(S/2 + swatchHalf) = ceil(16.905) = 17 (Vega yExtent). */
const ENTRY_CONTENT_HEIGHT = Math.ceil(SYMBOL_SIZE_METRIC / 2 + Math.sqrt(DEFAULT_LEGEND_SYMBOL_SIZE) / 2);
/** Built-in legend rowPadding. */
const ROW_PADDING = 8;
/** Row pitch = content height (17) + rowPadding (8) = 25. */
export const LEGEND_ROW_HEIGHT = ENTRY_CONTENT_HEIGHT + ROW_PADDING;
/** Built-in legend titlePadding. */
const TITLE_PADDING = 8;
/**
 * Measured height of the 14px bold title (font-metric dependent; Vega uses title.bounds.height()).
 * ~18 for Adobe Clean bold 14; the one value we can't derive exactly without browser metrics.
 */
const TITLE_TEXT_HEIGHT = 18;
/** Vertical space reserved above the entries for the legend title (measured title height + padding). */
export const LEGEND_TITLE_RESERVE = TITLE_TEXT_HEIGHT + TITLE_PADDING;
/** Gap between the chart (bottom axis) and the legend — the built-in legend's config.legend.layout.offset. */
export const LEGEND_OFFSET = 24;
/** Legend group internal padding (theme config.legend.padding). */
const LEGEND_PAD = 8;

/** Where the legend sits relative to the plot. left/right stack entries vertically; top/bottom flow horizontally. */
export type LegendPosition = 'top' | 'bottom' | 'left' | 'right';
export const isVerticalLegend = (position: LegendPosition): boolean => position === 'left' || position === 'right';

/** Label x within a cell = S + labelOffset (also the cell content-width base before the label text). */
const SYMBOL_BLOCK = SYMBOL_SIZE_METRIC + SYMBOL_LABEL_GAP;

/** A legend facet input: a data-field name (scale-driven) or a `{ value }` / literal (static). */
export type LegendFacet = string | number | { value: unknown } | undefined;

/**
 * Resolves a facet to a symbol encode value: a field name → `scale(scaleName, datum.field)` (the
 * aggregate fields ride along on navLayout), a `{value}`/number → literal. Undefined when unset.
 */
const facetRef = <T>(scaleName: string, facet: LegendFacet): { signal: string } | { value: T } | undefined => {
  if (facet === undefined || facet === null) return undefined;
  if (typeof facet === 'string') return { signal: `scale('${scaleName}', datum.${facet})` };
  if (typeof facet === 'number') return { value: facet as T };
  if (typeof facet === 'object' && 'value' in facet) return { value: facet.value as T };
  return undefined;
};

/** The legendLabels display-label lookup (mirrors legendSpecBuilder's labelLookupExpr). */
const displayLabelExpr = (legendName: string): string => {
  const labels = `${legendName}_labels`;
  const idx = `indexof(pluck(${labels}, 'seriesName'), datum.${legendName}Entries)`;
  return `${idx} > -1 ? ${labels}[${idx}].label : datum.${legendName}Entries`;
};

/**
 * Layout data derived from the built-in aggregate. Split so there's no cycle:
 *  - navBase:   one row per entry with display label, own width, grid column, and index/value fields.
 *  - colWidths: per-column max width + a prefix-sum x offset (Vega's per-column-max layout).
 *  - gridMeta:  total grid width for centering.
 *  - navLayout: navBase + the column's x offset (what the marks read).
 */
export const getLegendBandData = (legendName: string, labelLimit: number): Data[] => [
  {
    name: `${legendName}_navBase`,
    source: `${legendName}Aggregate`,
    transform: [
      { type: 'formula', as: 'legendDisplayLabel', expr: displayLabelExpr(legendName) },
      { type: 'formula', as: 'legendLabelWidth', expr: `min(getLabelWidth(datum.legendDisplayLabel, 'normal', ${DEFAULT_FONT_SIZE}), ${labelLimit})` },
      { type: 'formula', as: 'legendEntryWidth', expr: `${SYMBOL_BLOCK} + datum.legendLabelWidth` },
      // `value` = the entry key: the React click/tooltip handlers read `datum.value`.
      { type: 'formula', as: 'value', expr: `datum.${legendName}Entries` },
      // 0-based entry index (also what the built-in `${name}_hoveredSeries` signal reads as datum.index).
      { type: 'window', ops: ['row_number'], as: ['legendRowNumber'] },
      { type: 'formula', as: 'index', expr: 'datum.legendRowNumber - 1' },
      { type: 'formula', as: 'legendColumn', expr: 'datum.index % legendColumns' },
    ],
  },
  {
    name: `${legendName}_colWidths`,
    source: `${legendName}_navBase`,
    transform: [
      { type: 'aggregate', groupby: ['legendColumn'], fields: ['legendEntryWidth'], ops: ['max'], as: ['colMax'] },
      { type: 'formula', as: 'colMaxPad', expr: `datum.colMax + ${DEFAULT_LEGEND_COLUMN_PADDING}` },
      { type: 'window', sort: { field: 'legendColumn' }, ops: ['sum'], fields: ['colMaxPad'], as: ['colRunning'] },
      // exclusive prefix sum = x offset of this column
      { type: 'formula', as: 'colOffset', expr: 'datum.colRunning - datum.colMaxPad' },
    ],
  },
  {
    name: `${legendName}_gridMeta`,
    source: `${legendName}_colWidths`,
    transform: [{ type: 'aggregate', fields: ['colMax', 'colMax'], ops: ['sum', 'count'], as: ['totalCol', 'numCols'] }],
  },
  {
    name: `${legendName}_navLayout`,
    source: `${legendName}_navBase`,
    transform: [
      {
        type: 'lookup',
        from: `${legendName}_colWidths`,
        key: 'legendColumn',
        fields: ['legendColumn'],
        values: ['colOffset'],
        as: ['legendColOffset'],
      },
    ],
  },
];

/**
 * Top-level layout signals. `legendBandHeight` feeds `plotHeight`, so these must resolve before the
 * plot lays out — hence top-level, not group-scoped. `legendCellWidth` (max-label estimate) drives the
 * column COUNT to match the built-in getColumns; actual x positions use the per-column widths above.
 * The `${name}_hoveredSeries` hover signal is created by addLegend (when highlight) — not redefined here.
 */
export const getLegendBandSignals = (
  titleReserve: number,
  legendName: string,
  labelLimit: number,
  align: 'start' | 'middle' | 'end',
  position: LegendPosition,
  title?: string
): Signal[] => {
  const vertical = isVerticalLegend(position);
  const maxLabel = `min((length(data('${legendName}_maxLabelWidth')) > 0 ? data('${legendName}_maxLabelWidth')[0].maxLabelWidth : ${labelLimit}), ${labelLimit})`;
  const entryCount = `length(data('${legendName}_navBase'))`;
  const gridMeta = `data('${legendName}_gridMeta')`;
  const gridWidth = `(length(${gridMeta}) > 0 ? ${gridMeta}[0].totalCol + (${gridMeta}[0].numCols - 1) * ${DEFAULT_LEGEND_COLUMN_PADDING} : 0)`;
  // The legend block Vega centers is union(title, entries), so a title wider than the grid widens the
  // block and shifts the grid's left edge. Measure the bold title the same way Vega does.
  const titleWidth = title ? `getLabelWidth(${JSON.stringify(title)}, 'bold', ${DEFAULT_FONT_SIZE})` : '0';
  // Main-axis alignment (horizontal only): start = left, middle = centered, end = right.
  const offsetByAlign = {
    start: '0',
    middle: 'max(0, (width - legendBlockWidth) / 2)',
    end: 'max(0, width - legendBlockWidth)',
  }[align];
  // Vertical legends are a single column stacked by row; horizontal legends flow into `floor(width/cell)`.
  const columns = vertical ? '1' : 'max(1, floor(width / legendCellWidth))';
  // Vertical block = one entry's content width; horizontal block = the widest of grid vs title.
  const blockWidth = vertical ? `${SYMBOL_BLOCK} + ${maxLabel}` : `max(${gridWidth}, ${titleWidth})`;
  // Vertical: entries left-padded inside the side band. Horizontal: aligned within the plot width.
  const centerOffset = vertical ? `${LEGEND_PAD}` : offsetByAlign;
  return [
    { name: 'legendCellWidth', update: `${maxLabel} + ${DEFAULT_LEGEND_SYMBOL_WIDTH + DEFAULT_LEGEND_COLUMN_PADDING}` },
    { name: 'legendColumns', update: columns },
    { name: 'legendRowCount', update: `max(1, ceil(${entryCount} / legendColumns))` },
    { name: 'legendGridWidth', update: gridWidth },
    { name: 'legendBlockWidth', update: blockWidth },
    { name: 'legendCenterOffset', update: centerOffset },
    { name: 'legendBandHeight', update: `${titleReserve} + legendRowCount * ${LEGEND_ROW_HEIGHT}` },
    // Side-band width for left/right (single column content + padding on both sides).
    { name: 'legendBandWidth', update: `legendBlockWidth + ${2 * LEGEND_PAD}` },
  ];
};

export interface LegendBandOptions {
  colorScheme: ColorScheme;
  /** Legend title text, if any. */
  title?: string;
  /** Vertical space reserved for the title (0 when there's no title). */
  titleReserve: number;
  /** Legend name; drives data source names and the hover signal `${legendName}_hoveredSeries`. */
  legendName: string;
  /** hover-to-highlight (interactive hit target + entry fade), matching the highlight prop. */
  highlight: boolean;
  /** click toggles the series' visibility (uncontrolled). */
  isToggleable: boolean;
  /** controlled hidden series (drives the eye-off styling decision at build time). */
  hiddenSeries: string[];
  /** per-series tooltip descriptions. */
  descriptions?: LegendDescription[];
  /** whether entries should be clickable (toggle / onClick / popover) — adds the pointer + hit target. */
  clickable: boolean;
  /** whether the legend has onMouseOver/onMouseOut handlers — needs the hit target to emit the events. */
  hasMouseInteraction: boolean;
  /** grouped-legend keys; changes the hidden test to the group-membership form. */
  keys?: string[];
  /** max label width before truncation. */
  labelLimit: number;
  /** max title width before truncation. */
  titleLimit?: number;
  /** symbol facet encodings (field name or static value); no-op when unset. */
  opacity?: LegendFacet;
  symbolShape?: LegendFacet;
  lineType?: LegendFacet;
  lineWidth?: LegendFacet;
  /** where the legend sits relative to the plot. */
  position: LegendPosition;
}

/** The legend group, positioned in the band below the plot. Reads the built-in legend data + color scale. */
export const getLegendBandGroup = ({
  colorScheme,
  title,
  titleReserve,
  legendName,
  highlight,
  isToggleable,
  hiddenSeries,
  descriptions,
  clickable,
  hasMouseInteraction,
  keys,
  labelLimit,
  titleLimit,
  opacity,
  symbolShape,
  lineType,
  lineWidth,
  position,
}: LegendBandOptions): GroupMark => {
  // Built-in legend colors: labels gray-700 (getShowHideEncodings always sets this), title gray-800.
  const labelColor = getS2ColorValue('gray-700', colorScheme);
  const titleColor = getS2ColorValue('gray-800', colorScheme);
  const focusColor = getS2ColorValue('blue-800', colorScheme);
  const entryKey = `datum.${legendName}Entries`;
  const hoverSignal = `${legendName}_${HOVERED_SERIES}`;
  const colorRef: ColorValueRef = { signal: `scale('color', ${entryKey})` };

  const entryX = 'legendCenterOffset + datum.legendColOffset';
  const row = 'floor(datum.index / legendColumns)';
  // In-cell vertical center sits at S/2 from the row top (rowPadding is applied below, not split).
  const rowMid = `${titleReserve} + ${row} * ${LEGEND_ROW_HEIGHT} + ${SYMBOL_SIZE_METRIC / 2}`;
  const rowTop = `${titleReserve} + ${row} * ${LEGEND_ROW_HEIGHT}`;

  // Fade non-hovered entries to FADE_FACTOR when highlight is on, matching the built-in getOpacityEncoding.
  const opacityEncode: { opacity?: ProductionRule<NumericValueRef> } = highlight
    ? {
        opacity: [
          { test: `isValid(${hoverSignal})`, signal: `${hoverSignal} === ${entryKey} ? 1 : ${FADE_FACTOR}` },
          { value: 1 },
        ],
      }
    : {};

  // Hidden-entry styling (getSymbolEncodings): toggleable OR controlled-hidden entries swap to the
  // eye-off icon and recolor; the test reads the live `hiddenSeries` signal (or group membership).
  const isHidden = isToggleable || hiddenSeries.length > 0;
  const hiddenTest = keys?.length
    ? `indexof(pluck(data('${FILTERED_TABLE}'), '${legendName}_${GROUP_ID}'), ${entryKey}) === -1`
    : `indexof(hiddenSeries, ${entryKey}) !== -1`;
  const hiddenIconColor = getS2ColorValue(isToggleable ? 'gray-700' : 'gray-500', colorScheme);

  const symbolFillEnc: ProductionRule<ColorValueRef> = isHidden
    ? [{ test: hiddenTest, value: hiddenIconColor }, colorRef]
    : colorRef;
  const symbolStrokeEnc: ProductionRule<ColorValueRef> = isHidden
    ? [{ test: hiddenTest, value: 'transparent' }, colorRef]
    : colorRef;
  // Base (non-hidden) shape = the symbolShape facet if set, else the default rounded square.
  const baseShape: StringValueRef = facetRef<string>(SYMBOL_SHAPE_SCALE, symbolShape) ?? { value: ROUNDED_SQUARE_PATH };
  const symbolShapeEnc: ProductionRule<StringValueRef> = isHidden
    ? [{ test: hiddenTest, value: getPathFromSymbolShape('visibility-off') }, baseShape]
    : baseShape;
  // Optional facet encodings: opacity → fillOpacity, lineType → strokeDash, lineWidth → strokeWidth.
  const fillOpacityRef = facetRef<number>(OPACITY_SCALE, opacity);
  const strokeDashRef = facetRef<number[]>(LINE_TYPE_SCALE, lineType);
  const strokeWidthRef: NumericValueRef = facetRef<number>(LINE_WIDTH_SCALE, lineWidth) ?? { value: SYMBOL_STROKE_WIDTH };
  const symbolFacetEncode = {
    ...(fillOpacityRef ? { fillOpacity: fillOpacityRef } : {}),
    ...(strokeDashRef ? { strokeDash: strokeDashRef } : {}),
  };
  // Controlled-hidden (non-toggleable) greys out the hidden label to gray-500; otherwise gray-700.
  const labelFill: ProductionRule<ColorValueRef> =
    !isToggleable && hiddenSeries.length > 0
      ? [{ test: hiddenTest, value: getS2ColorValue('gray-500', colorScheme) }, { value: labelColor }]
      : { value: labelColor };

  const ringHalfHeight = ENTRY_CONTENT_HEIGHT / 2 + LEGEND_RING_PAD;

  const marks: NonNullable<GroupMark['marks']> = [
    // Whole-legend keyboard-focus ring: shown while the legend region is focused but no entry selected.
    {
      type: 'rect',
      name: 'legendOuterFocusRing',
      interactive: false,
      encode: {
        update: {
          x: { signal: `legendCenterOffset - ${LEGEND_RING_PAD}` },
          x2: { signal: `legendCenterOffset + legendBlockWidth + ${LEGEND_RING_PAD}` },
          y: { value: 0 },
          y2: { signal: 'legendBandHeight' },
          cornerRadius: { value: FOCUS_RING_CORNER_RADIUS },
          strokeWidth: { value: FOCUS_RING_STROKE_WIDTH },
          fill: { value: 'transparent' },
          stroke: [
            { test: `${FOCUSED_REGION} === 'legend' && !isValid(${FOCUSED_SERIES})`, value: focusColor },
            { value: 'transparent' },
          ],
        },
      },
    },
    // Per-entry keyboard-focus ring: padded box around the focused entry (20px on all sides).
    {
      type: 'rect',
      name: 'legendEntryFocusRing',
      from: { data: `${legendName}_navLayout` },
      interactive: false,
      encode: {
        update: {
          x: { signal: `${entryX} - ${LEGEND_RING_PAD}` },
          x2: { signal: `${entryX} + datum.legendEntryWidth + ${LEGEND_RING_PAD}` },
          y: { signal: `${rowMid} - ${ringHalfHeight}` },
          y2: { signal: `${rowMid} + ${ringHalfHeight}` },
          cornerRadius: { value: FOCUS_RING_CORNER_RADIUS },
          strokeWidth: { value: FOCUS_RING_STROKE_WIDTH },
          fill: { value: 'transparent' },
          stroke: [
            { test: `isValid(${FOCUSED_SERIES}) && ${FOCUSED_SERIES} === ${entryKey}`, value: focusColor },
            { value: 'transparent' },
          ],
        },
      },
    },
    {
      type: 'symbol',
      name: 'legendSymbol',
      from: { data: `${legendName}_navLayout` },
      interactive: false,
      encode: {
        update: {
          x: { signal: `${entryX} + ${SYMBOL_SIZE_METRIC / 2}` },
          y: { signal: rowMid },
          size: { value: DEFAULT_LEGEND_SYMBOL_SIZE },
          shape: symbolShapeEnc,
          fill: symbolFillEnc,
          // Built-in symbol strokes with the series color at 1.5px (fattens the swatch edge).
          stroke: symbolStrokeEnc,
          strokeWidth: strokeWidthRef,
          ...symbolFacetEncode,
          ...opacityEncode,
        },
      },
    },
    {
      type: 'text',
      name: 'legendLabel',
      from: { data: `${legendName}_navLayout` },
      interactive: false,
      encode: {
        update: {
          x: { signal: `${entryX} + ${SYMBOL_BLOCK}` },
          y: { signal: rowMid },
          text: { signal: 'datum.legendDisplayLabel' },
          baseline: { value: 'middle' },
          align: { value: 'left' },
          fontSize: { value: DEFAULT_FONT_SIZE },
          fill: labelFill,
          limit: { value: labelLimit },
          ...opacityEncode,
        },
      },
    },
  ];

  if (highlight || clickable || hasMouseInteraction) {
    // Transparent hit target over each entry (symbol + label). Named `${name}_legendEntry` so the
    // built-in hover signal fires, and given role `legend-symbol` + a `value` datum so the React
    // click-to-toggle, tooltip, and mouseover/out handlers treat it as a legend entry.
    const tooltipEncode = descriptions?.length
      ? { tooltip: { signal: `merge(datum, {'${COMPONENT_NAME}': '${legendName}'})` } }
      : {};
    marks.push({
      type: 'rect',
      name: `${legendName}_legendEntry`,
      role: 'legend-symbol',
      from: { data: `${legendName}_navLayout` },
      interactive: true,
      encode: {
        enter: {
          fill: { value: 'transparent' },
          ...(clickable ? { cursor: { value: 'pointer' } } : {}),
        },
        update: {
          x: { signal: entryX },
          y: { signal: rowTop },
          width: { signal: 'datum.legendEntryWidth' },
          height: { value: LEGEND_ROW_HEIGHT },
          ...tooltipEncode,
        },
      },
    });
  }

  if (title) {
    marks.unshift({
      type: 'text',
      name: 'legendTitle',
      interactive: false,
      encode: {
        update: {
          // Left-aligned at the left edge of the centered entry grid, above the entries (matching the
          // built-in bottom legend's title placement — not centered on the plot).
          x: { signal: 'legendCenterOffset' },
          y: { value: 0 },
          text: { value: title },
          align: { value: 'left' },
          baseline: { value: 'top' },
          fontSize: { value: DEFAULT_FONT_SIZE },
          fontWeight: { value: 'bold' },
          fill: { value: titleColor },
          ...(titleLimit ? { limit: { value: titleLimit } } : {}),
        },
      },
    });
  }

  // Position the band: bottom/top reserve height (full width); left/right reserve width (a side band).
  const groupEncode = {
    bottom: { x: { value: 0 }, y: { signal: 'height - legendBandHeight' }, width: { signal: 'width' } },
    top: { x: { value: 0 }, y: { value: 0 }, width: { signal: 'width' } },
    left: { x: { value: 0 }, y: { value: 0 }, width: { signal: 'legendBandWidth' } },
    right: { x: { signal: 'width - legendBandWidth' }, y: { value: 0 }, width: { signal: 'legendBandWidth' } },
  }[position];

  return {
    type: 'group',
    name: 'legend',
    encode: {
      update: {
        ...groupEncode,
        height: { signal: 'legendBandHeight' },
      },
    },
    // Scoped `height` = the band height, for the rings/outer geometry that reference it.
    signals: [{ name: 'height', update: 'legendBandHeight' }],
    marks,
  };
};
