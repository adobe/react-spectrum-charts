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
import React, { Children, ReactElement, ReactNode, isValidElement, useState } from 'react';

import {
  Axis,
  AxisProps,
  AxisThumbnail,
  Bar,
  ChartInspect,
  Line,
  ReferenceLine,
  ReferenceLineProps,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import {
  axisBrowserData,
  axisConversionData,
  axisDurationData,
  axisHourData,
  axisMinuteData,
  axisMonthData,
  axisQuarterData,
  axisRevenueData,
  axisVisitsData,
  axisWeekData,
  axisYearData,
} from '../components/examples/data';
import { withSource } from '../components/examples/elementToJsx';

// Charts without a dev dashboard size the plot to 480 x 288, capped at 512px wide overall.
const PLOT_WIDTH = 480;
const MAX_WIDTH = 512;
const PLOT_HEIGHT = 288;
const CHAR_WIDTH = 7;
const LABEL_PADDING = 12;
const ROW_HEIGHT = 22;
const SUB_LABEL_HEIGHT = 16;
const TITLE_SIZE = 28;
const THUMBNAIL_SIZE = 46;
const CHART_TITLE_HEIGHT = 34;
const DEFAULT_LABEL_LIMIT = 180;
// Approximate label widths for metric axes, by number or label format.
const METRIC_LABEL_WIDTHS: Record<string, number> = {
  shortNumber: 36,
  shortCurrency: 44,
  standardNumber: 64,
  currency: 104,
  percentage: 32,
  duration: 52,
  time: 48,
};

type Element = ReactElement<Record<string, unknown>>;
type Datum = Record<string, unknown>;

const findElements = (node: ReactNode, name: string): Element[] =>
  Children.toArray(node).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const element = child as Element;
    const type = element.type as { displayName?: string; name?: string };
    const matches = (type.displayName ?? type.name) === name ? [element] : [];
    return [...matches, ...findElements(element.props.children as ReactNode, name)];
  });

const textWidth = (values: unknown[]) => Math.max(0, ...values.map((value) => String(value).length)) * CHAR_WIDTH;

/**
 * Gets the label size of an axis across its labels: width for left/right axes, height for bottom/top axes.
 * @param axis axis element
 * @param data chart data
 * @param mark Bar or Line element
 * @returns label size in pixels
 */
const getLabelSize = (axis: Element, data: Datum[], mark?: Element): number => {
  const { position, labelFormat, numberFormat, labelOrientation, labelLimit, labels } =
    axis.props as Partial<AxisProps>;
  const isVertical = position === 'left' || position === 'right';
  const isHorizontalBar = mark?.props.orientation === 'horizontal';
  const isCategorical =
    (mark && mark.props.scaleType === 'point') || (mark?.type === Bar && isVertical === isHorizontalBar);
  const isTime = labelFormat === 'time';
  if (!isVertical) {
    const rows = isTime ? 2 * ROW_HEIGHT : ROW_HEIGHT;
    if (labelOrientation !== 'vertical' || !isCategorical) return rows;
    const values = data.map((datum) => datum[String(mark?.props.dimension)]);
    return Math.min(textWidth(values), labelLimit ?? DEFAULT_LABEL_LIMIT) + LABEL_PADDING;
  }
  if (labels?.length) {
    return textWidth(labels.map((label) => (typeof label === 'object' ? label.label ?? label.value : label)));
  }
  if (isCategorical) return textWidth(data.map((datum) => datum[String(mark?.props.dimension)])) + LABEL_PADDING;
  const format = isTime ? 'time' : labelFormat === 'duration' || labelFormat === 'percentage' ? labelFormat : undefined;
  return METRIC_LABEL_WIDTHS[format ?? String(numberFormat ?? 'shortNumber')] ?? METRIC_LABEL_WIDTHS.standardNumber;
};

/**
 * Sizes an axis example so the plot is up to 480 x 288, leaving room for each axis's labels, title, and thumbnails.
 * @param element chart element
 * @returns preview width and height
 */
