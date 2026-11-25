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
import React, { Children, ComponentProps, ReactElement, ReactNode, isValidElement } from 'react';

import { Content, Heading, Text } from '@react-spectrum/s2';
import { Axis, ChartInspect, ChartPopover, Legend, Title } from '@spectrum-charts/react-spectrum-charts-s2';
import { Histogram } from '@spectrum-charts/react-spectrum-charts-s2/lab';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import { emptyData, histogramResponseData } from '../components/examples/data';
import { withSource } from '../components/examples/elementToJsx';

// Every example aims for a 480 × 300 plot, the dev dashboard's L preset, capped to fit the preview.
const PLOT_WIDTH = 480;
const MAX_PREVIEW_WIDTH = 512;
const PLOT_HEIGHT = 300;
const EDGE = 5;
const VERTICAL_AXIS_WIDTH = 47;
const HORIZONTAL_AXIS_HEIGHT = 29;
const AXIS_TITLE_SIZE = 30;
const SIDE_LEGEND_WIDTH = 120;
const BOTTOM_LEGEND_HEIGHT = 59;
const TITLE_HEIGHT = 34;
const CELL_LEGEND_WIDTH = 64;

const findElement = (node: ReactNode, name: string): ReactElement<Record<string, unknown>> | undefined => {
  for (const child of Children.toArray(node)) {
    if (!isValidElement(child)) continue;
    const element = child as ReactElement<Record<string, unknown>>;
    const type = element.type as { displayName?: string; name?: string };
    if ((type.displayName ?? type.name) === name) return element;
    const match = findElement(element.props.children as ReactNode, name);
    if (match) return match;
  }
  return undefined;
};

const findElements = (node: ReactNode, name: string): ReactElement<Record<string, unknown>>[] =>
  Children.toArray(node).filter(
    (child): child is ReactElement<Record<string, unknown>> =>
      isValidElement(child) && (child.type as { displayName?: string }).displayName === name
  );

/**
 * Sizes a histogram example around a 480 × 300 plot, leaving room for axes, legend, and title.
 * @param element chart element
 * @returns preview width and height
 */
const getHistogramPreviewSize = (element: ReactElement): PreviewSize => {
  const children = (element.props as { children?: ReactNode }).children;
  const histogram = findElement(children, 'Histogram');
  const is2D = Boolean(histogram?.props.yMetric);
  const countPositions = histogram?.props.orientation === 'horizontal' ? ['bottom', 'top'] : ['left', 'right'];
  let width = PLOT_WIDTH + EDGE;
  let height = PLOT_HEIGHT;
  for (const axis of findElements(children, 'Axis')) {
    const position = String(axis.props.position);
    const isVertical = ['left', 'right'].includes(position);
    // 1D histograms add a title to count axes that don't set one.
    const hasTitle = axis.props.title !== undefined || (countPositions.includes(position) && !is2D);
    const titleSize = hasTitle ? AXIS_TITLE_SIZE : 0;
    if (isVertical) width += VERTICAL_AXIS_WIDTH + titleSize;
    else height += HORIZONTAL_AXIS_HEIGHT + titleSize;
  }
  if (is2D && histogram?.props.cellLegend !== false) width += CELL_LEGEND_WIDTH;
  const legend = findElement(children, 'Legend');
  const legendPosition = (legend?.props.position as string | undefined) ?? 'bottom';
  if (legend && ['left', 'right'].includes(legendPosition)) width += SIDE_LEGEND_WIDTH;
  else if (legend) height += BOTTOM_LEGEND_HEIGHT;
  if (findElement(children, 'Title')) height += TITLE_HEIGHT;
  return { width: Math.min(width, MAX_PREVIEW_WIDTH), height };
};

type Layout = 'stacked' | 'overlaid' | 'dodged';
type YValue = 'count' | 'percent' | 'density';
type LegendPosition = 'right' | 'bottom' | 'left' | 'top';
type AnimationType = 'hover' | 'drawIn';
type DrawInEffect = 'grow' | 'sweep' | 'fade';
type CellColors = NonNullable<ComponentProps<typeof Histogram>['cellColors']>;

const LAYOUTS: Layout[] = ['stacked', 'overlaid', 'dodged'];
const CELL_COLORS: CellColors[] = ['Cerulean', 'Forest', 'Magma', 'Rose', 'Viridis'].flatMap((name) =>
  ['5', '9', '16'].map((steps) => `sequential${name}${steps}` as CellColors)
);

