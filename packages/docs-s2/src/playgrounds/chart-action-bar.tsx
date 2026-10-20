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
import React, { ComponentProps, ComponentType, ReactElement } from 'react';

import { ActionButton, Content, Heading, Text } from '@react-spectrum/s2';
import Bookmark from '@react-spectrum/s2/icons/Bookmark';
import Comment from '@react-spectrum/s2/icons/Comment';
import Export from '@react-spectrum/s2/icons/Export';
import Flag from '@react-spectrum/s2/icons/Flag';
import StickyNote from '@react-spectrum/s2/icons/StickyNote';
import {
  Axis,
  ChartInspect,
  ChartPopover,
  Legend,
  Line,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { ChartActionBar } from '@spectrum-charts/react-spectrum-charts-s2/lab';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import { deviceVisitsData } from '../components/examples/data';
import { withSource } from '../components/examples/elementToJsx';

// Charts without a dev dashboard size the plot to 440 x 288, so the chart is 512px wide.
const PLOT_WIDTH = 440;
const PLOT_HEIGHT = 288;
const LEFT_AXIS_WIDTH = 48;
// Room for the last time label, which is centered on the plot's right edge.
const RIGHT_OVERHANG = 24;
const BOTTOM_AXIS_HEIGHT = 48;
const BOTTOM_LEGEND_HEIGHT = 40;

/**
 * Sizes an action bar example so the plot is 440 x 288, leaving room for the axes and legend.
 * @returns preview width and height
 */
const getActionBarPreviewSize = (): PreviewSize => ({
  width: PLOT_WIDTH + LEFT_AXIS_WIDTH + RIGHT_OVERHANG,
  height: PLOT_HEIGHT + BOTTOM_AXIS_HEIGHT + BOTTOM_LEGEND_HEIGHT,
});

type Datum = Record<string, unknown>;
type ActionBarContent = (datum: Datum, close: () => void) => ReactElement[];

interface Action {
  key: string;
  label: string;
  icon: ComponentType;
  iconName: string;
}

const actions: Action[] = [
  { key: 'annotate', label: 'Annotate', icon: StickyNote, iconName: 'StickyNote' },
  { key: 'comment', label: 'Comment', icon: Comment, iconName: 'Comment' },
  { key: 'bookmark', label: 'Bookmark', icon: Bookmark, iconName: 'Bookmark' },
  { key: 'export', label: 'Export', icon: Export, iconName: 'Export' },
  { key: 'flag', label: 'Flag', icon: Flag, iconName: 'Flag' },
];

/**
 * Builds action bar content with the first `count` actions, and its source for the code panel.
 * @param count number of actions
 * @param isEmphasized whether the actions sit on an emphasized bar
 * @returns children function for ChartActionBar
 */
const getActionContent = (count: number, isEmphasized = false): ActionBarContent => {
  const shown = actions.slice(0, count);
  const staticColor = isEmphasized ? ' staticColor="white"' : '';
  const content: ActionBarContent = (_datum, close) =>
    shown.map(({ key, label, icon: Icon }) => (
      <ActionButton key={key} isQuiet staticColor={isEmphasized ? 'white' : undefined} onPress={close}>
        <Icon />
        <Text>{label}</Text>
      </ActionButton>
    ));
  const buttons = shown
    .map(
      ({ key, label, iconName }) =>
        `  <ActionButton key="${key}" isQuiet${staticColor} onPress={close}>\n` +
        `    <${iconName} />\n` +
        `    <Text>${label}</Text>\n` +
        '  </ActionButton>,'
    )
    .join('\n');
  const iconImports = Object.fromEntries(
    shown.map(({ iconName }) => [`@react-spectrum/s2/icons/${iconName}`, iconName])
  );
  return withSource(content, `(datum, close) => [\n${buttons}\n]`, {
    '@react-spectrum/s2': ['ActionButton', 'Text'],
    ...iconImports,
  });
};

const inspectContent = withSource(
  (datum: Datum) => (
    <div>
      {String(datum.device)}: {Number(datum.visits).toLocaleString()} visits
    </div>
  ),
  '(datum) => (\n  <div>\n    {datum.device}: {datum.visits.toLocaleString()} visits\n  </div>\n)'
);

const popoverContent = withSource(
  (datum: Datum) => (
    <>
      <Heading level={4}>{String(datum.device)}</Heading>
      <Content>
        <Text>{Number(datum.visits).toLocaleString()} visits</Text>
      </Content>
    </>
  ),
  '(datum) => (\n  <>\n    <Heading level={4}>{datum.device}</Heading>\n    <Content>\n      <Text>{datum.visits.toLocaleString()} visits</Text>\n    </Content>\n  </>\n)',
  { '@react-spectrum/s2': ['Content', 'Heading', 'Text'] }
);

/**
 * Renders the line chart every action bar example uses.
 * @param children Line children
 * @returns chart element
 */
const renderLineChart = (children: ComponentProps<typeof Line>['children']) => (
  <Chart data={deviceVisitsData}>
    <Axis position="left" grid />
    <Axis position="bottom" baseline labelFormat="time" />
    <Line metric="visits" color="device">
      {children}
    </Line>
    <Legend />
  </Chart>
);

const actionBarControls: PlaygroundControl[] = [
  { name: 'actions', label: 'Actions', doc: 'ChartActionBar.children', type: 'number', min: 1, max: 5, step: 1, defaultValue: 3 },
  { name: 'maxActions', type: 'number', min: 1, max: 5, step: 1, defaultValue: 4 },
  { name: 'isEmphasized', type: 'boolean', defaultValue: false },
];

/**
 * Playground for ChartActionBar props.
 * @returns playground element
 */
export const ChartActionBarPlayground = () => (
  <PropPlayground
    previewSize={getActionBarPreviewSize}
    controls={actionBarControls}
    component="ChartActionBar"
    render={({ actions: count = 3, maxActions, isEmphasized }) =>
      renderLineChart(
        <ChartActionBar
          isEmphasized={isEmphasized as boolean | undefined}
          maxActions={maxActions as number | undefined}
        >
          {getActionContent(Number(count), Boolean(isEmphasized))}
        </ChartActionBar>
      )
    }
  />
);

const overflowControls: PlaygroundControl[] = [
  { name: 'maxActions', type: 'number', min: 1, max: 5, step: 1, defaultValue: 2 },
];

/**
 * Playground for collapsing extra actions into the overflow menu.
 * @returns playground element
 */
export const ChartActionBarOverflowPlayground = () => (
  <PropPlayground
    previewSize={getActionBarPreviewSize}
    controls={overflowControls}
    component="ChartActionBar"
    render={({ maxActions = 2 }) =>
      renderLineChart(
        <ChartActionBar maxActions={maxActions === 4 ? undefined : Number(maxActions)}>
          {getActionContent(actions.length)}
        </ChartActionBar>
      )
    }
  />
);

const emphasizedControls: PlaygroundControl[] = [{ name: 'isEmphasized', type: 'boolean', defaultValue: true }];

/**
 * Playground for the emphasized action bar style.
 * @returns playground element
 */
export const ChartActionBarEmphasizedPlayground = () => (
  <PropPlayground
    previewSize={getActionBarPreviewSize}
    controls={emphasizedControls}
    component="ChartActionBar"
    render={({ isEmphasized = true }) =>
      renderLineChart(
        <ChartActionBar isEmphasized={isEmphasized ? true : undefined}>
          {getActionContent(3, Boolean(isEmphasized))}
        </ChartActionBar>
      )
    }
  />
);

const siblingControls: PlaygroundControl[] = [
  { group: 'ChartInspect', name: 'inspect', label: 'Show', doc: 'ChartInspect', type: 'boolean', defaultValue: true },
  { group: 'ChartPopover', name: 'popover', label: 'Show', doc: 'ChartPopover', type: 'boolean', defaultValue: true },
];

/**
 * Playground for an action bar alongside ChartInspect and a right-click ChartPopover.
 * @returns playground element
 */
export const ChartActionBarSiblingsPlayground = () => (
  <PropPlayground
    previewSize={getActionBarPreviewSize}
    controls={siblingControls}
    render={({ inspect, popover }) =>
      renderLineChart([
        inspect !== false && <ChartInspect key="inspect">{inspectContent}</ChartInspect>,
        popover !== false && (
          <ChartPopover key="popover" rightClick width="auto">
            {popoverContent}
          </ChartPopover>
        ),
        <ChartActionBar key="actionBar">{getActionContent(3)}</ChartActionBar>,
      ])
    }
  />
);