const getAxisPreviewSize = (element: ReactElement): PreviewSize => {
  const { children, data } = element.props as { children?: ReactNode; data: Datum[] };
  const mark = [...findElements(children, 'Bar'), ...findElements(children, 'Line')][0];
  let width = PLOT_WIDTH;
  let height = PLOT_HEIGHT + (findElements(children, 'Title').length ? CHART_TITLE_HEIGHT : 0);
  for (const axis of findElements(children, 'Axis')) {
    const { position, title, subLabels, hideDefaultLabels } = axis.props as Partial<AxisProps>;
    const thumbnails = findElements(axis.props.children as ReactNode, 'AxisThumbnail').length ? THUMBNAIL_SIZE : 0;
    const titleRows = Array.isArray(title) ? title.length : Number(Boolean(title));
    const labelSize = hideDefaultLabels ? 0 : getLabelSize(axis, data, mark);
    if (position === 'left' || position === 'right') {
      width += labelSize + thumbnails + titleRows * TITLE_SIZE;
    } else {
      height += labelSize + thumbnails + titleRows * TITLE_SIZE + (subLabels?.length ? SUB_LABEL_HEIGHT : 0);
    }
  }
  return { width: Math.min(width, MAX_WIDTH), height };
};

type Position = AxisProps['position'];
type LabelFormat = AxisProps['labelFormat'];
type Granularity = AxisProps['granularity'];
type LabelAlign = AxisProps['labelAlign'];
type FontWeight = AxisProps['labelFontWeight'];
type Orientation = AxisProps['labelOrientation'];
type Locale = 'en-US' | 'de-DE' | 'fr-FR';
type ReferenceLineSize = ReferenceLineProps['size'];

/** Converts a "none" select value to undefined. */
const optional = (value: unknown) => (!value || value === 'none' ? undefined : String(value));

/** Splits a comma-separated select value into a list. */
const toList = (value: unknown) => optional(value)?.split(', ');

/** Converts a number control left at 0 to undefined, for props that are unset by default. */
const optionalNumber = (value: unknown) => (value ? Number(value) : undefined);

const axisControls: PlaygroundControl[] = [
  { group: 'Left axis', name: 'leftTitle', label: 'title', doc: 'Axis.title', type: 'text', defaultValue: 'Visits' },
  { group: 'Left axis', name: 'grid', doc: 'Axis.grid', type: 'boolean', defaultValue: true },
  {
    group: 'Left axis',
    name: 'numberFormat',
    doc: 'Axis.numberFormat',
    type: 'select',
    options: ['shortNumber', 'standardNumber', 'shortCurrency'],
    defaultValue: 'shortNumber',
  },
  { group: 'Bottom axis', name: 'bottomTitle', label: 'title', doc: 'Axis.title', type: 'text', defaultValue: '' },
  { group: 'Bottom axis', name: 'baseline', doc: 'Axis.baseline', type: 'boolean', defaultValue: false },
  { group: 'Bottom axis', name: 'ticks', doc: 'Axis.ticks', type: 'boolean', defaultValue: false },
  {
    group: 'Bottom axis',
    name: 'labelFormat',
    doc: 'Axis.labelFormat',
    type: 'select',
    options: ['time', 'linear'],
    defaultValue: 'time',
  },
];

/**
 * Playground for the most common Axis props on a line chart.
 * @returns playground element
 */
export const AxisPlayground = () => (
  <PropPlayground
    previewSize={getAxisPreviewSize}
    controls={axisControls}
    render={({ leftTitle = 'Visits', grid = true, numberFormat, bottomTitle, baseline, ticks, labelFormat = 'time' }) => (
      <Chart data={axisVisitsData}>
        <Axis
          position="left"
          title={optional(leftTitle)}
          grid={grid as boolean | undefined}
          numberFormat={numberFormat as string | undefined}
        />
        <Axis
          position="bottom"
          title={optional(bottomTitle)}
          baseline={baseline as boolean | undefined}
          ticks={ticks as boolean | undefined}
          labelFormat={labelFormat as LabelFormat}
        />
        <Line metric="visits" />
      </Chart>
    )}
  />
);

const SCALE_EXAMPLES = ['Line, time', 'Line, linear', 'Line, point', 'Bar, vertical', 'Bar, horizontal'];

const scaleControls: PlaygroundControl[] = [
  { name: 'example', label: 'Chart', type: 'select', options: SCALE_EXAMPLES, defaultValue: 'Line, time' },
];

