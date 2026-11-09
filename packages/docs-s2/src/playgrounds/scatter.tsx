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
import { Content, Heading, Text } from '@react-spectrum/s2';
import React, { Children, ReactElement, ReactNode, isValidElement } from 'react';

import { Axis, ChartInspect, ChartPopover, Legend, Title } from '@spectrum-charts/react-spectrum-charts-s2';
import {
  Scatter,
  ScatterAnnotation,
  ScatterPath,
  Trendline,
  TrendlineAnnotation,
} from '@spectrum-charts/react-spectrum-charts-s2/lab';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import {
  emptyData,
  scatterCampaignData,
  scatterOutlierData,
  scatterSignupData,
  scatterTrajectoryData,
} from '../components/examples/data';
import { withSource } from '../components/examples/elementToJsx';

// Every example aims for a 480 × 360 plot, capped so the whole chart fits the preview.
const PLOT_WIDTH = 480;
const MAX_PREVIEW_WIDTH = 512;
const PLOT_HEIGHT = 360;
const EDGE = 5;
const VERTICAL_AXIS_WIDTH = 47;
const HORIZONTAL_AXIS_HEIGHT = 29;
const AXIS_TITLE_SIZE = 30;
const SIDE_LEGEND_WIDTH = 120;
const BOTTOM_LEGEND_HEIGHT = 59;
const LEGEND_TITLE_HEIGHT = 22;
const TITLE_HEIGHT = 34;

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
 * Sizes a scatter example around a 480 × 360 plot, leaving room for axes, legend, and title.
 * @param element chart element
 * @returns preview width and height
 */
const getScatterPreviewSize = (element: ReactElement): PreviewSize => {
  const children = (element.props as { children?: ReactNode }).children;
  let width = PLOT_WIDTH + EDGE;
  let height = PLOT_HEIGHT;
  for (const axis of findElements(children, 'Axis')) {
    const titleSize = axis.props.title ? AXIS_TITLE_SIZE : 0;
    if (['left', 'right'].includes(String(axis.props.position))) width += VERTICAL_AXIS_WIDTH + titleSize;
    else height += HORIZONTAL_AXIS_HEIGHT + titleSize;
  }
  const legend = findElement(children, 'Legend');
  const legendPosition = (legend?.props.position as string | undefined) ?? 'bottom';
  if (legend && ['left', 'right'].includes(legendPosition)) {
    width += SIDE_LEGEND_WIDTH;
  } else if (legend) {
    height += BOTTOM_LEGEND_HEIGHT + (legend.props.title ? LEGEND_TITLE_HEIGHT : 0);
  }
  if (findElement(children, 'Title')) height += TITLE_HEIGHT;
  return { width: Math.min(width, MAX_PREVIEW_WIDTH), height };
};

type Locale = 'en-US' | 'de-DE' | 'fr-FR';
type LegendPosition = 'right' | 'bottom' | 'left' | 'top';
type SymbolSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | number;
type LineType = 'solid' | 'dashed' | 'dotted';
type Anchor = 'right' | 'top' | 'bottom' | 'left';
type Blend = 'normal' | 'multiply' | 'screen' | 'darken';
type SequentialScheme = 'sequentialViridis5' | 'sequentialMagma5' | 'sequentialRose5';
type TrendlineMethod = 'linear' | 'average' | 'median' | 'quadratic' | 'exponential' | 'logarithmic' | 'power';

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const channels = ['Search', 'Social', 'Email'];

/** Converts a "none" select value to undefined. */
const optional = (value: unknown) => (!value || value === 'none' ? undefined : String(value));

/** Splits a comma-separated select value into a list. */
const toList = (value: unknown) => optional(value)?.split(', ');

/** Converts a size token or pixel select value to a size. */
const toSize = (value: string): SymbolSize => (SIZES.includes(value) ? (value as SymbolSize) : Number(value));

const inspectContent = withSource(
  (datum: Record<string, unknown>) => (
    <div>
      {String(datum.campaign)}: ${String(datum.revenue)}K revenue on ${String(datum.spend)}K spend
    </div>
  ),
  '(datum) => (\n  <div>\n    {datum.campaign}: ${datum.revenue}K revenue on ${datum.spend}K spend\n  </div>\n)'
);

