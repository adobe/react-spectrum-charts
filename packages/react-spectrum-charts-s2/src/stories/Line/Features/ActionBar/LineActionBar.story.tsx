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

import { ActionButton, Content, Dialog, DialogTrigger, Divider, Heading, Item, Menu, MenuTrigger, Text } from '@adobe/react-spectrum';
import Bookmark from '@spectrum-icons/workflow/Bookmark';
import Comment from '@spectrum-icons/workflow/Comment';
import Note from '@spectrum-icons/workflow/Note';
import Export from '@spectrum-icons/workflow/Export';
import Flag from '@spectrum-icons/workflow/Flag';
import Info from '@spectrum-icons/workflow/InfoOutline';
import More from '@spectrum-icons/workflow/More';
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
  <DialogTrigger key="info" type="popover" placement="top">
    <ActionButton isQuiet aria-label="Info">
      <Info />
    </ActionButton>
    <Dialog>
      <Heading>Data point</Heading>
      <Divider />
      <Content>
        <div>Series: {String(datum.series)}</div>
        <div>Value: {String(datum.value)}</div>
        <div>Date: {String(datum.datetime)}</div>
      </Content>
    </Dialog>
  </DialogTrigger>,
  <MenuTrigger key="more">
    <ActionButton isQuiet aria-label="More options">
      <More />
    </ActionButton>
    <Menu onAction={(key) => action('ChartActionBar:more')({ key, datum })}>
      <Item key="copy-link">Copy link</Item>
      <Item key="export">Export data</Item>
      <Item key="share">Share</Item>
      <Item key="delete">Delete</Item>
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