/** Converts a "none" or "auto" select value to undefined. */
const optional = (value: unknown) => (!value || value === 'none' || value === 'auto' ? undefined : String(value));

/** Converts a numeric select value to a number, or undefined for "none" and "auto". */
const toNumber = (value: unknown) => {
  const text = optional(value);
  return text === undefined ? undefined : Number(text);
};

/** Converts a comma-separated select value to a list of numbers. */
const toNumbers = (value: unknown) => optional(value)?.split(', ').map(Number);

/** Converts a comma-separated select value to a [min, max] range. */
const toRange = (value: unknown) => toNumbers(value) as [number, number] | undefined;

/** Converts a layout select value to a prop, leaving out the default. */
const toLayout = (value: unknown) => (value && value !== 'stacked' ? (value as Layout) : undefined);

const SLA_EDGES = '0, 100, 250, 500, 1000, 1600';

const inspectContent = withSource(
  (datum: Record<string, unknown>) => (
    <div>
      {String(datum.binStart)}–{String(datum.binEnd)} ms: {String(datum.count)} requests
    </div>
  ),
  '(datum) => (\n  <div>\n    {datum.binStart}–{datum.binEnd} ms: {datum.count} requests\n  </div>\n)'
);

const popoverContent = withSource(
  (datum: Record<string, unknown>) => (
    <>
      <Heading level={4}>
        {String(datum.binStart)}–{String(datum.binEnd)} ms
      </Heading>
      <Content>
        <Text>
          {String(datum.count)} {String(datum.endpoint)} requests ({(Number(datum.percent) * 100).toFixed(0)}%)
        </Text>
      </Content>
    </>
  ),
  '(datum) => (\n  <>\n    <Heading level={4}>{datum.binStart}–{datum.binEnd} ms</Heading>\n    <Content>\n      <Text>\n        {datum.count} {datum.endpoint} requests ({(datum.percent * 100).toFixed(0)}%)\n      </Text>\n    </Content>\n  </>\n)',
  { '@react-spectrum/s2': ['Content', 'Heading', 'Text'] }
);

const weightInspectContent = withSource(
  (datum: Record<string, unknown>) => (
    <div>
      {String(datum.binStart)}–{String(datum.binEnd)} ms: {String(datum.sum)} KB in {String(datum.count)} requests
    </div>
  ),
  '(datum) => (\n  <div>\n    {datum.binStart}–{datum.binEnd} ms: {datum.sum} KB in {datum.count} requests\n  </div>\n)'
);

const cellInspectContent = withSource(
  (datum: Record<string, unknown>) => (
    <div>
      {String(datum.binStart)}–{String(datum.binEnd)} ms, {String(datum.yBinStart)}–{String(datum.yBinEnd)} KB:{' '}
      {String(datum.count)} requests
    </div>
  ),
  "(datum) => (\n  <div>\n    {datum.binStart}–{datum.binEnd} ms, {datum.yBinStart}–{datum.yBinEnd} KB:{' '}\n    {datum.count} requests\n  </div>\n)"
);

const histogramControls: PlaygroundControl[] = [
  { group: 'Histogram', name: 'color', type: 'select', options: ['static', 'endpoint'], defaultValue: 'endpoint' },
  {
    group: 'Histogram',
    name: 'layout',
    type: 'select',
    options: LAYOUTS,
    defaultValue: 'stacked',
    isDisabled: ({ color }) => color !== 'endpoint',
  },
  {
    group: 'Histogram',
    name: 'yValue',
    type: 'select',
    options: ['count', 'percent', 'density'],
    defaultValue: 'count',
  },
  {
    group: 'Legend',
    name: 'legend',
    label: 'Position',
    doc: 'Legend.position',
    type: 'select',
    options: ['none', 'bottom', 'right', 'top', 'left'],
    defaultValue: 'bottom',
    isDisabled: ({ color }) => color !== 'endpoint',
  },
  {
    group: 'Title',
    name: 'title',
    label: 'Text',
    doc: 'Title.text',
    type: 'text',
    defaultValue: 'API response times',
  },
];

/**
 * Playground for the top-level Histogram props and its common siblings.
 * @returns playground element
 */
