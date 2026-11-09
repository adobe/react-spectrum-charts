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
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  sidebar: [
    'overview',
    'chart',
    {
      type: 'category',
      label: 'Charts',
      collapsed: false,
      items: ['line', 'bar', 'donut'],
    },
    {
      type: 'category',
      label: 'Lab charts',
      collapsed: false,
      items: ['area', 'bullet', 'combo', 'scatter'],
    },
    {
      type: 'category',
      label: 'Components',
      collapsed: false,
      items: ['axis', 'legend', 'title', 'interaction', 'chart-action-bar'],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/getting-started',
        'guides/data',
        'guides/sizing',
        'guides/colors-and-theming',
        'guides/color-palettes',
        'guides/localization',
        'guides/interactivity',
        'guides/animation',
        'guides/accessibility',
        'guides/exporting',
        'guides/testing-and-troubleshooting',
        'guides/stages-and-lab',
      ],
    },
    {
      type: 'category',
      label: 'Release notes',
      collapsed: false,
      items: ['release-notes/0-11-0', 'release-notes/0-10-0'],
    },
    {
      type: 'category',
      label: 'Migration',
      collapsed: false,
      items: ['guides/migrating-from-s1', 'guides/upgrading'],
    },
  ],
};

export default sidebars;