/**
 * Playground for how the axes follow the scale of the mark they measure.
 * @returns playground element
 */
export const AxisScaleTypePlayground = () => (
  <PropPlayground
    previewSize={getAxisPreviewSize}
    controls={scaleControls}
    render={({ example = 'Line, time' }) => {
      switch (example) {
        case 'Line, linear':
          return (
            <Chart data={axisConversionData}>
              <Axis position="left" grid labelFormat="percentage" />
              <Axis position="bottom" baseline title="Week" />
              <Line dimension="week" metric="rate" scaleType="linear" />
            </Chart>
          );
        case 'Line, point':
          return (
            <Chart data={axisBrowserData}>
              <Axis position="left" grid />
              <Axis position="bottom" baseline />
              <Line dimension="browser" metric="downloads" scaleType="point" />
            </Chart>
          );
        case 'Bar, vertical':
          return (
            <Chart data={axisBrowserData}>
              <Axis position="left" grid />
              <Axis position="bottom" baseline />
              <Bar dimension="browser" metric="downloads" />
            </Chart>
          );
        case 'Bar, horizontal':
          return (
            <Chart data={axisBrowserData}>
              <Axis position="left" baseline />
              <Axis position="bottom" grid />
              <Bar dimension="browser" metric="downloads" orientation="horizontal" />
            </Chart>
          );
        default:
          return (
            <Chart data={axisVisitsData}>
              <Axis position="left" grid />
              <Axis position="bottom" baseline labelFormat="time" />
              <Line metric="visits" />
            </Chart>
          );
      }
    }}
  />
);

const positionControls: PlaygroundControl[] = [
  {
    group: 'Value axis',
    name: 'valuePosition',
    label: 'position',
    doc: 'Axis.position',
    type: 'select',
    options: ['left', 'right', 'both'],
    defaultValue: 'left',
  },
  {
    group: 'Value axis',
    name: 'title',
    doc: 'Axis.title',
    type: 'select',
    options: ['none', 'Downloads', 'Downloads, Last 30 days'],
    defaultValue: 'Downloads',
  },
  {
    group: 'Category axis',
    name: 'categoryPosition',
    label: 'position',
    doc: 'Axis.position',
    type: 'select',
    options: ['bottom', 'top'],
    defaultValue: 'bottom',
  },
];

/**
 * Playground for axis positions, multiple axes, and multi-line titles.
 * @returns playground element
 */
export const AxisPositionPlayground = () => (
  <PropPlayground
    previewSize={getAxisPreviewSize}
    controls={positionControls}
    render={({ valuePosition = 'left', title = 'Downloads', categoryPosition = 'bottom' }) => {
      const titleLines = toList(title);
      const axisTitle = titleLines?.length === 1 ? titleLines[0] : titleLines;
      const valuePositions: Position[] = valuePosition === 'both' ? ['left', 'right'] : [valuePosition as Position];
      return (
        <Chart data={axisBrowserData}>
          {valuePositions.map((position) => (
            <Axis key={position} position={position} grid={position === valuePositions[0]} title={axisTitle} />
          ))}
          <Axis position={categoryPosition as Position} baseline />
          <Bar dimension="browser" metric="downloads" />
        </Chart>
      );
    }}
  />
);

const gridControls: PlaygroundControl[] = [
  { group: 'Left axis', name: 'grid', doc: 'Axis.grid', type: 'boolean', defaultValue: true },
  { group: 'Left axis', name: 'leftTicks', label: 'ticks', doc: 'Axis.ticks', type: 'boolean', defaultValue: false },
  { group: 'Bottom axis', name: 'baseline', doc: 'Axis.baseline', type: 'boolean', defaultValue: false },
  {
    group: 'Bottom axis',
    name: 'baselineOffset',
    doc: 'Axis.baselineOffset',
    type: 'number',
    min: 0,
    max: 20000,
    step: 2500,
    defaultValue: 0,
    isDisabled: (values) => !values.baseline,
  },
  {
    group: 'Bottom axis',
    name: 'bottomTicks',
    label: 'ticks',
    doc: 'Axis.ticks',
    type: 'boolean',
    defaultValue: false,
  },
];

/**
 * Playground for gridlines, ticks, and the baseline.
 * @returns playground element
 */
