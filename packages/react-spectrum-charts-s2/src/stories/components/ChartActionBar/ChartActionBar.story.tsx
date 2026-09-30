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
import Export from '@react-spectrum/s2/icons/Export';
import Flag from '@react-spectrum/s2/icons/Flag';
import Info from '@react-spectrum/s2/icons/InfoCircle';
import More from '@react-spectrum/s2/icons/More';
import Note from '@react-spectrum/s2/icons/StickyNote';
import { action } from 'storybook/actions';

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { ChartActionBar } from '../../../components';
import { bindWithProps } from '../../../test-utils';
import { ActionBarLineStory, actionButton } from './ChartActionBarStoryUtils';

type StoryWithParameters = { parameters?: { controls: { include: string[] } } };

const setControlInclude = (story: StoryWithParameters, include: string[]) => {
  story.parameters = { controls: { include } };
};

export default {
  title: 'React Spectrum Charts 2/Chart Action Bar/Features',
  component: ChartActionBar,
  argTypes: {
    children: {
      description: '`(datum: Datum, close: () => void) => ReactElement[]`',
      control: { type: null },
    },
  },
};

const actionBarContent = (datum: Datum, close: () => void): ReactElement[] => [
  actionButton('annotate', 'Annotate', <Note />, datum, close),
  actionButton('comment', 'Comment', <Comment />, datum, close),
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

const overflowActionsContent = (datum: Datum, close: () => void): ReactElement[] => [
  actionButton('annotate', 'Annotate', <Note />, datum, close),
  actionButton('comment', 'Comment', <Comment />, datum, close),
  actionButton('bookmark', 'Bookmark', <Bookmark />, datum, close),
  actionButton('export', 'Export', <Export />, datum, close),
  actionButton('flag', 'Flag', <Flag />, datum, close),
];

// Click a point to open the action bar.
const Basic = bindWithProps(ActionBarLineStory);
Basic.args = { children: actionBarContent };
setControlInclude(Basic as StoryWithParameters, []);

const IsEmphasized = bindWithProps(ActionBarLineStory);
IsEmphasized.args = { children: emphasizedActionBarContent, isEmphasized: true };
setControlInclude(IsEmphasized as StoryWithParameters, ['isEmphasized']);

// Actions beyond maxActions collapse into the "More actions" overflow menu.
const MaxActions = bindWithProps(ActionBarLineStory);
MaxActions.args = { children: overflowActionsContent, maxActions: 3 };
setControlInclude(MaxActions as StoryWithParameters, ['maxActions']);

// Fires when the bar closes and the point selection is cleared.
const OnClearSelection = bindWithProps(ActionBarLineStory);
OnClearSelection.args = { children: actionBarContent, onClearSelection: action('onClearSelection') };
setControlInclude(OnClearSelection as StoryWithParameters, []);

export { Basic, IsEmphasized, MaxActions, OnClearSelection };