const popoverContent = withSource(
  (datum: Record<string, unknown>) => (
    <>
      <Heading level={4}>{String(datum.campaign)}</Heading>
      <Content>
        <Text>{String(datum.channel)}, {String(datum.reach)}K reach</Text>
      </Content>
    </>
  ),
  '(datum) => (\n  <>\n    <Heading level={4}>{datum.campaign}</Heading>\n    <Content>\n      <Text>{datum.channel}, {datum.reach}K reach</Text>\n    </Content>\n  </>\n)',
  { '@react-spectrum/s2': ['Content', 'Heading', 'Text'] }
);

const trendlineInspectContent = withSource(
  (datum: Record<string, unknown>) => <div>Trend: ${Number(datum.rscTrendlineValue).toFixed(1)}K</div>,
  '(datum) => <div>Trend: ${datum.rscTrendlineValue.toFixed(1)}K</div>'
);

const scatterControls: PlaygroundControl[] = [
  { group: 'Scatter', name: 'color', type: 'select', options: ['channel', 'static'], defaultValue: 'channel' },
  { group: 'Scatter', name: 'size', type: 'select', options: ['M', 'reach'], defaultValue: 'M' },
  {
    group: 'Trendline',
    name: 'trendline',
    label: 'Method',
    doc: 'Trendline.method',
    type: 'select',
    options: ['none', 'linear', 'average'],
    defaultValue: 'none',
  },
  {
    group: 'Legend',
    name: 'legend',
    label: 'Position',
    doc: 'Legend.position',
    type: 'select',
    options: ['none', 'bottom', 'right', 'top', 'left'],
    defaultValue: 'bottom',
  },
  {
    group: 'Title',
    name: 'title',
    label: 'Text',
    doc: 'Title.text',
    type: 'text',
    defaultValue: 'Campaign revenue by spend',
  },
];

/**
 * Playground for the top-level Scatter props and its common siblings.
 * @returns playground element
 */
export const ScatterPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={scatterControls}
    render={({ color = 'channel', size, trendline, legend, title = 'Campaign revenue by spend' }) => (
      <Chart data={scatterCampaignData}>
        {optional(title) && <Title text={String(title)} />}
        <Axis position="left" grid title="Revenue ($K)" />
        <Axis position="bottom" grid title="Spend ($K)" />
        <Scatter
          dimension="spend"
          metric="revenue"
          color={color === 'channel' ? 'channel' : undefined}
          size={size ? String(size) : undefined}
        >
          {optional(trendline) && <Trendline method={trendline as TrendlineMethod} />}
        </Scatter>
        {legend !== 'none' && (color === 'channel' || size) && (
          <Legend position={legend as LegendPosition | undefined} />
        )}
      </Chart>
    )}
  />
);

const statesControls: PlaygroundControl[] = [
  { name: 'state', type: 'select', options: ['empty', 'loading'], defaultValue: 'empty' },
];

/**
 * Playground for empty and loading scatter plots.
 * @returns playground element
 */
export const ScatterStatesPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={statesControls}
    component="Chart"
    render={({ state = 'empty' }) => (
      <Chart
        data={state === 'loading' ? scatterCampaignData : emptyData}
        loading={state === 'loading' ? true : undefined}
      >
        <Axis position="left" grid />
        <Axis position="bottom" grid />
        <Scatter dimension="spend" metric="revenue" color="channel" />
      </Chart>
    )}
  />
);

const timeControls: PlaygroundControl[] = [
  {
    name: 'dimensionScaleType',
    type: 'select',
    options: ['time', 'linear'],
    defaultValue: 'time',
  },
];

/**
 * Playground for a scatter plot over time.
 * @returns playground element
 */
export const ScatterTimePlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={timeControls}
    component="Scatter"
    render={({ dimensionScaleType = 'time' }) => {
      const isTime = dimensionScaleType === 'time';
      return (
        <Chart data={scatterSignupData}>
          <Axis position="left" grid />
          <Axis
            position="bottom"
            baseline
            labelFormat={isTime ? 'time' : undefined}
            granularity={isTime ? 'day' : undefined}
          />
          <Scatter
            dimension="datetime"
            dimensionScaleType={isTime ? 'time' : 'linear'}
            metric="signups"
            color="platform"
          />
          <Legend />
        </Chart>
      );
    }}
  />
);

