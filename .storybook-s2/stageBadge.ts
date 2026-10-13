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

// Story tags that mark a component's stage, mapped to the badge label.
const STAGE_LABELS: Record<string, string> = {
  lab: 'Lab',
  alpha: 'Alpha',
  beta: 'Beta',
  rc: 'RC',
};

const badgeStyle = {
  marginLeft: 6,
  padding: '0 5px',
  border: '1px solid currentColor',
  borderRadius: 8,
  fontSize: 10,
  fontWeight: 700,
  lineHeight: '14px',
  opacity: 0.7,
  textTransform: 'uppercase' as const,
};

/**
 * Renders a sidebar label with a stage badge on top-level component folders.
 * @param item
 * @returns label node
 */
export const renderStageLabel = (item: API_HashEntry) => {
  if (item.depth !== 1 || item.type === 'story' || item.type === 'docs') return item.name;
  const stage = Object.keys(STAGE_LABELS).find((tag) => item.tags?.includes(tag));
  if (!stage) return item.name;
  return createElement(
    'span',
    null,
    item.name,
    createElement('span', { style: badgeStyle, title: `${STAGE_LABELS[stage]} component` }, STAGE_LABELS[stage]),
  );
};