export const AxisGridPlayground = () => (
  <PropPlayground
    previewSize={getAxisPreviewSize}
    controls={gridControls}
    render={({ grid = true, leftTicks, baseline, baselineOffset, bottomTicks }) => (
      <Chart data={axisBrowserData}>
        <Axis position="left" grid={grid as boolean | undefined} ticks={leftTicks as boolean | undefined} />
        <Axis
          position="bottom"
          baseline={baseline as boolean | undefined}
          baselineOffset={baselineOffset as number | undefined}
          ticks={bottomTicks as boolean | undefined}
        />
        <Bar dimension="browser" metric="downloads" />
      </Chart>
    )}
  />
);

const LABEL_FORMAT_EXAMPLES: Record<string, { data: Datum[]; dimension: string; metric: string; title: string }> = {
  linear: { data: axisBrowserData, dimension: 'browser', metric: 'downloads', title: 'Downloads' },
  percentage: { data: axisConversionData, dimension: 'week', metric: 'rate', title: 'Conversion rate' },
  duration: { data: axisDurationData, dimension: 'page', metric: 'seconds', title: 'Time on page' },
};

const labelFormatControls: PlaygroundControl[] = [
  {
    name: 'labelFormat',
    type: 'select',
    options: ['linear', 'percentage', 'duration'],
    defaultValue: 'linear',
  },
];

/**
 * Playground for linear, percentage, and duration label formats on a bar chart's value axis.
 * @returns playground element
 */
export const AxisLabelFormatPlayground = () => (
  <PropPlayground
    previewSize={getAxisPreviewSize}
    controls={labelFormatControls}
    component="Axis"
    render={({ labelFormat }) => {
      const { data, dimension, metric, title } = LABEL_FORMAT_EXAMPLES[String(labelFormat ?? 'linear')];
      return (
        <Chart data={data}>
          <Axis position="left" grid title={title} labelFormat={labelFormat as LabelFormat} />
          <Axis position="bottom" baseline />
          <Bar dimension={dimension} metric={metric} />
        </Chart>
      );
    }}
  />
);

const currencyFormats = ['currency', ',.0f'];

const numberFormatControls: PlaygroundControl[] = [
  {
    group: 'Axis',
    name: 'numberFormat',
    type: 'select',
    options: ['shortNumber', 'standardNumber', 'shortCurrency', 'currency', ',.0f', '.2s', '$,.0f'],
    defaultValue: 'shortNumber',
  },
  {
    group: 'Axis',
    name: 'currencyCode',
    type: 'select',
    options: ['none', 'USD', 'EUR', 'GBP', 'JPY'],
    defaultValue: 'none',
    isDisabled: (values) => !currencyFormats.includes(String(values.numberFormat)),
  },
  {
    group: 'Axis',
    name: 'currencyLocale',
    type: 'select',
    options: ['none', 'en-US', 'de-DE', 'fr-FR', 'ja-JP'],
    defaultValue: 'none',
    isDisabled: (values) => !currencyFormats.includes(String(values.numberFormat)),
  },
  { group: 'Chart', name: 'locale', type: 'select', options: ['en-US', 'de-DE', 'fr-FR'], defaultValue: 'en-US' },
];

/**
 * Playground for number formats, currency, and the chart locale.
 * @returns playground element
 */
export const AxisNumberFormatPlayground = () => (
  <PropPlayground
    previewSize={getAxisPreviewSize}
    controls={numberFormatControls}
    render={({ numberFormat, currencyCode, currencyLocale, locale }) => {
      const isCurrency = currencyFormats.includes(String(numberFormat));
      return (
        <Chart data={axisRevenueData} locale={locale as Locale | undefined}>
          <Axis position="left" baseline />
          <Axis
            position="bottom"
            grid
            title="Revenue"
            numberFormat={numberFormat as string | undefined}
            currencyCode={isCurrency ? optional(currencyCode) : undefined}
            currencyLocale={isCurrency ? optional(currencyLocale) : undefined}
          />
          <Bar dimension="region" metric="revenue" orientation="horizontal" />
        </Chart>
      );
    }}
  />
);

const GRANULARITY_DATA: Record<string, Datum[]> = {
  minute: axisMinuteData,
  hour: axisHourData,
  day: axisVisitsData,
  week: axisWeekData,
  month: axisMonthData,
  quarter: axisQuarterData,
  year: axisYearData,
};