export const HistogramPlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={histogramControls}
    render={({ color = 'endpoint', layout, yValue, legend, title = 'API response times' }) => {
      const isSeries = color === 'endpoint';
      return (
        <Chart data={histogramResponseData}>
          {optional(title) && <Title text={String(title)} />}
          <Axis position="left" grid />
          <Axis position="bottom" baseline title="Response time (ms)" />
          <Histogram
            metric="responseTime"
            binSize={100}
            color={isSeries ? 'endpoint' : undefined}
            layout={isSeries ? toLayout(layout) : undefined}
            yValue={yValue as YValue | undefined}
          />
          {isSeries && legend !== 'none' && <Legend position={legend as LegendPosition | undefined} />}
        </Chart>
      );
    }}
  />
);

const statesControls: PlaygroundControl[] = [
  { name: 'state', type: 'select', options: ['empty', 'loading'], defaultValue: 'empty' },
  {
    name: 'emptyStateText',
    type: 'text',
    defaultValue: 'No requests in this period',
    isDisabled: ({ state }) => state !== 'empty',
  },
];

/**
 * Playground for empty and loading histograms.
 * @returns playground element
 */
export const HistogramStatesPlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={statesControls}
    component="Chart"
    render={({ state = 'empty', emptyStateText }) => (
      <Chart
        data={state === 'empty' ? emptyData : histogramResponseData}
        loading={state === 'loading' ? true : undefined}
        emptyStateText={state === 'empty' ? String(emptyStateText ?? 'No requests in this period') : undefined}
      >
        <Axis position="left" grid />
        <Axis position="bottom" baseline title="Response time (ms)" />
        <Histogram metric="responseTime" />
      </Chart>
    )}
  />
);

const binControls: PlaygroundControl[] = [
  {
    name: 'binCount',
    type: 'select',
    options: ['auto', '5', '10', '20', '40'],
    defaultValue: 'auto',
    isDisabled: ({ binSize }) => binSize !== 'none',
  },
  { name: 'binSize', type: 'select', options: ['none', '25', '50', '100', '250'], defaultValue: 'none' },
  { name: 'extent', type: 'select', options: ['auto', '0, 1000', '0, 600'], defaultValue: 'auto' },
];

/**
 * Playground for the number, width, and range of evenly sized bins.
 * @returns playground element
 */
export const HistogramBinsPlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={binControls}
    component="Histogram"
    render={({ binCount, binSize, extent }) => {
      const size = toNumber(binSize);
      return (
        <Chart data={histogramResponseData}>
          <Axis position="left" grid />
          <Axis position="bottom" baseline title="Response time (ms)" />
          <Histogram
            metric="responseTime"
            binCount={size ? undefined : toNumber(binCount)}
            binSize={size}
            extent={toRange(extent)}
          />
        </Chart>
      );
    }}
  />
);

const binAnchorControls: PlaygroundControl[] = [
  { name: 'binAnchor', type: 'select', options: ['none', '0', '25', '50'], defaultValue: '50' },
  { name: 'binSize', type: 'select', options: ['50', '100'], defaultValue: '100' },
];

/**
 * Playground for lining bin edges up with a value.
 * @returns playground element
 */
export const HistogramBinAnchorPlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={binAnchorControls}
    component="Histogram"
    render={({ binAnchor = '50', binSize = '100' }) => (
      <Chart data={histogramResponseData}>
        <Axis position="left" grid />
        <Axis position="bottom" baseline title="Response time (ms)" />
        <Histogram metric="responseTime" binSize={Number(binSize)} binAnchor={toNumber(binAnchor)}>
          <ChartInspect>{inspectContent}</ChartInspect>
        </Histogram>
      </Chart>
    )}
  />
);

const binEdgesControls: PlaygroundControl[] = [
  { name: 'binEdges', type: 'select', options: ['none', SLA_EDGES], defaultValue: SLA_EDGES },
  { name: 'yValue', type: 'select', options: ['count', 'percent', 'density'], defaultValue: 'density' },
];

/**
 * Playground for custom, uneven bin edges.
 * @returns playground element
 */
export const HistogramBinEdgesPlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={binEdgesControls}
    component="Histogram"
    render={({ binEdges = SLA_EDGES, yValue = 'density' }) => (
      <Chart data={histogramResponseData}>
        <Axis position="left" grid />
        <Axis position="bottom" baseline title="Response time (ms)" />
        <Histogram
          metric="responseTime"
          binEdges={toNumbers(binEdges)}
          yValue={yValue === 'count' ? undefined : (yValue as YValue)}
        />
      </Chart>
    )}
  />
);

