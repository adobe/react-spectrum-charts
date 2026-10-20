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

import { Axis, Bar, Title } from '@spectrum-charts/react-spectrum-charts-s2';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import { browserData } from '../components/examples/data';

// Charts without a dev dashboard size the plot to 456 x 288, capped at 512px wide overall.
const PLOT_WIDTH = 456;
const MAX_WIDTH = 512;
const PLOT_HEIGHT = 288;
const LEFT_AXIS_WIDTH = 56;
const BOTTOM_AXIS_HEIGHT = 32;
const DEFAULT_FONT_SIZE = 24;
// Vega title offset plus room for descenders.
const TITLE_SPACING = 16;

const findElement = (node: ReactNode, name: string): ReactElement<Record<string, unknown>> | undefined => {
  for (const child of Children.toArray(node)) {
    if (!isValidElement(child)) continue;
    const element = child as ReactElement<Record<string, unknown>>;
    const type = element.type as { displayName?: string; name?: string };
    if ((type.displayName ?? type.name) === name) return element;
  }
  return undefined;
};

/**
 * Sizes a title example so the plot is up to 456 x 288, leaving room for the axes and title.
 * @param element chart element
 * @returns preview width and height
 */
const getTitlePreviewSize = (element: ReactElement): PreviewSize => {
  const { children, title: chartTitle } = element.props as { children?: ReactNode; title?: string };
  const title = findElement(children, 'Title');
  const fontSize = (title?.props.fontSize as number | undefined) ?? DEFAULT_FONT_SIZE;
  const titleSize = title || chartTitle ? fontSize + TITLE_SPACING : 0;
  const isSideTitle = ['left', 'right'].includes(title?.props.orient as string);
  const width = PLOT_WIDTH + LEFT_AXIS_WIDTH + (isSideTitle ? titleSize : 0);
  const height = PLOT_HEIGHT + BOTTOM_AXIS_HEIGHT + (isSideTitle ? 0 : titleSize);
  return { width: Math.min(width, MAX_WIDTH), height };
};

type TitlePosition = 'start' | 'middle' | 'end';
type FontWeight = ComponentProps<typeof Title>['fontWeight'];
type TitleOrient = 'top' | 'bottom' | 'left' | 'right';

const fontWeights = ['300', '400', '700', '900'];

/**
 * Renders the bar chart every title example uses.
 * @param title title element
 * @returns chart element
 */
const renderBarChart = (title: ReactElement) => (
  <Chart data={browserData}>
    {title}
    <Bar dimension="browser" metric="count" />
    <Axis position="left" grid />
    <Axis position="bottom" baseline />
  </Chart>
);

const titleControls: PlaygroundControl[] = [
  { name: 'text', type: 'text', defaultValue: 'Visitors by browser' },
  { name: 'position', type: 'select', options: ['start', 'middle', 'end'], defaultValue: 'start' },
  { name: 'orient', type: 'select', options: ['top', 'bottom', 'left', 'right'], defaultValue: 'top' },
  { name: 'fontWeight', type: 'select', options: fontWeights, defaultValue: '700' },
  { name: 'fontSize', type: 'number', min: 12, max: 32, step: 1, defaultValue: 24 },
];

/**
 * Playground for every Title prop.
 * @returns playground element
 */
export const TitlePlayground = () => (
  <PropPlayground
    previewSize={getTitlePreviewSize}
    controls={titleControls}
    component="Title"
    render={({ text = 'Visitors by browser', position, orient, fontWeight, fontSize }) =>
      renderBarChart(
        <Title
          text={String(text)}
          position={position as TitlePosition | undefined}
          orient={orient as TitleOrient | undefined}
          fontWeight={fontWeight ? (Number(fontWeight) as FontWeight) : undefined}
          fontSize={fontSize as number | undefined}
        />
      )
    }
  />
);

const placementControls: PlaygroundControl[] = [
  { name: 'orient', type: 'select', options: ['top', 'bottom', 'left', 'right'], defaultValue: 'top' },
  { name: 'position', type: 'select', options: ['start', 'middle', 'end'], defaultValue: 'middle' },
];

/**
 * Playground for which side the title is on and where it sits along that side.
 * @returns playground element
 */
export const TitlePlacementPlayground = () => (
  <PropPlayground
    previewSize={getTitlePreviewSize}
    controls={placementControls}
    component="Title"
    render={({ orient, position = 'middle' }) =>
      renderBarChart(
        <Title
          text="Visitors by browser"
          orient={orient as TitleOrient | undefined}
          position={position === 'start' ? undefined : (position as TitlePosition)}
        />
      )
    }
  />
);

const fontControls: PlaygroundControl[] = [
  { name: 'fontWeight', type: 'select', options: fontWeights, defaultValue: '400' },
  { name: 'fontSize', type: 'number', min: 12, max: 32, step: 1, defaultValue: 18 },
];

/**
 * Playground for title font weight and size.
 * @returns playground element
 */
export const TitleFontPlayground = () => (
  <PropPlayground
    previewSize={getTitlePreviewSize}
    controls={fontControls}
    component="Title"
    render={({ fontWeight = '400', fontSize = 18 }) => {
      const weight = Number(fontWeight);
      const size = Number(fontSize);
      return renderBarChart(
        <Title
          text="Visitors by browser"
          fontWeight={weight === 700 ? undefined : (weight as FontWeight)}
          fontSize={size === 24 ? undefined : size}
        />
      );
    }}
  />
);

const chartTitleControls: PlaygroundControl[] = [
  { group: 'Chart', name: 'chartTitle', label: 'title', doc: 'Chart.title', type: 'text', defaultValue: 'Visitors' },
  { group: 'Title', name: 'titleText', label: 'Show', doc: 'Title', type: 'boolean', defaultValue: false },
];

/**
 * Playground for the Chart title prop and how a Title child replaces it.
 * @returns playground element
 */
export const ChartTitlePlayground = () => (
  <PropPlayground
    previewSize={getTitlePreviewSize}
    controls={chartTitleControls}
    render={({ chartTitle = 'Visitors', titleText }) => (
      <Chart data={browserData} title={String(chartTitle) || undefined}>
        {titleText && <Title text="Visitors by browser" />}
        <Bar dimension="browser" metric="count" />
        <Axis position="left" grid />
        <Axis position="bottom" baseline />
      </Chart>
    )}
  />
);