const granularityControls: PlaygroundControl[] = [
  { group: 'Axis', name: 'granularity', type: 'select', options: Object.keys(GRANULARITY_DATA), defaultValue: 'day' },
  { group: 'Chart', name: 'mark', type: 'select', options: ['Line', 'Bar'], defaultValue: 'Line' },
];

/**
 * Playground for time axis labels at each granularity.
 * @returns playground element
 */
export const AxisGranularityPlayground = () => (
  <PropPlayground
    previewSize={getAxisPreviewSize}
    controls={granularityControls}
    render={({ granularity, mark = 'Line' }) => (
      <Chart data={GRANULARITY_DATA[String(granularity ?? 'day')]}>
        <Axis position="left" grid />
        <Axis position="bottom" baseline labelFormat="time" granularity={granularity as Granularity} />
        {mark === 'Bar' ? <Bar dimension="datetime" metric="visits" /> : <Line metric="visits" />}
      </Chart>
    )}
  />
);

const RANGES: Record<string, [number, number] | undefined> = {
  none: undefined,
  '0, 0.05': [0, 0.05],
  '0, 0.1': [0, 0.1],
  '0.02, 0.04': [0.02, 0.04],
};

const rangeControls: PlaygroundControl[] = [
  { name: 'range', type: 'select', options: Object.keys(RANGES), defaultValue: 'none' },
];

/**
 * Playground for fixing the minimum and maximum of a linear axis.
 * @returns playground element
 */
export const AxisRangePlayground = () => (
  <PropPlayground
    previewSize={getAxisPreviewSize}
    controls={rangeControls}
    component="Axis"
    render={({ range }) => (
      <Chart data={axisConversionData}>
        <Axis position="left" grid labelFormat="percentage" range={RANGES[String(range ?? 'none')]} />
        <Axis position="bottom" baseline title="Week" />
        <Line dimension="week" metric="rate" scaleType="linear" />
      </Chart>
    )}
  />
);

const tickControls: PlaygroundControl[] = [
  {
    group: 'Left axis',
    name: 'tickCountMinimum',
    doc: 'Axis.tickCountMinimum',
    type: 'number',
    min: 0,
    max: 12,
    step: 1,
    defaultValue: 0,
  },
  {
    group: 'Left axis',
    name: 'tickCountLimit',
    doc: 'Axis.tickCountLimit',
    type: 'number',
    min: 0,
    max: 12,
    step: 1,
    defaultValue: 0,
  },
  {
    group: 'Bottom axis',
    name: 'tickMinStep',
    doc: 'Axis.tickMinStep',
    type: 'number',
    min: 0,
    max: 5,
    step: 1,
    defaultValue: 0,
  },
];

/**
 * Playground for tick count and step limits on linear axes.
 * @returns playground element
 */
export const AxisTickCountPlayground = () => (
  <PropPlayground
    previewSize={getAxisPreviewSize}
    controls={tickControls}
    render={({ tickCountMinimum, tickCountLimit, tickMinStep }) => (
      <Chart data={axisConversionData}>
        <Axis
          position="left"
          grid
          labelFormat="percentage"
          tickCountMinimum={optionalNumber(tickCountMinimum)}
          tickCountLimit={optionalNumber(tickCountLimit)}
        />
        <Axis position="bottom" baseline ticks title="Week" tickMinStep={optionalNumber(tickMinStep)} />
        <Line dimension="week" metric="rate" scaleType="linear" />
      </Chart>
    )}
  />
);

const labelLayoutControls: PlaygroundControl[] = [
  { name: 'labelOrientation', type: 'select', options: ['horizontal', 'vertical'], defaultValue: 'horizontal' },
  { name: 'labelAlign', type: 'select', options: ['start', 'center', 'end'], defaultValue: 'center' },
  { name: 'labelFontWeight', type: 'select', options: ['normal', 'bold'], defaultValue: 'normal' },
  {
    name: 'truncateLabels',
    type: 'boolean',
    defaultValue: false,
    isDisabled: (values) => values.labelOrientation === 'vertical',
  },
  { name: 'labelLimit', type: 'number', min: 40, max: 180, step: 20, defaultValue: 180 },
];

