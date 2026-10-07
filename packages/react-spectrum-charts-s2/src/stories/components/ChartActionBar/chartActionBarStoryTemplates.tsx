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

import { action } from 'storybook/actions';

import { ActionButton, Content, ContextualHelp, Heading, Menu, MenuItem, MenuTrigger } from '@react-spectrum/s2';
import Comment from '@react-spectrum/s2/icons/Comment';
import More from '@react-spectrum/s2/icons/More';
import Note from '@react-spectrum/s2/icons/StickyNote';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { actionButton } from '../../../storyShared/components/ChartActionBar/chartActionBarStoryShared';

export type StoryWithParameters = { parameters?: { controls: { include: string[] } } };

export const setControlInclude = (story: StoryWithParameters, include: string[]) => {
  story.parameters = { controls: { include } };
};

export const actionBarContent = (datum: Datum, close: () => void): ReactElement[] => [
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