const colorControls: PlaygroundControl[] = [
  { group: 'Scatter', name: 'color', type: 'select', options: ['channel', 'roi', 'static'], defaultValue: 'channel' },
  {
    group: 'Scatter',
    name: 'staticColor',
    label: 'Static color',
    doc: 'Scatter.color',
    type: 'select',
    options: ['categorical-100', 'categorical-200', 'gray-700'],
    defaultValue: 'categorical-100',
    isDisabled: ({ color }) => color !== 'static',
  },
  {
    group: 'Chart',
    name: 'colors',
    type: 'select',
    options: ['sequentialViridis5', 'sequentialMagma5', 'sequentialRose5'],
    defaultValue: 'sequentialViridis5',
    isDisabled: ({ color }) => color !== 'roi',
  },
];

/**
 * Playground for coloring points by a category, a number, or a static color.
 * @returns playground element
 */
export const ScatterColorPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={colorControls}
    component="Scatter"
    render={({ color = 'channel', staticColor, colors = 'sequentialViridis5' }) => {
      const isLinear = color === 'roi';
      const isStatic = color === 'static';
      return (
        <Chart data={scatterCampaignData} colors={isLinear ? (String(colors) as SequentialScheme) : undefined}>
          <Axis position="left" grid title="Revenue ($K)" />
          <Axis position="bottom" grid title="Spend ($K)" />
          <Scatter
            dimension="spend"
            metric="revenue"
            color={isStatic ? { value: String(staticColor ?? 'categorical-100') } : String(color)}
            colorScaleType={isLinear ? 'linear' : undefined}
          />
          {!isStatic && <Legend title={isLinear ? 'ROI' : 'Channel'} position={isLinear ? 'right' : undefined} />}
        </Chart>
      );
    }}
  />
);

const sizeControls: PlaygroundControl[] = [
  {
    group: 'Scatter',
    name: 'size',
    type: 'select',
    options: ['M', 'XS', 'S', 'L', 'XL', '24', 'reach'],
    defaultValue: 'M',
  },
  {
    group: 'Chart',
    name: 'minSize',
    label: 'symbolSizes min',
    doc: 'Chart.symbolSizes',
    type: 'select',
    options: ['XS', 'S', 'M'],
    defaultValue: 'XS',
    isDisabled: ({ size }) => size !== 'reach',
  },
  {
    group: 'Chart',
    name: 'maxSize',
    label: 'symbolSizes max',
    doc: 'Chart.symbolSizes',
    type: 'select',
    options: ['L', 'XL', '32'],
    defaultValue: 'XL',
    isDisabled: ({ size }) => size !== 'reach',
  },
];

/**
 * Playground for static and data-driven point sizes.
 * @returns playground element
 */
export const ScatterSizePlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={sizeControls}
    component="Scatter"
    render={({ size, minSize, maxSize }) => {
      const isKey = size === 'reach';
      const symbolSizes: [SymbolSize, SymbolSize] | undefined =
        isKey && (minSize || maxSize) ? [toSize(String(minSize ?? 'XS')), toSize(String(maxSize ?? 'XL'))] : undefined;
      let sizeProp: string | { value: SymbolSize } | undefined;
      if (isKey) sizeProp = 'reach';
      else if (size) sizeProp = { value: toSize(String(size)) };
      return (
        <Chart data={scatterCampaignData} symbolSizes={symbolSizes}>
          <Axis position="left" grid title="Revenue ($K)" />
          <Axis position="bottom" grid title="Spend ($K)" />
          <Scatter dimension="spend" metric="revenue" color="channel" size={sizeProp} />
          <Legend position="right" />
        </Chart>
      );
    }}
  />
);

const opacityControls: PlaygroundControl[] = [
  { group: 'Scatter', name: 'opacity', type: 'select', options: ['1', '0.5', 'audience'], defaultValue: '1' },
  {
    group: 'Chart',
    name: 'opacities',
    type: 'select',
    options: ['default', '1, 0.4', '1, 0.15'],
    defaultValue: 'default',
    isDisabled: ({ opacity }) => opacity !== 'audience',
  },
];

/**
 * Playground for static and data-driven point opacity.
 * @returns playground element
 */
export const ScatterOpacityPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={opacityControls}
    component="Scatter"
    render={({ opacity, opacities }) => {
      const isKey = opacity === 'audience';
      let opacityProp: string | { value: number } | undefined;
      if (isKey) opacityProp = 'audience';
      else if (opacity) opacityProp = { value: Number(opacity) };
      return (
        <Chart data={scatterCampaignData} opacities={isKey ? toList(opacities)?.map(Number) : undefined}>
          <Axis position="left" grid title="Revenue ($K)" />
          <Axis position="bottom" grid title="Spend ($K)" />
          <Scatter dimension="spend" metric="revenue" color="channel" size={{ value: 'L' }} opacity={opacityProp} />
          <Legend />
        </Chart>
      );
    }}
  />
);