/**
 * Playground for label orientation, alignment, weight, and truncation on a category axis.
 * @returns playground element
 */
export const AxisLabelLayoutPlayground = () => (
  <PropPlayground
    previewSize={getAxisPreviewSize}
    controls={labelLayoutControls}
    component="Axis"
    render={({ labelOrientation, labelAlign, labelFontWeight, truncateLabels, labelLimit }) => (
      <Chart data={axisRevenueData}>
        <Axis position="left" grid />
        <Axis
          position="bottom"
          baseline
          labelOrientation={labelOrientation as Orientation}
          labelAlign={labelAlign as LabelAlign}
          labelFontWeight={labelFontWeight as FontWeight}
          truncateLabels={labelOrientation === 'vertical' ? undefined : (truncateLabels as boolean | undefined)}
          labelLimit={labelLimit as number | undefined}
        />
        <Bar dimension="region" metric="revenue" />
      </Chart>
    )}
  />
);

const CUSTOM_LABELS: Record<string, AxisProps['labels']> = {
  none: undefined,
  values: [0, 10000, 20000],
  'label objects': [
    { value: 0, label: 'None' },
    { value: 10000, label: '10K' },
    { value: 20000, label: '20K target', fontWeight: 'bold' },
  ],
};

const SUB_LABELS: AxisProps['subLabels'] = [
  { value: 'Chrome', subLabel: 'Blink' },
  { value: 'Edge', subLabel: 'Blink' },
  { value: 'Firefox', subLabel: 'Gecko' },
  { value: 'Safari', subLabel: 'WebKit' },
  { value: 'Explorer', subLabel: 'Trident' },
];

const customLabelControls: PlaygroundControl[] = [
  {
    group: 'Left axis',
    name: 'labels',
    doc: 'Axis.labels',
    type: 'select',
    options: Object.keys(CUSTOM_LABELS),
    defaultValue: 'none',
  },
  {
    group: 'Left axis',
    name: 'hideDefaultLabels',
    doc: 'Axis.hideDefaultLabels',
    type: 'boolean',
    defaultValue: false,
    isDisabled: (values) => values.labels !== 'none',
  },
  {
    group: 'Bottom axis',
    name: 'subLabels',
    label: 'Show subLabels',
    doc: 'Axis.subLabels',
    type: 'boolean',
    defaultValue: true,
  },
];

/**
 * Playground for explicit labels, hidden labels, and sublabels.
 * @returns playground element
 */
export const AxisCustomLabelsPlayground = () => (
  <PropPlayground
    previewSize={getAxisPreviewSize}
    controls={customLabelControls}
    render={({ labels, hideDefaultLabels, subLabels }) => {
      const customLabels = CUSTOM_LABELS[String(labels ?? 'none')];
      return (
        <Chart data={axisBrowserData}>
          <Axis
            position="left"
            grid
            labels={customLabels}
            hideDefaultLabels={customLabels ? undefined : (hideDefaultLabels as boolean | undefined)}
          />
          <Axis position="bottom" baseline subLabels={subLabels === false ? undefined : SUB_LABELS} />
          <Bar dimension="browser" metric="downloads" />
        </Chart>
      );
    }}
  />
);

const tooltipControls: PlaygroundControl[] = [
  { name: 'hasTooltip', type: 'boolean', defaultValue: true },
  {
    name: 'tooltipText',
    type: 'select',
    options: ['none', 'custom'],
    defaultValue: 'custom',
    isDisabled: (values) => !values.hasTooltip,
  },
];

const TOOLTIP_TEXT: AxisProps['tooltipText'] = [
  { value: 'Middle East and Africa', text: 'Middle East and Africa (EMEA South)' },
  { value: 'Europe', text: null },
];

/**
 * Playground for label tooltips on truncated category labels.
 * @returns playground element
 */
export const AxisTooltipPlayground = () => (
  <PropPlayground
    previewSize={getAxisPreviewSize}
    controls={tooltipControls}
    component="Axis"
    render={({ hasTooltip = true, tooltipText = 'custom' }) => (
      <Chart data={axisRevenueData}>
        <Axis position="left" grid />
        <Axis
          position="bottom"
          baseline
          truncateLabels
          hasTooltip={hasTooltip as boolean}
          tooltipText={hasTooltip && tooltipText === 'custom' ? TOOLTIP_TEXT : undefined}
        />
        <Bar dimension="region" metric="revenue" />
      </Chart>
    )}
  />
);

