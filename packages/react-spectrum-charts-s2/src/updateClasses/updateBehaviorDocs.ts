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
import { UpdateClass, UpdateClassification } from '@spectrum-charts/vega-spec-builder-s2';

import { UpdateClassEntry } from './updateClassRegistry.js';

const CLASS_LABELS: Record<UpdateClass, string> = {
  noop: 'No-op',
  signal: 'Signal',
  data: 'Data',
  size: 'Size',
  rebuild: 'Rebuild',
};

const REBUILD_STATE = 'Hover and selection reset; hidden series and controlled props carry over';

const INTRO = [
  '---',
  'title: Update behavior',
  'description: How a chart applies a change to each prop, from updating the live view to building a new one.',
  '---',
  '',
  "{/* Generated from the update class tables in react-spectrum-charts-s2. Run `yarn docs:update-behavior` to regenerate; don't edit by hand. */}",
  '',
  '# Update behavior',
  '',
  'When a prop changes, the chart compares what it would give Vega with what the live view already has and applies the smallest update that covers the difference. Each prop below lists the update a change to it takes. A change that produces the same chart, such as a new `data` array with identical rows, is a no-op whatever the prop.',
  '',
  '| Update | View | Interaction state | Draw-in |',
  '| --- | --- | --- | --- |',
  '| No-op | Kept; nothing re-renders | Kept | Continues |',
  '| Signal | Kept; signal values change in place | Kept | Continues |',
  '| Data | Kept; table rows change in place | Kept | Continues |',
  '| Size | Kept; the view resizes | Kept | Continues |',
  `| Rebuild | Replaced by a new view | ${REBUILD_STATE} | Continues |`,
  `| Rebuild + replay | Replaced by a new view | ${REBUILD_STATE} | Continues; will replay, since the change makes it a different chart |`,
  '',
  '`onVegaViewReady` fires once per view, so after mount it fires again only on a rebuild.',
  '',
];

const getClassLabel = ({ update, replay }: UpdateClassification): string =>
  replay ? 'Rebuild + replay' : CLASS_LABELS[update];

const getTable = ({ component, lab, table }: UpdateClassEntry): string[] => {
  const heading = lab ? `## ${component} (lab)` : `## ${component}`;
  const rows = Object.entries(table)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([prop, classification]) => `| \`${prop}\` | ${getClassLabel(classification)} |`);
  return [heading, '', '| Prop | Update |', '| --- | --- |', ...rows, ''];
};

/**
 * Gets the Update behavior docs page.
 * @param registry - components and their update class tables
 * @returns MDX page
 */
export const getUpdateBehaviorDocs = (registry: UpdateClassEntry[]): string =>
  [...INTRO, ...registry.flatMap(getTable)].join('\n');