const outlineControls: PlaygroundControl[] = [
  {
    group: 'Scatter',
    name: 'lineWidth',
    type: 'select',
    options: ['0', 'XS', 'S', 'M', 'L', 'XL', 'audience'],
    defaultValue: '0',
  },
  {
    group: 'Scatter',
    name: 'lineType',
    type: 'select',
    options: ['solid', 'dashed', 'dotted', 'audience'],
    defaultValue: 'solid',
  },
  { group: 'Scatter', name: 'stroke', type: 'select', options: ['none', 'gray-800', 'audience'], defaultValue: 'none' },
  { group: 'Scatter', name: 'opacity', type: 'number', min: 0, max: 1, step: 0.1, defaultValue: 0.4 },
];

/**
 * Playground for point outlines.
 * @returns playground element
 */
export const ScatterOutlinePlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={outlineControls}
    component="Scatter"
    render={({ lineWidth, lineType, stroke, opacity }) => {
      const width = String(lineWidth ?? '0');
      let lineWidthProp: string | { value: SymbolSize } | undefined;
      if (width === 'audience') lineWidthProp = 'audience';
      else if (lineWidth !== undefined) lineWidthProp = { value: toSize(width) };
      let lineTypeProp: string | { value: LineType } | undefined;
      if (lineType === 'audience') lineTypeProp = 'audience';
      else if (lineType) lineTypeProp = { value: lineType as LineType };
      let strokeProp: string | { value: string } | undefined;
      if (stroke === 'audience') strokeProp = 'audience';
      else if (optional(stroke)) strokeProp = { value: String(stroke) };
      return (
        <Chart data={scatterCampaignData} lineWidths={width === 'audience' ? [1, 3] : undefined}>
          <Axis position="left" grid title="Revenue ($K)" />
          <Axis position="bottom" grid title="Spend ($K)" />
          <Scatter
            dimension="spend"
            metric="revenue"
            color="channel"
            size={{ value: 'XL' }}
            opacity={{ value: (opacity ?? 0.4) as number }}
            lineWidth={lineWidthProp}
            lineType={lineTypeProp}
            stroke={strokeProp}
          />
          <Legend />
        </Chart>
      );
    }}
  />
);

const blendControls: PlaygroundControl[] = [
  {
    name: 'blend',
    type: 'select',
    options: ['default', 'normal', 'multiply', 'screen', 'darken'],
    defaultValue: 'default',
  },
];

/**
 * Playground for how overlapping points blend.
 * @returns playground element
 */
export const ScatterBlendPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={blendControls}
    component="Scatter"
    render={({ blend }) => (
      <Chart data={scatterCampaignData} symbolSizes={['S', 48]}>
        <Axis position="left" grid title="Revenue ($K)" />
        <Axis position="bottom" grid title="Spend ($K)" />
        <Scatter
          dimension="spend"
          metric="revenue"
          color="channel"
          size="reach"
          blend={optional(blend === 'default' ? undefined : blend) as Blend | undefined}
        />
        <Legend position="right" />
      </Chart>
    )}
  />
);

const clipControls: PlaygroundControl[] = [{ name: 'clip', type: 'boolean', defaultValue: false }];

/**
 * Playground for clipping points to a fixed axis range.
 * @returns playground element
 */
export const ScatterClipPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={clipControls}
    component="Scatter"
    render={({ clip }) => (
      <Chart data={scatterCampaignData}>
        <Axis position="left" grid title="Revenue ($K)" range={[0, 100]} />
        <Axis position="bottom" grid title="Spend ($K)" />
        <Scatter
          dimension="spend"
          metric="revenue"
          color="channel"
          size={{ value: 'XL' }}
          clip={clip as boolean | undefined}
        />
      </Chart>
    )}
  />
);

const pathControls: PlaygroundControl[] = [
  { group: 'ScatterPath', name: 'color', type: 'select', options: ['gray-500', 'gray-800'], defaultValue: 'gray-500' },
  { group: 'ScatterPath', name: 'pathWidth', type: 'select', options: ['M', 'S', 'XL', 'share'], defaultValue: 'M' },
  { group: 'ScatterPath', name: 'opacity', type: 'number', min: 0, max: 1, step: 0.1, defaultValue: 0.5 },
  {
    group: 'ScatterAnnotation',
    name: 'labels',
    label: 'Show',
    doc: 'ScatterAnnotation',
    type: 'boolean',
    defaultValue: true,
  },
];

