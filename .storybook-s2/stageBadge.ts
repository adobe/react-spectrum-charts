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

import type { API_HashEntry } from 'storybook/internal/types';
import { addons, types, useStorybookApi, useStorybookState } from 'storybook/manager-api';
import { useTheme } from 'storybook/theming';

import { STAGES, getStageBadgeStyle, getStageFromTags } from './stages';

// The manager runs its own React 18, so it can't render S2 components; this mirrors the S2 Badge instead.
const ManagerBadge = ({ stage, compact }: { stage: string; compact?: boolean }) => {
  const { base } = useTheme();
  return createElement(
    'span',
    { style: getStageBadgeStyle(stage, base === 'dark', compact), title: `${STAGES[stage].label} component` },
    STAGES[stage].label
  );
};

/**
 * Renders a sidebar label with a stage badge on top-level component folders.
 * @param item
 * @returns label node
 */
export const renderStageLabel = (item: API_HashEntry) => {
  if (item.depth !== 1 || item.type === 'story' || item.type === 'docs') return item.name;
  const stage = getStageFromTags(item.tags);
  if (!stage) return item.name;
  return createElement(
    'span',
    { style: { display: 'inline-flex', alignItems: 'center', gap: 6 } },
    item.name,
    createElement(ManagerBadge, { stage, compact: true })
  );
};

const StageTool = () => {
  const { storyId, refId } = useStorybookState();
  const stage = getStageFromTags(useStorybookApi().getData(storyId, refId)?.tags);
  if (!stage) return null;
  return createElement(
    'span',
    { style: { display: 'flex', alignItems: 'center', padding: '0 8px' } },
    createElement(ManagerBadge, { stage })
  );
};

addons.register('rsc/stage-badge', () => {
  addons.add('rsc/stage-badge/tool', {
    type: types.TOOL,
    title: 'Component stage',
    match: ({ viewMode }) => viewMode === 'story',
    render: StageTool,
  });
});
