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
import { LegendDescription, LegendLabel } from '@spectrum-charts/vega-spec-builder-s2';

import { Legend } from '../../../../components/index.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { TrafficStory, controls } from '../legendStoryTemplates.js';

export default {
  title: 'React Spectrum Charts 2/Legend/Features/Labels',
  component: Legend,
  argTypes: {
    labelLimit: { control: { type: 'range', min: 40, max: 200, step: 10 } },
    titleLimit: { control: { type: 'range', min: 40, max: 300, step: 10 } },
  },
};

const legendLabels: LegendLabel[] = [
  { seriesName: 'Organic search', label: 'SEO' },
  { seriesName: 'Paid search', label: 'SEM' },
  { seriesName: 'Social', label: 'Social media' },
  { seriesName: 'Email', label: 'Newsletters' },
  { seriesName: 'Referral', label: 'Partner sites' },
];

const descriptions: LegendDescription[] = [
  { seriesName: 'Organic search', description: 'Unpaid visits from search engine results' },
  { seriesName: 'Paid search', description: 'Visits from sponsored search ads' },
  { seriesName: 'Social', description: 'Visits from social network posts and ads' },
  { seriesName: 'Email', description: 'Visits from marketing email campaigns' },
  { seriesName: 'Referral', description: 'Visits from links on partner websites' },
];

const Title = bindWithProps(TrafficStory);
Title.args = { title: 'Traffic source' };
Object.assign(Title, controls('title'));

const TitleLimit = bindWithProps(TrafficStory);
TitleLimit.args = { title: 'Traffic source (last touch attribution, all devices)', titleLimit: 180 };
Object.assign(TitleLimit, controls('titleLimit'));

const LegendLabels = bindWithProps(TrafficStory);
LegendLabels.args = { legendLabels };
Object.assign(LegendLabels, controls('legendLabels'));

const LabelLimit = bindWithProps(TrafficStory);
LabelLimit.args = { labelLimit: 60 };
Object.assign(LabelLimit, controls('labelLimit'));

// Hover a legend entry to see its description.
const Descriptions = bindWithProps(TrafficStory);
Descriptions.args = { descriptions };
Object.assign(Descriptions, controls('descriptions'));

export { Title, TitleLimit, LegendLabels, LabelLimit, Descriptions };
