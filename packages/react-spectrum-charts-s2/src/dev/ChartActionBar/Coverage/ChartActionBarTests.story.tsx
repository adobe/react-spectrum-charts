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

import Bookmark from '@react-spectrum/s2/icons/Bookmark';
import Comment from '@react-spectrum/s2/icons/Comment';
import Note from '@react-spectrum/s2/icons/StickyNote';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { ChartActionBar } from '../../../components/index.js';
import {
  ActionBarLineStory,
  actionButton,
} from '../../../storyShared/components/ChartActionBar/chartActionBarStoryShared.js';
import { bindWithProps } from '../../../test-utils/index.js';

export default {
  title: 'React Spectrum Charts 2/Chart Action Bar/Coverage',
  component: ChartActionBar,
};

const fewActionsContent = (datum: Datum, close: () => void): ReactElement[] => [
  actionButton('annotate', 'Annotate', <Note />, datum, close),
  actionButton('comment', 'Comment', <Comment />, datum, close),
  actionButton('bookmark', 'Bookmark', <Bookmark />, datum, close),
];

// Three actions stay under the default maxActions of 4, so no overflow menu renders.
const FewActions = bindWithProps(ActionBarLineStory);
FewActions.args = { children: fewActionsContent };

export { FewActions };