const colorControls: PlaygroundControl[] = [
  { name: 'color', type: 'select', options: ['endpoint', 'static'], defaultValue: 'endpoint' },
  {
    name: 'staticColor',
    label: 'Static color',
    doc: 'Histogram.color',
    type: 'select',
    options: ['categorical-100', 'categorical-200', 'gray-700'],
    defaultValue: 'categorical-100',
    isDisabled: ({ color }) => color !== 'static',
  },
  {
    name: 'layout',
    type: 'select',
    options: LAYOUTS,
    defaultValue: 'overlaid',
    isDisabled: ({ color }) => color !== 'endpoint',
  },
];

/**
 * Playground for splitting a histogram into series and for static colors.
 * @returns playground element
 */
export const HistogramColorPlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={colorControls}
    component="Histogram"
    render={({ color = 'endpoint', staticColor, layout = 'overlaid' }) => {
      const isSeries = color === 'endpoint';
      const fill = staticColor ? { value: String(staticColor) } : undefined;
      return (
        <Chart data={histogramResponseData}>
          <Axis position="left" grid />
          <Axis position="bottom" baseline title="Response time (ms)" />
          <Histogram
            metric="responseTime"
            binSize={50}
            color={isSeries ? 'endpoint' : fill}
            layout={isSeries ? toLayout(layout) : undefined}
          />
          {isSeries && <Legend />}
        </Chart>
      );
    }}
  />
);

const yValueControls: PlaygroundControl[] = [
  { name: 'yValue', type: 'select', options: ['count', 'percent', 'density'], defaultValue: 'percent' },
  { name: 'cumulative', type: 'boolean', defaultValue: false },
  { name: 'layout', type: 'select', options: LAYOUTS, defaultValue: 'overlaid' },
];

/**
 * Playground for bar heights as counts, shares, or densities, optionally cumulative.
 * @returns playground element
 */
export const HistogramYValuePlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={yValueControls}
    component="Histogram"
    render={({ yValue = 'percent', cumulative, layout = 'overlaid' }) => (
      <Chart data={histogramResponseData}>
        <Axis position="left" grid />
        <Axis position="bottom" baseline title="Response time (ms)" />
        <Histogram
          metric="responseTime"
          binSize={100}
          color="endpoint"
          layout={toLayout(layout)}
          yValue={yValue === 'count' ? undefined : (yValue as YValue)}
          cumulative={cumulative as boolean | undefined}
        />
        <Legend />
      </Chart>
    )}
  />
);

const weightControls: PlaygroundControl[] = [
  { name: 'weight', type: 'select', options: ['none', 'payloadSize'], defaultValue: 'payloadSize' },
  { name: 'yValue', type: 'select', options: ['count', 'percent', 'density'], defaultValue: 'count' },
  { name: 'cumulative', type: 'boolean', defaultValue: false },
];

/**
 * Playground for summing a field per bin instead of counting rows.
 * @returns playground element
 */
export const HistogramWeightPlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={weightControls}
    component="Histogram"
    render={({ weight = 'payloadSize', yValue, cumulative }) => {
      const field = optional(weight);
      return (
        <Chart data={histogramResponseData}>
          <Axis position="left" grid />
          <Axis position="bottom" baseline title="Response time (ms)" />
          <Histogram
            metric="responseTime"
            binSize={100}
            weight={field}
            yValue={yValue as YValue | undefined}
            cumulative={cumulative as boolean | undefined}
          >
            <ChartInspect>{field ? weightInspectContent : inspectContent}</ChartInspect>
          </Histogram>
        </Chart>
      );
    }}
  />
);

const orientationControls: PlaygroundControl[] = [
  { name: 'orientation', type: 'select', options: ['vertical', 'horizontal'], defaultValue: 'horizontal' },
  { name: 'color', type: 'select', options: ['static', 'endpoint'], defaultValue: 'static' },
  {
    name: 'layout',
    type: 'select',
    options: LAYOUTS,
    defaultValue: 'stacked',
    isDisabled: ({ color }) => color !== 'endpoint',
  },
  { name: 'yValue', type: 'select', options: ['count', 'percent', 'density'], defaultValue: 'count' },
];

