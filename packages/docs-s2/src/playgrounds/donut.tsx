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

import {
  ChartInspect,
  ChartPopover,
  Donut,
  DonutSummary,
  Legend,
  SegmentLabel,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import {
  booleanData,
  browserData,
  browserLabelData,
  emptyData,
  surveyData,
  zeroData,
} from '../components/examples/data';
import { withSource } from '../components/examples/elementToJsx';

// Matches the L size in the Donut dev dashboard: a 200px donut, plus room for segment labels.
const L_DIAMETER = 200;
const L_LABELED_SIZE = 344;
const SIDE_LEGEND_WIDTH = 113;
// Tall enough for a side legend with a title to list all five browsers.
const SIDE_LEGEND_HEIGHT = 180;
// Wide enough for a bottom legend to wrap onto two rows.
const BOTTOM_LEGEND_WIDTH = 400;
const BOTTOM_LEGEND_HEIGHT = 88;
const BOTTOM_LEGEND_TITLE_HEIGHT = 24;
const TITLE_HEIGHT = 40;

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
 * Sizes a donut example so the donut is L size, leaving room for labels, legend, and title.
 * @param element chart element
 * @returns preview width and height
 */
const getDonutPreviewSize = (element: ReactElement): PreviewSize => {
  const children = (element.props as { children?: ReactNode }).children;
  const donut = findElement(children, 'Donut');
  const hasLabels = Boolean(findElement(donut?.props.children as ReactNode, 'SegmentLabel'));
  const isSemicircle = donut?.props.variant === 'semicircle';
  const size = hasLabels ? L_LABELED_SIZE : L_DIAMETER + 4;
  const donutHeight = isSemicircle ? size / 2 + 2 : size;
  const legend = findElement(children, 'Legend');
  const legendPosition = (legend?.props.position as string | undefined) ?? 'bottom';
  const isSideLegend = Boolean(legend) && ['left', 'right'].includes(legendPosition);
  const isBottomLegend = Boolean(legend) && !isSideLegend;
  const titleHeight = findElement(children, 'Title') ? TITLE_HEIGHT : 0;
  let width = size;
  let height = donutHeight;
  if (isSideLegend) {
    width = size + SIDE_LEGEND_WIDTH;
    height = Math.max(donutHeight, SIDE_LEGEND_HEIGHT);
  } else if (isBottomLegend) {
    width = Math.max(size, BOTTOM_LEGEND_WIDTH);
    height = donutHeight + BOTTOM_LEGEND_HEIGHT + (legend?.props.title ? BOTTOM_LEGEND_TITLE_HEIGHT : 0);
  }
  height += titleHeight;
  return { width, height };
};

type Locale = 'en-US' | 'de-DE' | 'fr-FR';
type LegendPosition = 'right' | 'bottom' | 'left' | 'top';
type AnimationType = 'hover' | 'drawIn';

const browsers = browserData.map((datum) => datum.browser);

/** Converts a "none" select value to undefined. */
const optional = (value: unknown) => (!value || value === 'none' ? undefined : String(value));

/** Splits a comma-separated select value into a list. */
const toList = (value: unknown) => optional(value)?.split(', ');

const donutControls: PlaygroundControl[] = [
  { group: 'Donut', name: 'variant', type: 'select', options: ['circle', 'semicircle'], defaultValue: 'circle' },
  { group: 'Donut', name: 'holeRatio', type: 'number', min: 0, max: 0.95, step: 0.05, defaultValue: 0.85 },
  {
    group: 'DonutSummary',
    name: 'summary',
    label: 'Show summary',
    doc: 'DonutSummary',
    type: 'boolean',
    defaultValue: true,
  },
  {
    group: 'Legend',
    name: 'legend',
    label: 'Position',
    doc: 'Legend.position',
    type: 'select',
    options: ['none', 'right', 'bottom', 'left', 'top'],
    defaultValue: 'right',
  },
  {
    group: 'Title',
    name: 'title',
    label: 'Text',
    doc: 'Title.text',
    type: 'text',
    defaultValue: 'Visitors by browser',
  },
];

/**
 * Playground for the top-level Donut props and its common siblings.
 * @returns playground element
 */
export const DonutPlayground = () => (
  <PropPlayground
    previewSize={getDonutPreviewSize}
    controls={donutControls}
    render={({ variant, holeRatio, summary, legend, title = 'Visitors by browser' }) => (
      <Chart data={browserData}>
        {optional(title) && <Title text={String(title)} />}
        <Donut
          metric="count"
          color="browser"
          variant={variant as 'semicircle' | undefined}
          holeRatio={holeRatio as number | undefined}
        >
          {summary !== false && <DonutSummary label="Visitors" />}
        </Donut>
        {legend !== 'none' && <Legend title="Browsers" position={(legend ?? 'right') as LegendPosition} />}
      </Chart>
    )}
  />
);

const holeRatioControls: PlaygroundControl[] = [
  { name: 'holeRatio', type: 'number', min: 0, max: 0.95, step: 0.05, defaultValue: 0 },
];

/**
 * Playground for donut hole size, from pie to thin ring.
 * @returns playground element
 */
export const DonutHoleRatioPlayground = () => (
  <PropPlayground
    previewSize={getDonutPreviewSize}
    controls={holeRatioControls}
    component="Donut"
    render={({ holeRatio }) => (
      <Chart data={browserData}>
        <Donut metric="count" color="browser" holeRatio={(holeRatio ?? 0) as number} />
        <Legend />
      </Chart>
    )}
  />
);

const sizeControls: PlaygroundControl[] = [
  { group: 'Chart', name: 'width', type: 'number', min: 120, max: 520, step: 10, defaultValue: 400 },
  { group: 'Chart', name: 'height', type: 'number', min: 80, max: 400, step: 10, defaultValue: 300 },
  { group: 'Donut', name: 'variant', type: 'select', options: ['circle', 'semicircle'], defaultValue: 'circle' },
];

/**
 * Playground for how chart width and height size the donut.
 * @returns playground element
 */
export const DonutSizePlayground = () => (
  <PropPlayground
    controls={sizeControls}
    render={({ width, height, variant }) => (
      <Chart data={browserData} width={(width ?? 400) as number} height={(height ?? 300) as number}>
        <Donut metric="count" color="browser" variant={variant as 'semicircle' | undefined}>
          <DonutSummary label="Visitors" />
        </Donut>
      </Chart>
    )}
  />
);

const booleanControls: PlaygroundControl[] = [
  { name: 'label', type: 'text', defaultValue: 'Success rate' },
  { name: 'hideValue', type: 'boolean', defaultValue: false },
];

/**
 * Playground for boolean donuts.
 * @returns playground element
 */
export const DonutBooleanPlayground = () => (
  <PropPlayground
    previewSize={getDonutPreviewSize}
    controls={booleanControls}
    component="DonutSummary"
    render={({ label, hideValue }) => (
      <Chart data={booleanData} colors={['green-800', 'gray-200']}>
        <Donut metric="value" color="id" isBoolean>
          <DonutSummary label={(label ?? 'Success rate') as string} hideValue={hideValue as boolean | undefined} />
        </Donut>
      </Chart>
    )}
  />
);

const statesControls: PlaygroundControl[] = [
  { name: 'state', type: 'select', options: ['all zeros', 'empty', 'loading'], defaultValue: 'all zeros' },
  {
    name: 'emptyStateText',
    type: 'text',
    defaultValue: 'No browser data',
    isDisabled: (values) => values.state !== 'empty',
  },
];

/**
 * Playground for zero-value, empty, and loading donuts.
 * @returns playground element
 */
export const DonutStatesPlayground = () => (
  <PropPlayground
    previewSize={getDonutPreviewSize}
    controls={statesControls}
    component="Chart"
    render={({ state = 'all zeros', emptyStateText }) => {
      const dataByState: Record<string, Record<string, unknown>[]> = { 'all zeros': zeroData, empty: emptyData };
      return (
        <Chart
          data={dataByState[String(state)] ?? browserData}
          loading={state === 'loading' ? true : undefined}
          emptyStateText={state === 'empty' ? String(emptyStateText ?? 'No browser data') : undefined}
        >
          <Donut metric="count" color="browser">
            <DonutSummary label="Visitors" />
          </Donut>
        </Chart>
      );
    }}
  />
);

const surveyControls: PlaygroundControl[] = [
  { name: 'sortOrder', type: 'select', options: ['data', 'valueDescending'], defaultValue: 'data' },
];

/**
 * Playground for semicircle donuts with ordinal data.
 * @returns playground element
 */
export const DonutSurveyPlayground = () => (
  <PropPlayground
    previewSize={getDonutPreviewSize}
    controls={surveyControls}
    component="Donut"
    render={({ sortOrder }) => (
      <Chart data={surveyData}>
        <Donut
          metric="count"
          color="response"
          variant="semicircle"
          sortOrder={(sortOrder ?? 'data') as 'data' | 'valueDescending'}
        >
          <DonutSummary label="Responses" />
        </Donut>
      </Chart>
    )}
  />
);

const summaryControls: PlaygroundControl[] = [
  { name: 'label', type: 'text', defaultValue: 'Visitors' },
  {
    name: 'numberFormat',
    type: 'select',
    options: ['shortNumber', 'standardNumber', ',.2f'],
    defaultValue: 'shortNumber',
  },
  { name: 'delta', type: 'select', options: ['none', '0.025', '-0.04'], defaultValue: 'none' },
  { name: 'hideValue', type: 'boolean', defaultValue: false },
  { group: 'Chart', name: 'locale', type: 'select', options: ['en-US', 'de-DE', 'fr-FR'], defaultValue: 'en-US' },
];

/**
 * Playground for DonutSummary props.
 * @returns playground element
 */
export const DonutSummaryPlayground = () => (
  <PropPlayground
    previewSize={getDonutPreviewSize}
    controls={summaryControls}
    component="DonutSummary"
    render={({ label, numberFormat, delta, hideValue, locale }) => (
      <Chart data={browserData} locale={locale as Locale | undefined}>
        <Donut metric="count" color="browser">
          <DonutSummary
            label={(label ?? 'Visitors') as string}
            numberFormat={numberFormat as string | undefined}
            delta={optional(delta) ? Number(delta) : undefined}
            hideValue={hideValue as boolean | undefined}
          />
        </Donut>
      </Chart>
    )}
  />
);

const segmentLabelControls: PlaygroundControl[] = [
  { name: 'value', type: 'boolean', defaultValue: true },
  { name: 'percent', type: 'boolean', defaultValue: false },
  { name: 'swatch', type: 'boolean', defaultValue: false },
  { name: 'showValueRow', type: 'boolean', defaultValue: false },
  { name: 'showTotal', type: 'boolean', defaultValue: false, isDisabled: (values) => values.showValueRow !== true },
  {
    name: 'valueFormat',
    type: 'select',
    options: ['standardNumber', 'shortNumber', ',.0f'],
    defaultValue: 'standardNumber',
  },
  {
    name: 'percentFormat',
    type: 'select',
    options: ['.0%', '.1%'],
    defaultValue: '.0%',
    isDisabled: (values) => values.percent !== true,
  },
];

/**
 * Playground for SegmentLabel props.
 * @returns playground element
 */
export const SegmentLabelPlayground = () => (
  <PropPlayground
    previewSize={getDonutPreviewSize}
    controls={segmentLabelControls}
    component="SegmentLabel"
    render={(props) => (
      <Chart data={browserData}>
        <Donut metric="count" color="browser">
          <SegmentLabel {...props} />
        </Donut>
      </Chart>
    )}
  />
);

const labelKeyControls: PlaygroundControl[] = [
  { name: 'labelKey', type: 'select', options: ['none', 'label'], defaultValue: 'label' },
];

/**
 * Playground for reading segment label text from a different data field.
 * @returns playground element
 */
export const SegmentLabelKeyPlayground = () => (
  <PropPlayground
    previewSize={getDonutPreviewSize}
    controls={labelKeyControls}
    component="SegmentLabel"
    render={({ labelKey = 'label' }) => (
      <Chart data={browserLabelData}>
        <Donut metric="count" color="browser">
          <SegmentLabel labelKey={optional(labelKey)} />
        </Donut>
      </Chart>
    )}
  />
);

const emphasisControls: PlaygroundControl[] = [
  {
    name: 'emphasized',
    label: 'emphasizedItems',
    doc: 'Donut.emphasizedItems',
    type: 'select',
    options: ['Chrome', 'Chrome, Firefox', 'Safari, Opera'],
    defaultValue: 'Chrome',
  },
  { name: 'hideDeemphasizedLabels', type: 'boolean', defaultValue: false },
];

/**
 * Playground for emphasized and de-emphasized segment labels.
 * @returns playground element
 */
export const DonutEmphasisPlayground = () => (
  <PropPlayground
    previewSize={getDonutPreviewSize}
    controls={emphasisControls}
    component="Donut"
    render={({ emphasized = 'Chrome', hideDeemphasizedLabels }) => (
      <Chart data={browserData}>
        <Donut
          metric="count"
          color="browser"
          emphasizedItems={toList(emphasized)}
          hideDeemphasizedLabels={hideDeemphasizedLabels as boolean | undefined}
        >
          <SegmentLabel labelMode="emphasized" percent value={false} showValueRow />
          <SegmentLabel labelMode="deemphasized" value />
        </Donut>
      </Chart>
    )}
  />
);

const legendControls: PlaygroundControl[] = [
  { name: 'position', type: 'select', options: ['right', 'bottom', 'left', 'top'], defaultValue: 'right' },
  { name: 'isToggleable', type: 'boolean', defaultValue: true },
  { name: 'highlight', type: 'boolean', defaultValue: false },
];

/**
 * Playground for Legend props with a donut.
 * @returns playground element
 */
export const DonutLegendPlayground = () => (
  <PropPlayground
    previewSize={getDonutPreviewSize}
    controls={legendControls}
    component="Legend"
    render={({ position, isToggleable = true, highlight }) => (
      <Chart data={browserData}>
        <Donut metric="count" color="browser">
          <DonutSummary label="Visitors" />
        </Donut>
        <Legend
          title="Browsers"
          position={(position ?? 'right') as LegendPosition}
          isToggleable={isToggleable as boolean}
          highlight={highlight as boolean | undefined}
        />
      </Chart>
    )}
  />
);

const hiddenSeriesControls: PlaygroundControl[] = [
  { name: 'hiddenSeries', type: 'select', options: ['none', 'Chrome', 'Chrome, Firefox'], defaultValue: 'Chrome' },
];

/**
 * Playground for hiding segments from outside the chart.
 * @returns playground element
 */
export const DonutHiddenSeriesPlayground = () => (
  <PropPlayground
    previewSize={getDonutPreviewSize}
    controls={hiddenSeriesControls}
    component="Chart"
    render={({ hiddenSeries = 'Chrome' }) => (
      <Chart data={browserData} hiddenSeries={toList(hiddenSeries)}>
        <Donut metric="count" color="browser">
          <DonutSummary label="Visitors" />
        </Donut>
        <Legend />
      </Chart>
    )}
  />
);

const popoverContent = withSource(
  (datum: Record<string, unknown>) => (
    <>
      <Heading level={4}>{String(datum.browser)}</Heading>
      <Content>
        <Text>{Number(datum.count).toLocaleString()} visitors</Text>
      </Content>
    </>
  ),
  '(datum) => (\n  <>\n    <Heading level={4}>{datum.browser}</Heading>\n    <Content>\n      <Text>{datum.count.toLocaleString()} visitors</Text>\n    </Content>\n  </>\n)',
  { '@react-spectrum/s2': ['Content', 'Heading', 'Text'] }
);

const interactionControls: PlaygroundControl[] = [
  { group: 'ChartInspect', name: 'inspect', label: 'Show', doc: 'ChartInspect', type: 'boolean', defaultValue: true },
  { group: 'ChartPopover', name: 'popover', label: 'Show', doc: 'ChartPopover', type: 'boolean', defaultValue: true },
  {
    group: 'ChartPopover',
    name: 'content',
    doc: 'ChartPopover.children',
    type: 'select',
    options: ['default', 'custom'],
    defaultValue: 'custom',
    isDisabled: (values) => values.popover === false,
  },
  {
    group: 'ChartPopover',
    name: 'rightClick',
    type: 'boolean',
    defaultValue: false,
    isDisabled: (values) => values.popover === false,
  },
];

/**
 * Playground for Donut hover and click interactions.
 * @returns playground element
 */
export const DonutInteractionPlayground = () => (
  <PropPlayground
    previewSize={getDonutPreviewSize}
    controls={interactionControls}
    render={({ inspect, popover, content = 'custom', rightClick }) => (
      <Chart data={browserData}>
        <Donut metric="count" color="browser">
          {inspect !== false && <ChartInspect />}
          {popover !== false && (
            <ChartPopover width="auto" rightClick={rightClick as boolean | undefined}>
              {content === 'custom' ? popoverContent : undefined}
            </ChartPopover>
          )}
        </Donut>
      </Chart>
    )}
  />
);

const highlightControls: PlaygroundControl[] = [
  { group: 'Chart', name: 'highlightedSeries', type: 'select', options: ['none', ...browsers], defaultValue: 'none' },
  {
    group: 'Chart',
    name: 'highlightedItem',
    type: 'select',
    options: ['none', 'Safari', 'Chrome, Safari'],
    defaultValue: 'none',
  },
];

/**
 * Playground for controlled highlighting from outside the chart.
 * @returns playground element
 */
export const DonutHighlightPlayground = () => (
  <PropPlayground
    previewSize={getDonutPreviewSize}
    controls={highlightControls}
    render={({ highlightedSeries, highlightedItem }) => {
      const items = toList(highlightedItem);
      return (
        <Chart
          data={browserData}
          highlightedSeries={optional(highlightedSeries)}
          idKey={items ? 'browser' : undefined}
          highlightedItem={items && items.length === 1 ? items[0] : items}
        >
          <Donut metric="count" color="browser">
            <ChartInspect />
          </Donut>
          <Legend highlight />
        </Chart>
      );
    }}
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
    group: 'Chart',
    name: 'hover',
    label: "animationTypes 'hover'",
    doc: 'Chart.animationTypes',
    type: 'boolean',
    defaultValue: true,
  },
  { group: 'Donut', name: 'variant', type: 'select', options: ['circle', 'semicircle'], defaultValue: 'circle' },
  {
    group: 'SegmentLabel',
    name: 'labels',
    label: 'Show',
    doc: 'SegmentLabel',
    type: 'boolean',
    defaultValue: true,
    isDisabled: (values) => values.variant === 'semicircle',
  },
];

/**
 * Playground for Donut draw-in and hover animations.
 * @returns playground element
 */
export const DonutAnimationPlayground = () => (
  <PropPlayground
    previewSize={getDonutPreviewSize}
    replay
    controls={animationControls}
    render={({ drawIn = true, hover = true, variant, labels }) => {
      const types: AnimationType[] = [];
      if (hover) types.push('hover');
      if (drawIn) types.push('drawIn');
      const animationTypes = hover && drawIn ? undefined : types;
      return (
        <Chart data={browserData} animationTypes={animationTypes}>
          <Donut metric="count" color="browser" variant={variant as 'semicircle' | undefined}>
            <ChartInspect />
            {labels !== false && variant !== 'semicircle' && <SegmentLabel value />}
          </Donut>
        </Chart>
      );
    }}
  />
);
