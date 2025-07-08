/*
 * Copyright 2025 Adobe. All rights reserved.
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
    {
      type: 'category',
      label: 'Getting Started',
      items: ['intro', 'installation'],
    },
    {
      type: 'category',
      label: 'Guides',
      items: ['guides/chart-basics', 'guides/troubleshooting'],
    },
    {
      type: 'category',
      label: 'API Reference',
      collapsed: false,
      items: [
        'api/Chart',
        {
          type: 'category',
          label: 'Core Visualizations',
          collapsed: false,
          items: [
            'api/visualizations/Area',
            'api/visualizations/Bar',
            'api/visualizations/BigNumber',
            'api/visualizations/Donut',
            'api/visualizations/Line',
            'api/visualizations/Scatter',
          ],
        },
        {
          type: 'category',
          label: 'Analysis',
          items: ['api/analysis/MetricRange', 'api/analysis/Trendline'],
        },
        {
          type: 'category',
          label: 'Chart Components',
          items: ['api/components/Axis', 'api/components/Legend', 'api/components/Title'],
        },
        {
          type: 'category',
          label: 'Interactivity',
          items: ['api/interactivity/ChartTooltip', 'api/interactivity/ChartPopover'],
        },
      ],
    },
    {
      type: 'category',
      label: 'For Developers',
      items: ['developers/DeveloperDocs', 'developers/LearningVega'],
    },
  ],
};

export default sidebars;
