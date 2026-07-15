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
import { Legend } from '../../../components';
import { bindWithProps } from '../../../test-utils';
import { LegendBarStory } from './LegendStoryUtils';

export default {
  title: 'React Spectrum Charts/Legend/Features/Align',
  component: Legend,
};

const descriptions = [
  { seriesName: 'Windows', description: 'Most popular operating system, especially in business' },
  { seriesName: 'Mac', description: 'Popular for content creation, home and development' },
  { seriesName: 'Other', description: 'Linux accounts for the majority of "other" operating systems' },
];

const legendLabels = [
  { seriesName: 'Windows', label: 'Custom Windows' },
  { seriesName: 'Mac', label: 'Custom Mac' },
  { seriesName: 'Other', label: 'Custom Other' },
];

const Align = bindWithProps(LegendBarStory);
Align.args = {
  align: 'start',
  descriptions,
  highlight: true,
  legendLabels,
  title: 'Operating system',
};

export { Align };
