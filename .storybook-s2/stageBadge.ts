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
import { createElement } from 'react';

import { addons, types, useStorybookApi, useStorybookState } from 'storybook/manager-api';
import type { API_HashEntry } from 'storybook/internal/types';

import { STAGE_BADGE_STYLE, getStageLabel } from './stages';

const badge = (label: string) =>
  createElement('span', { style: STAGE_BADGE_STYLE, title: `${label} component` }, label);

/**
 * Renders a sidebar label with a stage badge on top-level component folders.
 * @param item
 * @returns label node
 */
export const renderStageLabel = (item: API_HashEntry) => {
  if (item.depth !== 1 || item.type === 'story' || item.type === 'docs') return item.name;
  const label = getStageLabel(item.tags);
  if (!label) return item.name;
  return createElement('span', null, item.name, createElement('span', { style: { marginLeft: 6 } }, badge(label)));
};

const StageTool = () => {
  const { storyId, refId } = useStorybookState();
  const label = getStageLabel(useStorybookApi().getData(storyId, refId)?.tags);
  if (!label) return null;
  return createElement('span', { style: { display: 'flex', alignItems: 'center', padding: '0 8px' } }, badge(label));
};

addons.register('rsc/stage-badge', () => {
  addons.add('rsc/stage-badge/tool', {
    type: types.TOOL,
    title: 'Component stage',
    match: ({ viewMode }) => viewMode === 'story',
    render: StageTool,
  });
});