/**
 * Playground for ScatterPath connecting each product's months in order.
 * @returns playground element
 */
export const ScatterPathPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={pathControls}
    component="ScatterPath"
    render={({ color, pathWidth, opacity, labels }) => {
      let pathWidthProp: string | { value: SymbolSize } | undefined;
      if (pathWidth === 'share') pathWidthProp = 'share';
      else if (pathWidth) pathWidthProp = { value: pathWidth as SymbolSize };
      return (
        <Chart data={scatterTrajectoryData}>
          <Axis position="left" grid title="Growth (%)" />
          <Axis position="bottom" grid title="Market share (%)" />
          <Scatter dimension="share" metric="growth" color="product">
            <ScatterPath color={optional(color)} pathWidth={pathWidthProp} opacity={opacity as number | undefined} />
            {labels !== false && <ScatterAnnotation textKey="month" />}
          </Scatter>
          <Legend />
        </Chart>
      );
    }}
  />
);

const annotationControls: PlaygroundControl[] = [
  {
    name: 'textKey',
    type: 'select',
    options: ['revenue', 'campaign', 'channel'],
    defaultValue: 'revenue',
  },
  {
    name: 'anchor',
    type: 'select',
    options: ['right, top, bottom, left', 'right', 'top', 'left, bottom'],
    defaultValue: 'right, top, bottom, left',
  },
];

/**
 * Playground for ScatterAnnotation point labels.
 * @returns playground element
 */
export const ScatterAnnotationPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={annotationControls}
    component="ScatterAnnotation"
    render={({ textKey, anchor }) => {
      const anchors = toList(anchor) as Anchor[] | undefined;
      return (
        <Chart data={scatterCampaignData}>
          <Axis position="left" grid title="Revenue ($K)" />
          <Axis position="bottom" grid title="Spend ($K)" />
          <Scatter dimension="spend" metric="revenue" color="channel">
            <ScatterAnnotation
              textKey={optional(textKey)}
              anchor={anchors && anchors.length === 1 ? anchors[0] : anchors}
            />
          </Scatter>
          <Legend />
        </Chart>
      );
    }}
  />
);

const trendlineControls: PlaygroundControl[] = [
  {
    group: 'Trendline',
    name: 'method',
    type: 'select',
    options: ['linear', 'average', 'median', 'quadratic', 'exponential', 'logarithmic', 'power'],
    defaultValue: 'linear',
  },
  { group: 'Trendline', name: 'lineType', type: 'select', options: ['dashed', 'solid', 'dotted'], defaultValue: 'dashed' },
  { group: 'Trendline', name: 'lineWidth', type: 'select', options: ['M', 'XS', 'S', 'L', 'XL'], defaultValue: 'M' },
  { group: 'Trendline', name: 'opacity', type: 'number', min: 0, max: 1, step: 0.1, defaultValue: 1 },
  { group: 'Trendline', name: 'color', type: 'select', options: ['series', 'gray-700'], defaultValue: 'series' },
  {
    group: 'Trendline',
    name: 'orientation',
    type: 'select',
    options: ['horizontal', 'vertical'],
    defaultValue: 'horizontal',
  },
  {
    group: 'Trendline',
    name: 'dimensionRange',
    type: 'select',
    options: ['none', '10, 30'],
    defaultValue: 'none',
  },
  {
    group: 'Trendline',
    name: 'dimensionExtent',
    type: 'select',
    options: ['dimensionRange', 'domain, domain', '0, 50'],
    defaultValue: 'dimensionRange',
  },
  {
    group: 'Scatter',
    name: 'scatterColor',
    label: 'color',
    doc: 'Scatter.color',
    type: 'select',
    options: ['channel', 'static'],
    defaultValue: 'channel',
  },
];

/** Converts a "start, end" select value to a trendline extent. */
const toExtent = (value: unknown): [number | 'domain' | null, number | 'domain' | null] | undefined => {
  const list = toList(value === 'dimensionRange' ? undefined : value);
  if (!list) return undefined;
  return list.map((item) => (item === 'domain' ? 'domain' : Number(item))) as [number | 'domain', number | 'domain'];
};

/**
 * Playground for Trendline methods and styles.
 * @returns playground element
 */
