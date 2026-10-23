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
import React, { Children, ReactElement, ReactNode, isValidElement, useRef, useState } from 'react';

import { useColorMode } from '@docusaurus/theme-common';
import CodeBlock from '@theme/CodeBlock';

import { ActionButton, Provider } from '@react-spectrum/s2';
import {
  Axis,
  ChartColors,
  ChartHandle,
  ChartInspect,
  Height,
  Legend,
  Line,
  Width,
} from '@spectrum-charts/react-spectrum-charts-s2';

import { ClientOnly } from '../components/ClientOnly';
import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import styles from '../components/examples/PropPlayground.module.css';
import { chartTrafficData, emptyData } from '../components/examples/data';
import { withSource } from '../components/examples/elementToJsx';

// Charts are sized for a 480 × 288 plot, capped at 512px wide overall.
const PLOT_WIDTH = 480;
const MAX_WIDTH = 512;
const PLOT_HEIGHT = 288;
const LEFT_AXIS_WIDTH = 32;
const BOTTOM_AXIS_HEIGHT = 24;
const SIDE_LEGEND_WIDTH = 116;
const BOTTOM_LEGEND_HEIGHT = 60;
const TITLE_HEIGHT = 34;
// Container for the sizing examples, which size the chart from its parent.
const CONTAINER = { width: 512, height: 360 };

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

/**
 * Sizes a chart example so the plot is up to 480 × 288, leaving room for axes, legend, title, and padding.
 * @param element chart element
 * @returns preview width and height
 */
const getChartPreviewSize = (element: ReactElement): PreviewSize => {
  const props = element.props as { children?: ReactNode; padding?: number; title?: string };
  const legend = findElement(props.children, 'Legend');
  const legendPosition = (legend?.props.position as string | undefined) ?? 'bottom';
  const isSideLegend = Boolean(legend) && ['left', 'right'].includes(legendPosition);
  const hasTitle = Boolean(props.title) || Boolean(findElement(props.children, 'Title'));
  const padding = 2 * (props.padding ?? 0);
  return {
    width: Math.min(PLOT_WIDTH + LEFT_AXIS_WIDTH + (isSideLegend ? SIDE_LEGEND_WIDTH : 0) + padding, MAX_WIDTH),
    height:
      PLOT_HEIGHT +
      BOTTOM_AXIS_HEIGHT +
      (legend && !isSideLegend ? BOTTOM_LEGEND_HEIGHT : 0) +
      (hasTitle ? TITLE_HEIGHT : 0) +
      padding,
  };
};

type Locale = 'en-US' | 'de-DE' | 'fr-FR';
type AnimationType = 'hover' | 'drawIn';
type LineType = 'solid' | 'dashed' | 'dotted' | 'dotDash' | 'longDash' | 'twoDash';
type TooltipAnchor = 'cursor' | 'mark';
type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/** Converts a "none" select value to undefined. */
const optional = (value: unknown) => (!value || value === 'none' ? undefined : String(value));

/** Splits a comma-separated select value into a list. */
const toList = (value: unknown) => optional(value)?.split(', ');

/** Converts a select value to a number when it is one, e.g. a pixel width. */
const toSize = (value: unknown) => {
  const text = String(value);
  return Number.isNaN(Number(text)) ? text : Number(text);
};

const inspectContent = withSource(
  (datum: Record<string, unknown>) => (
    <div>
      {String(datum.series)}: {Number(datum.value).toLocaleString()} visits
    </div>
  ),
  '(datum) => (\n  <div>\n    {datum.series}: {datum.value.toLocaleString()} visits\n  </div>\n)'
);

const chartControls: PlaygroundControl[] = [
  { name: 'title', type: 'text', defaultValue: 'Visits by channel' },
  {
    name: 'colors',
    type: 'select',
    options: ['s2Categorical20', 'blue-1000, blue-700, blue-400'],
    defaultValue: 's2Categorical20',
  },
  { name: 'renderer', type: 'select', options: ['svg', 'canvas'], defaultValue: 'svg' },
  { name: 'loading', type: 'boolean', defaultValue: false },
];

/**
 * Playground for common Chart props on a line chart.
 * @returns playground element
 */
export const ChartPlayground = () => (
  <PropPlayground
    previewSize={getChartPreviewSize}
    controls={chartControls}
    component="Chart"
    render={({ title = 'Visits by channel', colors, renderer, loading }) => {
      const colorList = toList(colors);
      return (
        <Chart
          data={chartTrafficData}
          title={optional(title)}
          colors={(colorList && colorList.length > 1 ? colorList : colorList?.[0]) as ChartColors | undefined}
          renderer={renderer as 'canvas' | undefined}
          loading={loading as boolean | undefined}
        >
          <Axis position="left" grid />
          <Axis position="bottom" labelFormat="time" baseline ticks />
          <Line color="series" />
          <Legend />
        </Chart>
      );
    }}
  />
);