/**
 * Playground for vertical and horizontal histograms.
 * @returns playground element
 */
export const HistogramOrientationPlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={orientationControls}
    component="Histogram"
    render={({ orientation = 'horizontal', color, layout, yValue }) => {
      const isHorizontal = orientation === 'horizontal';
      const isSeries = color === 'endpoint';
      const binTitle = 'Response time (ms)';
      return (
        <Chart data={histogramResponseData}>
          {isHorizontal ? <Axis position="left" baseline title={binTitle} /> : <Axis position="left" grid />}
          {isHorizontal ? <Axis position="bottom" grid /> : <Axis position="bottom" baseline title={binTitle} />}
          <Histogram
            metric="responseTime"
            binSize={100}
            orientation={isHorizontal ? 'horizontal' : undefined}
            color={isSeries ? 'endpoint' : undefined}
            layout={isSeries ? toLayout(layout) : undefined}
            yValue={yValue as YValue | undefined}
          />
          {isSeries && <Legend />}
        </Chart>
      );
    }}
  />
);

const densityCurveControls: PlaygroundControl[] = [
  { name: 'densityCurve', type: 'boolean', defaultValue: true },
  { name: 'color', type: 'select', options: ['static', 'endpoint'], defaultValue: 'endpoint' },
  {
    name: 'layout',
    type: 'select',
    options: LAYOUTS,
    defaultValue: 'overlaid',
    isDisabled: ({ color }) => color !== 'endpoint',
  },
  { name: 'yValue', type: 'select', options: ['count', 'percent', 'density'], defaultValue: 'count' },
  { name: 'cumulative', type: 'boolean', defaultValue: false },
];

/**
 * Playground for the smoothed density curve drawn over the bars.
 * @returns playground element
 */
export const HistogramDensityCurvePlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={densityCurveControls}
    component="Histogram"
    render={({ densityCurve = true, color = 'endpoint', layout = 'overlaid', yValue, cumulative }) => {
      const isSeries = color === 'endpoint';
      return (
        <Chart data={histogramResponseData}>
          <Axis position="left" grid />
          <Axis position="bottom" baseline title="Response time (ms)" />
          <Histogram
            metric="responseTime"
            binSize={100}
            color={isSeries ? 'endpoint' : undefined}
            layout={isSeries ? toLayout(layout) : undefined}
            yValue={yValue as YValue | undefined}
            cumulative={cumulative as boolean | undefined}
            densityCurve={(densityCurve as boolean) || undefined}
          />
          {isSeries && <Legend />}
        </Chart>
      );
    }}
  />
);

const twoDControls: PlaygroundControl[] = [
  { name: 'yMetric', type: 'select', options: ['none', 'payloadSize'], defaultValue: 'payloadSize' },
  { name: 'binCount', type: 'select', options: ['auto', '10', '20'], defaultValue: '20' },
  {
    name: 'yBinCount',
    type: 'select',
    options: ['auto', '10', '20'],
    defaultValue: 'auto',
    isDisabled: ({ yMetric, yBinSize }) => yMetric === 'none' || yBinSize !== 'none',
  },
  {
    name: 'yBinSize',
    type: 'select',
    options: ['none', '10', '20'],
    defaultValue: 'none',
    isDisabled: ({ yMetric }) => yMetric === 'none',
  },
  {
    name: 'yExtent',
    type: 'select',
    options: ['auto', '0, 100'],
    defaultValue: 'auto',
    isDisabled: ({ yMetric }) => yMetric === 'none',
  },
];

/**
 * Playground for 2D histograms that bin two numeric fields into a grid.
 * @returns playground element
 */
export const Histogram2DPlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={twoDControls}
    component="Histogram"
    render={({ yMetric = 'payloadSize', binCount = '20', yBinCount, yBinSize, yExtent }) => {
      const is2D = yMetric !== 'none';
      const ySize = is2D ? toNumber(yBinSize) : undefined;
      return (
        <Chart data={histogramResponseData}>
          <Axis position="left" grid title={is2D ? 'Payload size (KB)' : undefined} />
          <Axis position="bottom" baseline title="Response time (ms)" />
          <Histogram
            metric="responseTime"
            binCount={toNumber(binCount)}
            yMetric={is2D ? String(yMetric) : undefined}
            yBinCount={is2D && !ySize ? toNumber(yBinCount) : undefined}
            yBinSize={ySize}
            yExtent={is2D ? toRange(yExtent) : undefined}
          >
            <ChartInspect>{is2D ? cellInspectContent : inspectContent}</ChartInspect>
          </Histogram>
        </Chart>
      );
    }}
  />
);