export const TrendlinePlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={trendlineControls}
    component="Trendline"
    render={({
      method,
      lineType,
      lineWidth,
      opacity,
      color,
      orientation,
      dimensionRange,
      dimensionExtent,
      scatterColor = 'channel',
    }) => {
      const range = toList(dimensionRange)?.map(Number) as [number, number] | undefined;
      return (
        <Chart data={scatterCampaignData}>
          <Axis position="left" grid title="Revenue ($K)" />
          <Axis position="bottom" grid title="Spend ($K)" />
          <Scatter dimension="spend" metric="revenue" color={scatterColor === 'channel' ? 'channel' : undefined}>
            <Trendline
              method={method as TrendlineMethod | undefined}
              lineType={lineType as LineType | undefined}
              lineWidth={lineWidth as SymbolSize | undefined}
              opacity={opacity as number | undefined}
              color={color === 'series' ? undefined : optional(color)}
              orientation={orientation as 'vertical' | undefined}
              dimensionRange={range}
              dimensionExtent={toExtent(dimensionExtent)}
            />
          </Scatter>
          {scatterColor === 'channel' && <Legend />}
        </Chart>
      );
    }}
  />
);

const movingAverageControls: PlaygroundControl[] = [
  {
    name: 'method',
    type: 'select',
    options: ['movingAverage-3', 'movingAverage-5', 'linear'],
    defaultValue: 'movingAverage-3',
  },
  {
    name: 'hidePartialWindows',
    type: 'boolean',
    defaultValue: false,
    isDisabled: ({ method }) => !String(method).startsWith('movingAverage'),
  },
];

/**
 * Playground for moving-average trendlines over time.
 * @returns playground element
 */
export const TrendlineMovingAveragePlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={movingAverageControls}
    component="Trendline"
    render={({ method = 'movingAverage-3', hidePartialWindows }) => (
      <Chart data={scatterSignupData}>
        <Axis position="left" grid />
        <Axis position="bottom" baseline labelFormat="time" granularity="day" />
        <Scatter dimension="datetime" dimensionScaleType="time" metric="signups" color="platform">
          <Trendline
            method={method as `movingAverage-${number}`}
            hidePartialWindows={hidePartialWindows as boolean | undefined}
          />
        </Scatter>
        <Legend />
      </Chart>
    )}
  />
);

const excludeControls: PlaygroundControl[] = [
  {
    name: 'exclude',
    label: "excludeDataKeys ['isBotTraffic']",
    doc: 'Trendline.excludeDataKeys',
    type: 'boolean',
    defaultValue: true,
  },
];

/**
 * Playground for leaving flagged rows out of a trendline.
 * @returns playground element
 */
export const TrendlineExcludePlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={excludeControls}
    component="Trendline"
    render={({ exclude = true }) => (
      <Chart data={scatterOutlierData}>
        <Axis position="left" grid title="Visits" />
        <Axis position="bottom" grid title="Day" />
        <Scatter dimension="day" metric="visits">
          <Trendline color="gray-700" excludeDataKeys={exclude ? ['isBotTraffic'] : undefined} />
        </Scatter>
      </Chart>
    )}
  />
);

const trendlineInteractionControls: PlaygroundControl[] = [
  {
    group: 'Trendline',
    name: 'inspect',
    label: 'ChartInspect',
    doc: 'ChartInspect',
    type: 'boolean',
    defaultValue: true,
  },
  {
    group: 'Trendline',
    name: 'highlightRawPoint',
    type: 'boolean',
    defaultValue: false,
    isDisabled: ({ inspect }) => !inspect,
  },
  { group: 'Trendline', name: 'displayOnHover', type: 'boolean', defaultValue: false },
];

/**
 * Playground for hovering trendlines and points.
 * @returns playground element
 */
export const TrendlineInteractionPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={trendlineInteractionControls}
    component="Trendline"
    render={({ inspect, highlightRawPoint, displayOnHover }) => (
      <Chart data={scatterCampaignData}>
        <Axis position="left" grid title="Revenue ($K)" />
        <Axis position="bottom" grid title="Spend ($K)" />
        <Scatter dimension="spend" metric="revenue" color="channel">
          <ChartInspect>{inspectContent}</ChartInspect>
          <Trendline
            highlightRawPoint={inspect !== false ? (highlightRawPoint as boolean | undefined) : undefined}
            displayOnHover={displayOnHover as boolean | undefined}
          >
            {inspect !== false && <ChartInspect>{trendlineInspectContent}</ChartInspect>}
          </Trendline>
        </Scatter>
        <Legend highlight />
      </Chart>
    )}
  />
);

