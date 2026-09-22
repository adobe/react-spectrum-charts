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
import { ReactElement } from 'react';

import { ActionButton, Content, ContextualHelp, Heading, Menu, MenuItem, MenuTrigger, Text } from '@react-spectrum/s2';
import Bookmark from '@react-spectrum/s2/icons/Bookmark';
import Comment from '@react-spectrum/s2/icons/Comment';
import Note from '@react-spectrum/s2/icons/StickyNote';
import Export from '@react-spectrum/s2/icons/Export';
import Flag from '@react-spectrum/s2/icons/Flag';
import Info from '@react-spectrum/s2/icons/InfoCircle';
import More from '@react-spectrum/s2/icons/More';
import { action } from '@storybook/addon-actions';
import { StoryFn } from '@storybook/react';

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../../Chart';
import { Axis, ChartActionBar, Line } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { workspaceTrendsDataWithVisiblePoints } from '../../../../stories/data/data';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features/ActionBar',
  component: Line,
};

const defaultChartProps: ChartProps = {
  data: workspaceTrendsDataWithVisiblePoints,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
};

const defaultArgs = {
  color: 'series',
  dimension: 'datetime',
  metric: 'value',
  name: 'line0',
  scaleType: 'time' as const,
  staticPoint: 'staticPoint',
};

const LineWithActionBarStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" />
      <Axis position="left" />
      <Line {...args} />
    </Chart>
  );
};

const actionBarContent = (datum: Datum, close: () => void): ReactElement[] => [
  <ActionButton
    key="annotate"
    isQuiet
    onPress={() => {
      action('ChartActionBar:annotate')(datum);
      close();
    }}
  >
    <Note />
    <Text>Annotate</Text>
  </ActionButton>,
  <ActionButton
    key="comment"
    isQuiet
    onPress={() => {
      action('ChartActionBar:comment')(datum);
      close();
    }}
  >
    <Comment />
    <Text>Comment</Text>
  </ActionButton>,
  <ContextualHelp key="info" variant="info" placement="top">
    <Heading>Data point</Heading>
    <Content>
      <div>Series: {String(datum.series)}</div>
      <div>Value: {String(datum.value)}</div>
      <div>Date: {String(datum.datetime)}</div>
    </Content>
  </ContextualHelp>,
  <MenuTrigger key="more">
    <ActionButton isQuiet aria-label="More options">
      <More />
    </ActionButton>
    <Menu onAction={(key) => action('ChartActionBar:more')({ key, datum })}>
      <MenuItem id="copy-link">Copy link</MenuItem>
      <MenuItem id="export">Export data</MenuItem>
      <MenuItem id="share">Share</MenuItem>
      <MenuItem id="delete">Delete</MenuItem>
    </Menu>
  </MenuTrigger>,
];

const WithActionBar = bindWithProps(LineWithActionBarStory);
WithActionBar.args = {
  ...defaultArgs,
  children: (
    <ChartActionBar onClearSelection={action('ChartActionBar:onClearSelection')}>
      {actionBarContent}
    </ChartActionBar>
  ),
};

const emphasizedActionBarContent = (datum: Datum, close: () => void): ReactElement[] => [
  <ActionButton
    key="annotate"
    isQuiet
    staticColor="white"
    onPress={() => {
      action('ChartActionBar:annotate')(datum);
      close();
    }}
  >
    <Note />
    <Text>Annotate</Text>
  </ActionButton>,
  <ActionButton
    key="comment"
    isQuiet
    staticColor="white"
    onPress={() => {
      action('ChartActionBar:comment')(datum);
      close();
    }}
  >
    <Comment />
    <Text>Comment</Text>
  </ActionButton>,
  <ActionButton key="info" isQuiet staticColor="white" aria-label="Info">
    <Info />
  </ActionButton>,
];

const WithEmphasized = bindWithProps(LineWithActionBarStory);
WithEmphasized.args = {
  ...defaultArgs,
  children: (
    <ChartActionBar isEmphasized onClearSelection={action('ChartActionBar:onClearSelection')}>
      {emphasizedActionBarContent}
    </ChartActionBar>
  ),
};

const fewActionsContent = (datum: Datum, close: () => void): ReactElement[] => [
  <ActionButton key="annotate" isQuiet onPress={() => { action('ChartActionBar:annotate')(datum); close(); }}>
    <Note />
    <Text>Annotate</Text>
  </ActionButton>,
  <ActionButton key="comment" isQuiet onPress={() => { action('ChartActionBar:comment')(datum); close(); }}>
    <Comment />
    <Text>Comment</Text>
  </ActionButton>,
  <ActionButton key="bookmark" isQuiet onPress={() => { action('ChartActionBar:bookmark')(datum); close(); }}>
    <Bookmark />
    <Text>Bookmark</Text>
  </ActionButton>,
];

const WithFewActions = bindWithProps(LineWithActionBarStory);
WithFewActions.args = {
  ...defaultArgs,
  children: (
    <ChartActionBar onClearSelection={action('ChartActionBar:onClearSelection')}>
      {fewActionsContent}
    </ChartActionBar>
  ),
};

const overflowActionsContent = (datum: Datum, close: () => void): ReactElement[] => [
  <ActionButton key="annotate" isQuiet onPress={() => { action('ChartActionBar:annotate')(datum); close(); }}>
    <Note />
    <Text>Add annotation to data point</Text>
  </ActionButton>,
  <ActionButton key="comment" isQuiet onPress={() => { action('ChartActionBar:comment')(datum); close(); }}>
    <Comment />
    <Text>Leave a comment here</Text>
  </ActionButton>,
  <ActionButton key="bookmark" isQuiet onPress={() => { action('ChartActionBar:bookmark')(datum); close(); }}>
    <Bookmark />
    <Text>Save to bookmarks</Text>
  </ActionButton>,
  <ActionButton key="export" isQuiet onPress={() => { action('ChartActionBar:export')(datum); close(); }}>
    <Export />
    <Text>Export data point</Text>
  </ActionButton>,
  <ActionButton key="flag" isQuiet onPress={() => { action('ChartActionBar:flag')(datum); close(); }}>
    <Flag />
    <Text>Flag for review</Text>
  </ActionButton>,
];

const WithOverflow = bindWithProps(LineWithActionBarStory);
WithOverflow.args = {
  ...defaultArgs,
  children: (
    <ChartActionBar onClearSelection={action('ChartActionBar:onClearSelection')}>
      {overflowActionsContent}
    </ChartActionBar>
  ),
};

export { WithActionBar, WithEmphasized, WithFewActions, WithOverflow };