const cellControls: PlaygroundControl[] = [
  { name: 'cellColors', type: 'select', options: CELL_COLORS, defaultValue: 'sequentialCerulean9' },
  { name: 'cellLegend', type: 'boolean', defaultValue: true },
  {
    name: 'cellLegendTitle',
    type: 'text',
    defaultValue: '',
    isDisabled: ({ cellLegend }) => cellLegend === false,
  },
];

/**
 * Playground for the colors and color legend of 2D histogram cells.
 * @returns playground element
 */
export const Histogram2DCellsPlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={cellControls}
    component="Histogram"
    render={({ cellColors, cellLegend, cellLegendTitle }) => (
      <Chart data={histogramResponseData}>
        <Axis position="left" grid title="Payload size (KB)" />
        <Axis position="bottom" baseline title="Response time (ms)" />
        <Histogram
          metric="responseTime"
          binCount={20}
          yMetric="payloadSize"
          cellColors={cellColors as CellColors | undefined}
          cellLegend={cellLegend === false ? false : undefined}
          cellLegendTitle={cellLegend === false ? undefined : optional(cellLegendTitle)}
        >
          <ChartInspect>{cellInspectContent}</ChartInspect>
        </Histogram>
      </Chart>
    )}
  />
);

const axisControls: PlaygroundControl[] = [
  { group: 'Histogram', name: 'yValue', type: 'select', options: ['count', 'percent', 'density'], defaultValue: 'count' },
  { group: 'Histogram', name: 'cumulative', type: 'boolean', defaultValue: false },
  { group: 'Histogram', name: 'weight', type: 'select', options: ['none', 'payloadSize'], defaultValue: 'none' },
  { group: 'Axis', name: 'title', type: 'text', defaultValue: '' },
  { group: 'Axis', name: 'labelFormat', type: 'select', options: ['auto', 'linear', 'percentage'], defaultValue: 'auto' },
  {
    group: 'Axis',
    name: 'range',
    label: 'range (bottom)',
    doc: 'Axis.range',
    type: 'select',
    options: ['auto', '0, 1000'],
    defaultValue: 'auto',
  },
];

/**
 * Playground for the automatic count-axis title and label format.
 * @returns playground element
 */
export const HistogramAxisPlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={axisControls}
    render={({ yValue, cumulative, weight, title, labelFormat, range }) => (
      <Chart data={histogramResponseData}>
        <Axis
          position="left"
          grid
          title={optional(title)}
          labelFormat={optional(labelFormat) as 'linear' | 'percentage' | undefined}
        />
        <Axis position="bottom" baseline title="Response time (ms)" range={toRange(range)} />
        <Histogram
          metric="responseTime"
          yValue={yValue as YValue | undefined}
          cumulative={cumulative as boolean | undefined}
          weight={optional(weight)}
        />
      </Chart>
    )}
  />
);

const legendControls: PlaygroundControl[] = [
  { name: 'highlight', type: 'boolean', defaultValue: true },
  { name: 'isToggleable', type: 'boolean', defaultValue: false },
  {
    name: 'position',
    type: 'select',
    options: ['bottom', 'right', 'top', 'left'],
    defaultValue: 'bottom',
  },
];

/**
 * Playground for a legend listing histogram series.
 * @returns playground element
 */
export const HistogramLegendPlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={legendControls}
    component="Legend"
    render={({ highlight = true, isToggleable, position }) => (
      <Chart data={histogramResponseData}>
        <Axis position="left" grid />
        <Axis position="bottom" baseline title="Response time (ms)" />
        <Histogram metric="responseTime" binSize={50} color="endpoint" />
        <Legend
          highlight={(highlight as boolean) || undefined}
          isToggleable={isToggleable as boolean | undefined}
          position={position as LegendPosition | undefined}
        />
      </Chart>
    )}
  />
);

const seriesStateControls: PlaygroundControl[] = [
  { name: 'hiddenSeries', type: 'select', options: ['none', 'Search', 'Checkout'], defaultValue: 'none' },
  {
    name: 'highlightedSeries',
    type: 'select',
    options: ['none', 'Search', 'Checkout'],
    defaultValue: 'Checkout',
  },
];