const trendlineAnnotationControls: PlaygroundControl[] = [
  {
    group: 'Trendline',
    name: 'method',
    doc: 'Trendline.method',
    type: 'select',
    options: ['average', 'median'],
    defaultValue: 'average',
  },
  { group: 'TrendlineAnnotation', name: 'badge', type: 'boolean', defaultValue: false },
  {
    group: 'TrendlineAnnotation',
    name: 'dimensionValue',
    type: 'select',
    options: ['end', 'start', '20'],
    defaultValue: 'end',
  },
  {
    group: 'TrendlineAnnotation',
    name: 'numberFormat',
    type: 'select',
    options: [',.1f', '$,.0f', 'none'],
    defaultValue: ',.1f',
  },
  { group: 'TrendlineAnnotation', name: 'prefix', type: 'text', defaultValue: '' },
  { group: 'Chart', name: 'locale', type: 'select', options: ['en-US', 'de-DE', 'fr-FR'], defaultValue: 'en-US' },
];

/**
 * Playground for TrendlineAnnotation value labels.
 * @returns playground element
 */
export const TrendlineAnnotationPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={trendlineAnnotationControls}
    component="TrendlineAnnotation"
    render={({ method = 'average', badge, dimensionValue, numberFormat = ',.1f', prefix, locale }) => {
      let dimensionValueProp: 'start' | 'end' | number | undefined;
      if (dimensionValue === 'start') dimensionValueProp = 'start';
      else if (dimensionValue) dimensionValueProp = Number(dimensionValue);
      return (
        <Chart data={scatterCampaignData} locale={locale as Locale | undefined}>
          <Axis position="left" grid title="Revenue ($K)" />
          <Axis position="bottom" grid title="Spend ($K)" />
          <Scatter dimension="spend" metric="revenue">
            <Trendline method={method as 'average' | 'median'} dimensionExtent={['domain', 'domain']}>
              <TrendlineAnnotation
                badge={badge as boolean | undefined}
                dimensionValue={dimensionValueProp}
                numberFormat={optional(numberFormat)}
                prefix={optional(prefix)}
              />
            </Trendline>
          </Scatter>
        </Chart>
      );
    }}
  />
);

const legendControls: PlaygroundControl[] = [
  {
    name: 'position',
    type: 'select',
    options: ['bottom', 'right', 'top', 'left'],
    defaultValue: 'bottom',
  },
  { name: 'title', type: 'text', defaultValue: 'Channel' },
  { name: 'highlight', type: 'boolean', defaultValue: true },
  { name: 'isToggleable', type: 'boolean', defaultValue: false },
  {
    name: 'legendLabels',
    type: 'select',
    options: ['none', 'Paid search, Paid social, Email'],
    defaultValue: 'none',
  },
];

/**
 * Playground for Legend props with a scatter plot.
 * @returns playground element
 */
export const ScatterLegendPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={legendControls}
    component="Legend"
    render={({ position, title = 'Channel', highlight = true, isToggleable, legendLabels }) => {
      const labels = toList(legendLabels)?.map((label, index) => ({ seriesName: channels[index], label }));
      return (
        <Chart data={scatterCampaignData}>
          <Axis position="left" grid title="Revenue ($K)" />
          <Axis position="bottom" grid title="Spend ($K)" />
          <Scatter dimension="spend" metric="revenue" color="channel">
            <Trendline method="average" />
          </Scatter>
          <Legend
            position={position as LegendPosition | undefined}
            title={optional(title)}
            highlight={highlight as boolean}
            isToggleable={isToggleable as boolean | undefined}
            legendLabels={labels}
          />
        </Chart>
      );
    }}
  />
);

const continuousLegendControls: PlaygroundControl[] = [
  { name: 'facet', label: 'Scatter facet', type: 'select', options: ['size', 'color', 'opacity'], defaultValue: 'size' },
];

/**
 * Playground for size, gradient, and opacity legends.
 * @returns playground element
 */
export const ScatterContinuousLegendPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={continuousLegendControls}
    component="Legend"
    render={({ facet = 'size' }) => (
      <Chart data={scatterCampaignData} colors={facet === 'color' ? 'sequentialViridis5' : undefined}>
        <Axis position="left" grid title="Revenue ($K)" />
        <Axis position="bottom" grid title="Spend ($K)" />
        <Scatter
          dimension="spend"
          metric="revenue"
          size={facet === 'size' ? 'reach' : { value: 'L' }}
          color={facet === 'color' ? 'roi' : undefined}
          colorScaleType={facet === 'color' ? 'linear' : undefined}
          opacity={facet === 'opacity' ? 'audience' : undefined}
        />
        <Legend
          position="right"
          title={{ size: 'Reach (K)', color: 'ROI', opacity: 'Audience' }[String(facet)]}
          opacity={facet === 'opacity' ? 'audience' : undefined}
        />
      </Chart>
    )}
  />
);

