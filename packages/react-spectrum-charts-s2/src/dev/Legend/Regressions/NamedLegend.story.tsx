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
import { Legend } from '../../../components/index.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { LegendBarStory } from '../Coverage/LegendStoryUtils.js';

export default {
  title: 'React Spectrum Charts 2/Legend/Regressions/Named Legend',
  tags: ['alpha'],
  component: Legend,
};

const NamedLegend = bindWithProps(LegendBarStory);
NamedLegend.args = {
  name: 'Operating System Legend',
  highlight: true,
  descriptions: [
    { seriesName: 'Windows', description: 'Desktop and laptop users on Windows.' },
    { seriesName: 'Mac', description: 'Desktop and laptop users on macOS.' },
    { seriesName: 'Other', description: 'Linux, ChromeOS and unrecognized systems.' },
  ],
};
NamedLegend.parameters = {
  ...NamedLegend.parameters,
  regression: {
    description:
      'A Legend with a name failed to render ("Undefined data set name legend0Aggregate"), and its description tooltips read the wrong scale; the chart should render and hovering an entry should show its description.',
    pr: 1101,
  },
};

export { NamedLegend };