const idKeyControls: PlaygroundControl[] = [
  {
    name: 'highlightedItem',
    type: 'select',
    options: ['none', '4', '4, 14, 24'],
    defaultValue: '4',
  },
];

/**
 * Playground for idKey, which names the row ID field used by highlightedItem.
 * @returns playground element
 */
export const ChartIdKeyPlayground = () => (
  <PropPlayground
    previewSize={getChartPreviewSize}
    controls={idKeyControls}
    component="Chart"
    render={({ highlightedItem = '4' }) => {
      const ids = toList(highlightedItem)?.map(Number);
      return (
        <Chart data={chartTrafficData} idKey="id" highlightedItem={ids?.length === 1 ? ids[0] : ids}>
          <Axis position="left" grid />
          <Axis position="bottom" labelFormat="time" baseline ticks />
          <Line color="series" />
          <Legend />
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
    defaultValue: 'No visits yet',
    isDisabled: (values) => values.state !== 'empty',
  },
];

/**
 * Playground for empty and loading charts.
 * @returns playground element
 */
export const ChartStatesPlayground = () => (
  <PropPlayground
    previewSize={getChartPreviewSize}
    controls={statesControls}
    component="Chart"
    render={({ state = 'empty', emptyStateText }) => (
      <Chart
        data={state === 'empty' ? emptyData : chartTrafficData}
        loading={state === 'loading' ? true : undefined}
        emptyStateText={state === 'empty' ? String(emptyStateText ?? 'No visits yet') : undefined}
      >
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Line color="series" />
        <Legend />
      </Chart>
    )}
  />
);

const sizeControls: PlaygroundControl[] = [
  { name: 'width', type: 'select', options: ['auto', '75%', '320'], defaultValue: 'auto' },
  { name: 'height', type: 'select', options: ['300', '100%', '50%'], defaultValue: '300' },
  {
    name: 'minWidth',
    type: 'number',
    min: 100,
    max: 512,
    step: 20,
    defaultValue: 100,
    isDisabled: (values) => values.width === '320',
  },
  {
    name: 'maxWidth',
    type: 'number',
    min: 100,
    max: 512,
    step: 20,
    defaultValue: 512,
    isDisabled: (values) => values.width === '320',
  },
  {
    name: 'minHeight',
    type: 'number',
    min: 100,
    max: 360,
    step: 20,
    defaultValue: 100,
    isDisabled: (values) => !String(values.height).endsWith('%'),
  },
  {
    name: 'maxHeight',
    type: 'number',
    min: 100,
    max: 360,
    step: 20,
    defaultValue: 360,
    isDisabled: (values) => !String(values.height).endsWith('%'),
  },
];

/**
 * Playground for chart width and height inside a 512 × 360 container.
 * @returns playground element
 */
export const ChartSizePlayground = () => (
  <PropPlayground
    controls={sizeControls}
    component="Chart"
    render={({ width, height, minWidth, maxWidth, minHeight, maxHeight }) => (
      <div style={CONTAINER}>
        <Chart
          data={chartTrafficData}
          width={width === undefined ? undefined : (toSize(width) as Width)}
          height={height === undefined ? undefined : (toSize(height) as Height)}
          minWidth={minWidth as number | undefined}
          maxWidth={maxWidth as number | undefined}
          minHeight={minHeight as number | undefined}
          maxHeight={maxHeight as number | undefined}
        >
          <Axis position="left" grid />
          <Axis position="bottom" labelFormat="time" baseline ticks />
          <Line color="series" />
        </Chart>
      </div>
    )}
  />
);

const paddingControls: PlaygroundControl[] = [
  { name: 'padding', type: 'number', min: 0, max: 48, step: 4, defaultValue: 24 },
];

/**
 * Playground for space around the chart contents.
 * @returns playground element
 */
export const ChartPaddingPlayground = () => (
  <PropPlayground
    previewSize={getChartPreviewSize}
    controls={paddingControls}
    component="Chart"
    render={({ padding = 24 }) => (
      <Chart data={chartTrafficData} padding={padding as number} backgroundColor="gray-100">
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Line color="series" />
        <Legend />
      </Chart>
    )}
  />
);

const backgroundControls: PlaygroundControl[] = [
  {
    name: 'backgroundColor',
    type: 'select',
    options: ['gray-25', 'gray-50', 'gray-100', 'transparent'],
    defaultValue: 'gray-25',
  },
];

/**
 * Playground for the chart background color.
 * @returns playground element
 */
export const ChartBackgroundPlayground = () => (
  <PropPlayground
    previewSize={getChartPreviewSize}
    controls={backgroundControls}
    component="Chart"
    render={({ backgroundColor = 'gray-25' }) => (
      <Chart data={chartTrafficData} backgroundColor={String(backgroundColor)}>
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Line color="series" />
        <Legend />
      </Chart>
    )}
  />
);

const colorsControls: PlaygroundControl[] = [
  {
    name: 'colors',
    type: 'select',
    options: [
      's2Categorical20',
      'blue-1000, blue-700, blue-400',
      'rgb(15, 181, 174), rgb(64, 70, 202), rgb(246, 133, 17)',
    ],
    defaultValue: 'blue-1000, blue-700, blue-400',
  },
];

/**
 * Playground for named color scales and custom color lists.
 * @returns playground element
 */
export const ChartColorsPlayground = () => (
  <PropPlayground
    previewSize={getChartPreviewSize}
    controls={colorsControls}
    component="Chart"
    render={({ colors = 'blue-1000, blue-700, blue-400' }) => {
      const value = String(colors);
      const colorList = value.includes(', ') ? value.split(/, (?=[a-z])/) : value;
      return (
        <Chart data={chartTrafficData} colors={colorList as ChartColors}>
          <Axis position="left" grid />
          <Axis position="bottom" labelFormat="time" baseline ticks />
          <Line color="series" />
          <Legend />
        </Chart>
      );
    }}
  />
);

const scalesControls: PlaygroundControl[] = [
  {
    name: 'lineTypes',
    type: 'select',
    options: ['solid, dashed, dotted', 'solid, longDash, dotDash'],
    defaultValue: 'solid, dashed, dotted',
  },
  { name: 'opacities', type: 'select', options: ['1', '1, 0.6, 0.3'], defaultValue: '1, 0.6, 0.3' },
];

/**
 * Playground for the line type and opacity scales.
 * @returns playground element
 */
export const ChartScalesPlayground = () => (
  <PropPlayground
    previewSize={getChartPreviewSize}
    controls={scalesControls}
    component="Chart"
    render={({ lineTypes = 'solid, dashed, dotted', opacities = '1, 0.6, 0.3' }) => (
      <Chart
        data={chartTrafficData}
        lineTypes={toList(lineTypes) as LineType[]}
        opacities={toList(opacities)?.map(Number)}
      >
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Line lineType="series" opacity="series" />
      </Chart>
    )}
  />
);

const localeControls: PlaygroundControl[] = [
  { name: 'locale', type: 'select', options: ['en-US', 'de-DE', 'fr-FR'], defaultValue: 'de-DE' },
];

/**
 * Playground for locale-aware number formatting.
 * @returns playground element
 */
export const ChartLocalePlayground = () => (
  <PropPlayground
    previewSize={getChartPreviewSize}
    controls={localeControls}
    component="Chart"
    render={({ locale = 'de-DE' }) => (
      <Chart data={chartTrafficData} locale={locale as Locale}>
        <Axis position="left" grid numberFormat="standardNumber" />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Line color="series" />
        <Legend />
      </Chart>
    )}
  />
);

const titleControls: PlaygroundControl[] = [
  { name: 'title', type: 'text', defaultValue: 'Visits by channel' },
  {
    name: 'description',
    type: 'text',
    defaultValue: 'Daily visits from March 2 to 11 by channel. Organic search leads and grows; email stays lowest.',
  },
];

/**
 * Playground for the chart title and accessible description.
 * @returns playground element
 */
export const ChartTitlePlayground = () => (
  <PropPlayground
    previewSize={getChartPreviewSize}
    controls={titleControls}
    component="Chart"
    render={({
      title = 'Visits by channel',
      description = 'Daily visits from March 2 to 11 by channel. Organic search leads and grows; email stays lowest.',
    }) => (
      <Chart data={chartTrafficData} title={optional(title)} description={optional(description)}>
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Line color="series" />
        <Legend />
      </Chart>
    )}
  />
);

const highlightControls: PlaygroundControl[] = [
  { name: 'hiddenSeries', type: 'select', options: ['none', 'Email', 'Paid search, Email'], defaultValue: 'none' },
  {
    name: 'highlightedSeries',
    type: 'select',
    options: ['none', 'Organic search', 'Paid search', 'Email'],
    defaultValue: 'Paid search',
  },
];

/**
 * Playground for controlled hidden and highlighted series.
 * @returns playground element
 */
export const ChartHighlightPlayground = () => (
  <PropPlayground
    previewSize={getChartPreviewSize}
    controls={highlightControls}
    component="Chart"
    render={({ hiddenSeries, highlightedSeries = 'Paid search' }) => (
      <Chart
        data={chartTrafficData}
        hiddenSeries={toList(hiddenSeries)}
        highlightedSeries={optional(highlightedSeries)}
      >
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Line color="series" />
        <Legend />
      </Chart>
    )}
  />
);

const tooltipControls: PlaygroundControl[] = [
  { name: 'tooltipAnchor', type: 'select', options: ['cursor', 'mark'], defaultValue: 'mark' },
  {
    name: 'tooltipPlacement',
    type: 'select',
    options: ['top', 'bottom', 'left', 'right'],
    defaultValue: 'top',
    isDisabled: (values) => values.tooltipAnchor !== 'mark',
  },
];

/**
 * Playground for where ChartInspect tooltips appear.
 * @returns playground element
 */
export const ChartTooltipPlayground = () => (
  <PropPlayground
    previewSize={getChartPreviewSize}
    controls={tooltipControls}
    component="Chart"
    render={({ tooltipAnchor = 'mark', tooltipPlacement }) => (
      <Chart
        data={chartTrafficData}
        tooltipAnchor={tooltipAnchor as TooltipAnchor}
        tooltipPlacement={tooltipAnchor === 'mark' ? (tooltipPlacement as TooltipPlacement | undefined) : undefined}
      >
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Line color="series">
          <ChartInspect>{inspectContent}</ChartInspect>
        </Line>
        <Legend />
      </Chart>
    )}
  />
);

const animationControls: PlaygroundControl[] = [
  { name: 'animations', type: 'boolean', defaultValue: true },
  {
    name: 'animationTypes',
    type: 'select',
    options: ['hover', 'hover, drawIn', 'drawIn'],
    defaultValue: 'hover, drawIn',
    isDisabled: (values) => values.animations === false,
  },
];

/**
 * Playground for hover and draw-in animations.
 * @returns playground element
 */
export const ChartAnimationPlayground = () => (
  <PropPlayground
    previewSize={getChartPreviewSize}
    controls={animationControls}
    component="Chart"
    replay
    render={({ animations, animationTypes = 'hover, drawIn' }) => (
      <Chart
        data={chartTrafficData}
        animations={animations as boolean | undefined}
        animationTypes={
          animations === false || animationTypes === 'hover, drawIn'
            ? undefined
            : (toList(animationTypes) as AnimationType[])
        }
      >
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Line color="series">
          <ChartInspect>{inspectContent}</ChartInspect>
        </Line>
        <Legend />
      </Chart>
    )}
  />
);

const HANDLE_CODE = `import { useRef } from 'react';
import { ActionButton } from '@react-spectrum/s2';
import { Axis, Chart, ChartHandle, Legend, Line } from '@spectrum-charts/react-spectrum-charts-s2';

const ref = useRef<ChartHandle>(null);

<Chart ref={ref} data={chartTrafficData} title="Visits by channel">
  <Axis position="left" grid />
  <Axis position="bottom" labelFormat="time" baseline ticks />
  <Line color="series" />
  <Legend />
</Chart>
<ActionButton onPress={() => ref.current?.download()}>Download PNG</ActionButton>
<ActionButton onPress={() => ref.current?.copy()}>Copy PNG</ActionButton>
<ActionButton onPress={async () => setSvg(await ref.current?.getSvg())}>Get SVG</ActionButton>`;

const HandleExample = () => {
  const { colorMode } = useColorMode();
  const ref = useRef<ChartHandle>(null);
  const [status, setStatus] = useState('');

  const run = (action: (handle: ChartHandle) => Promise<string>) => {
    if (!ref.current) return;
    action(ref.current).then(setStatus, (error: unknown) => setStatus(String(error)));
  };

  return (
    <>
      <div className={styles.preview}>
        <div>
          <Chart ref={ref} data={chartTrafficData} title="Visits by channel" width={512} height={406}>
            <Axis position="left" grid />
            <Axis position="bottom" labelFormat="time" baseline ticks />
            <Line color="series" />
            <Legend />
          </Chart>
        </div>
      </div>
      <Provider colorScheme={colorMode} UNSAFE_className={styles.controls}>
        <div className={styles.actions}>
          <ActionButton size="S" onPress={() => run((handle) => handle.download())}>
            Download PNG
          </ActionButton>
          <ActionButton size="S" onPress={() => run((handle) => handle.copy())}>
            Copy PNG
          </ActionButton>
          <ActionButton
            size="S"
            onPress={() => run((handle) => handle.getSvg().then((svg) => `getSvg() returned ${svg.length} characters`))}
          >
            Get SVG
          </ActionButton>
        </div>
        <div className={styles.fieldLabel}>{status}</div>
      </Provider>
    </>
  );
};

/**
 * Example of exporting a chart image with the ref handle.
 * @returns example element
 */
export const ChartHandleExample = () => (
  <div className={styles.playground}>
    <ClientOnly
      fallback={<div className={styles.fallback} />}
      markdown={null}
      noMarkdownReason="The example's code block is its Markdown export."
    >
      {() => <HandleExample />}
    </ClientOnly>
    <div className={styles.code}>
      <CodeBlock language="tsx">{HANDLE_CODE}</CodeBlock>
    </div>
  </div>
);
