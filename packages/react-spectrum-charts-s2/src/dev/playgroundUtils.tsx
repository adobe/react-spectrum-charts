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

/* eslint-disable react/display-name */
import { ReactElement, ReactNode } from 'react';

import { DEFAULT_BACKGROUND_COLOR, DEFAULT_COLOR_SCHEME } from '@spectrum-charts/constants';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

export type PlaygroundArgTypes = Record<
  string,
  { control?: unknown; options?: unknown[]; table?: { category: string }; description?: string }
>;

export const chartArgTypes = {
  dataPreset: { control: 'select', table: { category: 'Chart' } },
  chartTitle: { control: 'text', table: { category: 'Chart' } },
  height: { control: { type: 'range', min: 220, max: 720, step: 20 }, table: { category: 'Chart' } },
  maxWidth: { control: { type: 'range', min: 320, max: 1200, step: 20 }, table: { category: 'Chart' } },
  colorScheme: { control: 'select', options: ['light', 'dark'], table: { category: 'Chart' } },
  backgroundColor: { control: 'color', table: { category: 'Chart' } },
} satisfies PlaygroundArgTypes;

// Chart props the playgrounds always pass through; explicit undefined would override Chart's defaults.
export const chartArgs = { colorScheme: DEFAULT_COLOR_SCHEME, backgroundColor: DEFAULT_BACKGROUND_COLOR };

export const axesArgTypes = {
  showBottomAxis: { control: 'boolean', table: { category: 'Axes' } },
  showLeftAxis: { control: 'boolean', table: { category: 'Axes' } },
  showRightAxis: { control: 'boolean', table: { category: 'Axes' } },
  bottomAxisTitle: { control: 'text', table: { category: 'Axes' } },
  leftAxisTitle: { control: 'text', table: { category: 'Axes' } },
  rightAxisTitle: { control: 'text', table: { category: 'Axes' } },
  axisGrid: { control: 'boolean', table: { category: 'Axes' } },
  axisBaseline: { control: 'boolean', table: { category: 'Axes' } },
  axisLabelFormat: {
    control: 'select',
    options: [undefined, 'time', 'linear', 'percentage', 'duration'],
    table: { category: 'Axes' },
  },
  axisLabelLimit: { control: { type: 'range', min: 40, max: 240, step: 5 }, table: { category: 'Axes' } },
  axisTicks: { control: 'boolean', table: { category: 'Axes' } },
  showReferenceLine: { control: 'boolean', table: { category: 'Reference line' } },
  referenceLineLabel: { control: 'text', table: { category: 'Reference line' } },
  showAxisThumbnail: { control: 'boolean', table: { category: 'Axis thumbnail' } },
  axisThumbnailUrlKey: { control: 'text', table: { category: 'Axis thumbnail' } },
} satisfies PlaygroundArgTypes;

export const legendArgTypes = {
  showLegend: { control: 'boolean', table: { category: 'Legend' } },
  legendPosition: { control: 'select', options: ['top', 'bottom', 'left', 'right'], table: { category: 'Legend' } },
  legendTitle: { control: 'text', table: { category: 'Legend' } },
  legendHighlight: { control: 'boolean', table: { category: 'Legend' } },
  legendToggleable: { control: 'boolean', table: { category: 'Legend' } },
  legendLabelLimit: { control: { type: 'range', min: 40, max: 240, step: 5 }, table: { category: 'Legend' } },
  legendShowPopover: { control: 'boolean', table: { category: 'Legend popover' } },
} satisfies PlaygroundArgTypes;

export const inspectArgTypes = {
  showInspect: { control: 'boolean', table: { category: 'Inspect' } },
  inspectHighlightBy: { control: 'select', options: ['item', 'series', 'dimension'], table: { category: 'Inspect' } },
  inspectTargets: { control: 'check', options: ['item', 'dimensionArea'], table: { category: 'Inspect' } },
} satisfies PlaygroundArgTypes;

export const popoverArgTypes = {
  showPopover: { control: 'boolean', table: { category: 'Popover' } },
  popoverWidth: { control: { type: 'range', min: 160, max: 420, step: 10 }, table: { category: 'Popover' } },
  popoverRightClick: { control: 'boolean', table: { category: 'Popover' } },
  popoverHighlightBy: { control: 'select', options: ['item', 'series', 'dimension'], table: { category: 'Popover' } },
} satisfies PlaygroundArgTypes;

export const getDatumValue = (datum: Datum, key: string): unknown => (datum as Record<string, unknown>)[key];

export const formatDatumValue = (value: unknown): string => {
  if (typeof value === 'number' && value > 946_684_800_000) return new Date(value).toLocaleDateString();
  if (typeof value === 'number') return Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  if (value === null || value === undefined) return '—';
  return String(value);
};

export const datumRows = (datum: Datum, keys: string[]): ReactElement[] =>
  keys.map((key) => (
    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <strong>{key}</strong>
      <span>{formatDatumValue(getDatumValue(datum, key))}</span>
    </div>
  ));

export const renderInspectContent =
  (keys: string[]) =>
  (datum: Datum): ReactNode =>
    <div style={{ minWidth: 180 }}>{datumRows(datum, keys)}</div>;

export const renderPopoverContent =
  (keys: string[]) =>
  (datum: Datum, close: () => void): ReactNode =>
    (
      <div style={{ display: 'grid', gap: 8, maxWidth: 280 }}>
        <div style={{ fontWeight: 700 }}>Selected datum</div>
        {datumRows(datum, keys)}
        <button type="button" onClick={close}>
          Close popover
        </button>
      </div>
    );

export const renderActionBarContent =
  (keys: string[]) =>
  (datum: Datum, close: () => void): ReactElement[] =>
    [
      <button key="inspect" type="button" onClick={close}>
        Inspect {formatDatumValue(getDatumValue(datum, keys[0]))}
      </button>,
      <button key="copy" type="button" onClick={close}>
        Copy value
      </button>,
    ];

export const category = (categoryName: string, argNames: string[]): PlaygroundArgTypes =>
  Object.fromEntries(argNames.map((name) => [name, { table: { category: categoryName } }])) as PlaygroundArgTypes;