/**
 * Playground for hiding and highlighting histogram series from outside the chart.
 * @returns playground element
 */
export const HistogramSeriesStatePlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={seriesStateControls}
    component="Chart"
    render={({ hiddenSeries, highlightedSeries = 'Checkout' }) => (
      <Chart
        data={histogramResponseData}
        hiddenSeries={optional(hiddenSeries) ? [String(hiddenSeries)] : undefined}
        highlightedSeries={optional(highlightedSeries)}
      >
        <Axis position="left" grid />
        <Axis position="bottom" baseline title="Response time (ms)" />
        <Histogram metric="responseTime" binSize={50} color="endpoint" />
        <Legend highlight />
      </Chart>
    )}
  />
);

const interactionControls: PlaygroundControl[] = [
  { group: 'ChartInspect', name: 'inspect', label: 'Show', doc: 'ChartInspect', type: 'boolean', defaultValue: true },
  { group: 'ChartPopover', name: 'popover', label: 'Show', doc: 'ChartPopover', type: 'boolean', defaultValue: true },
  {
    group: 'ChartPopover',
    name: 'rightClick',
    type: 'boolean',
    defaultValue: false,
    isDisabled: ({ popover }) => !popover,
  },
];

/**
 * Playground for Histogram hover and click interactions.
 * @returns playground element
 */
export const HistogramInteractionPlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    controls={interactionControls}
    render={({ inspect, popover, rightClick }) => (
      <Chart data={histogramResponseData}>
        <Axis position="left" grid />
        <Axis position="bottom" baseline title="Response time (ms)" />
        <Histogram metric="responseTime" binSize={50} color="endpoint">
          {inspect !== false && <ChartInspect>{inspectContent}</ChartInspect>}
          {popover !== false && (
            <ChartPopover width="auto" rightClick={rightClick as boolean | undefined}>
              {popoverContent}
            </ChartPopover>
          )}
        </Histogram>
        <Legend />
      </Chart>
    )}
  />
);

const animationControls: PlaygroundControl[] = [
  {
    group: 'Chart',
    name: 'drawIn',
    label: "animationTypes 'drawIn'",
    doc: 'Chart.animationTypes',
    type: 'boolean',
    defaultValue: true,
  },
  {
    group: 'Histogram',
    name: 'drawInEffect',
    type: 'select',
    options: ['grow', 'sweep', 'fade'],
    defaultValue: 'grow',
    isDisabled: ({ drawIn }) => drawIn === false,
  },
  {
    group: 'Histogram',
    name: 'yMetric',
    type: 'select',
    options: ['none', 'payloadSize'],
    defaultValue: 'none',
  },
  {
    group: 'Histogram',
    name: 'orientation',
    type: 'select',
    options: ['vertical', 'horizontal'],
    defaultValue: 'vertical',
    isDisabled: ({ yMetric }) => yMetric === 'payloadSize',
  },
];

/**
 * Playground for the Histogram draw-in animation and its effects.
 * @returns playground element
 */
export const HistogramAnimationPlayground = () => (
  <PropPlayground
    previewSize={getHistogramPreviewSize}
    replay
    controls={animationControls}
    render={({ drawIn = true, drawInEffect, yMetric, orientation }) => {
      const animationTypes: AnimationType[] | undefined = drawIn ? undefined : ['hover'];
      const is2D = optional(yMetric) !== undefined;
      const isHorizontal = !is2D && orientation === 'horizontal';
      const binTitle = 'Response time (ms)';
      return (
        <Chart data={histogramResponseData} animationTypes={animationTypes}>
          {isHorizontal ? (
            <Axis position="left" baseline title={binTitle} />
          ) : (
            <Axis position="left" grid title={is2D ? 'Payload size (KB)' : undefined} />
          )}
          {isHorizontal ? <Axis position="bottom" grid /> : <Axis position="bottom" baseline title={binTitle} />}
          <Histogram
            metric="responseTime"
            binSize={50}
            yMetric={optional(yMetric)}
            orientation={isHorizontal ? 'horizontal' : undefined}
            drawInEffect={drawIn ? (drawInEffect as DrawInEffect | undefined) : undefined}
          >
            <ChartInspect>{is2D ? cellInspectContent : inspectContent}</ChartInspect>
          </Histogram>
        </Chart>
      );
    }}
  />
);