const hiddenSeriesControls: PlaygroundControl[] = [
  { name: 'hiddenSeries', type: 'select', options: ['none', 'Social', 'Social, Email'], defaultValue: 'Social' },
];

/**
 * Playground for hiding series from outside the chart.
 * @returns playground element
 */
export const ScatterHiddenSeriesPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={hiddenSeriesControls}
    component="Chart"
    render={({ hiddenSeries = 'Social' }) => (
      <Chart data={scatterCampaignData} hiddenSeries={toList(hiddenSeries)}>
        <Axis position="left" grid title="Revenue ($K)" />
        <Axis position="bottom" grid title="Spend ($K)" />
        <Scatter dimension="spend" metric="revenue" color="channel">
          <Trendline />
        </Scatter>
        <Legend />
      </Chart>
    )}
  />
);

const interactionControls: PlaygroundControl[] = [
  { group: 'ChartInspect', name: 'inspect', label: 'Show', doc: 'ChartInspect', type: 'boolean', defaultValue: true },
  {
    group: 'ChartInspect',
    name: 'highlightBy',
    type: 'select',
    options: ['item', 'series', 'dimension', 'audience'],
    defaultValue: 'item',
    isDisabled: ({ inspect }) => !inspect,
  },
  { group: 'ChartPopover', name: 'popover', label: 'Show', doc: 'ChartPopover', type: 'boolean', defaultValue: true },
  {
    group: 'ChartPopover',
    name: 'rightClick',
    type: 'boolean',
    defaultValue: false,
    isDisabled: ({ popover }) => !popover,
  },
  {
    group: 'Chart',
    name: 'tooltipAnchor',
    type: 'select',
    options: ['cursor', 'mark'],
    defaultValue: 'cursor',
  },
];

/**
 * Playground for Scatter hover and click interactions.
 * @returns playground element
 */
export const ScatterInteractionPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={interactionControls}
    render={({ inspect, highlightBy, popover, rightClick, tooltipAnchor }) => {
      const highlightByProp = highlightBy === 'audience' ? ['audience'] : highlightBy;
      return (
        <Chart data={scatterCampaignData} tooltipAnchor={tooltipAnchor as 'mark' | undefined}>
          <Axis position="left" grid title="Revenue ($K)" />
          <Axis position="bottom" grid title="Spend ($K)" />
          <Scatter dimension="spend" metric="revenue" color="channel">
            {inspect !== false && (
              <ChartInspect highlightBy={highlightByProp as 'series' | 'dimension' | string[] | undefined}>
                {inspectContent}
              </ChartInspect>
            )}
            {popover !== false && (
              <ChartPopover width="auto" rightClick={rightClick as boolean | undefined}>
                {popoverContent}
              </ChartPopover>
            )}
          </Scatter>
          <Legend />
        </Chart>
      );
    }}
  />
);

const highlightControls: PlaygroundControl[] = [
  { group: 'Chart', name: 'highlightedSeries', type: 'select', options: ['none', ...channels], defaultValue: 'none' },
  {
    group: 'Chart',
    name: 'highlightedItem',
    type: 'select',
    options: ['none', '3', '3, 12'],
    defaultValue: 'none',
  },
];

/**
 * Playground for controlled highlighting from outside the chart.
 * @returns playground element
 */
export const ScatterHighlightPlayground = () => (
  <PropPlayground
    previewSize={getScatterPreviewSize}
    controls={highlightControls}
    render={({ highlightedSeries, highlightedItem }) => {
      const items = toList(highlightedItem)?.map(Number);
      return (
        <Chart
          data={scatterCampaignData}
          highlightedSeries={optional(highlightedSeries)}
          idKey={items ? 'id' : undefined}
          highlightedItem={items && items.length === 1 ? items[0] : items}
        >
          <Axis position="left" grid title="Revenue ($K)" />
          <Axis position="bottom" grid title="Spend ($K)" />
          <Scatter dimension="spend" metric="revenue" color="channel">
            <ChartInspect>{inspectContent}</ChartInspect>
          </Scatter>
          <Legend highlight />
        </Chart>
      );
    }}
  />
);