const clickControls: PlaygroundControl[] = [
  { group: 'Axis', name: 'onClick', label: 'Set onClick', doc: 'Axis.onClick', type: 'boolean', defaultValue: true },
  { group: 'ChartInspect', name: 'inspect', label: 'Show', doc: 'ChartInspect', type: 'boolean', defaultValue: true },
];

const inspectContent = withSource(
  (datum: Datum) => (
    <div>
      {String(datum.browser)}: {Number(datum.downloads).toLocaleString()} downloads
    </div>
  ),
  '(datum) => (\n  <div>\n    {datum.browser}: {datum.downloads.toLocaleString()} downloads\n  </div>\n)'
);

/**
 * Playground for clickable axis labels and label hover on an interactive bar chart.
 * @returns playground element
 */
export const AxisClickPlayground = () => {
  const [selected, setSelected] = useState('none');
  const handleClick = withSource(
    (_event: MouseEvent, value: string | number | Date) => setSelected(String(value)),
    '(event, value) => setSelected(value)'
  );
  return (
    <PropPlayground
      previewSize={getAxisPreviewSize}
      controls={clickControls}
      render={({ onClick = true, inspect = true }) => (
        <Chart data={axisBrowserData}>
          <Title text={`Selected: ${selected}`} />
          <Axis position="left" grid />
          <Axis position="bottom" baseline onClick={onClick ? handleClick : undefined} />
          <Bar dimension="browser" metric="downloads">
            {inspect ? <ChartInspect>{inspectContent}</ChartInspect> : undefined}
          </Bar>
        </Chart>
      )}
    />
  );
};

const referenceLineControls: PlaygroundControl[] = [
  { name: 'value', type: 'number', min: 0, max: 3000, step: 100, defaultValue: 2500 },
  { name: 'label', type: 'text', defaultValue: 'Target' },
  { name: 'size', type: 'select', options: ['auto', 'XS', 'S', 'M', 'L'], defaultValue: 'auto' },
  { name: 'secondary', type: 'boolean', defaultValue: false },
];

/**
 * Playground for a reference line on a line chart's value axis.
 * @returns playground element
 */
export const ReferenceLinePlayground = () => (
  <PropPlayground
    previewSize={getAxisPreviewSize}
    controls={referenceLineControls}
    component="ReferenceLine"
    render={({ value = 2500, label = 'Target', size, secondary }) => (
      <Chart data={axisVisitsData}>
        <Axis position="left" grid>
          <ReferenceLine
            value={value as number}
            label={optional(label)}
            size={size as ReferenceLineSize}
            secondary={secondary as boolean | undefined}
          />
        </Axis>
        <Axis position="bottom" baseline labelFormat="time" />
        <Line metric="visits" />
      </Chart>
    )}
  />
);

const thumbnailControls: PlaygroundControl[] = [
  {
    group: 'Bar',
    name: 'orientation',
    doc: 'Bar.orientation',
    type: 'select',
    options: ['vertical', 'horizontal'],
    defaultValue: 'vertical',
  },
  { group: 'Axis', name: 'hideDefaultLabels', doc: 'Axis.hideDefaultLabels', type: 'boolean', defaultValue: false },
];

/**
 * Playground for thumbnail images on a category axis.
 * @returns playground element
 */
export const AxisThumbnailPlayground = () => (
  <PropPlayground
    previewSize={getAxisPreviewSize}
    controls={thumbnailControls}
    render={({ orientation, hideDefaultLabels }) => {
      const isHorizontal = orientation === 'horizontal';
      return (
        <Chart data={axisBrowserData}>
          <Axis position={isHorizontal ? 'bottom' : 'left'} grid />
          <Axis
            position={isHorizontal ? 'left' : 'bottom'}
            baseline
            hideDefaultLabels={hideDefaultLabels as boolean | undefined}
          >
            <AxisThumbnail />
          </Axis>
          <Bar dimension="browser" metric="downloads" orientation={orientation as Orientation} />
        </Chart>
      );
    }}
  />
);
