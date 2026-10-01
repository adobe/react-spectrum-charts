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
import { Chart } from '../../../../index';
import {
  FunnelTimeComparisonStory,
  TrendsTimeComparisonLineStory,
  TrendsTimeComparisonStackedBarStory,
  UserGrowthBarTimeComparisonStory,
  funnelColors,
  userGrowthColors,
} from '../../../../storyShared/ChartExamples/ChartExamplesUtils';
import { funnelConversionTimeComparisonData, userGrowthTimeComparisonData } from '../../../../storyShared/data/data';
import { trendsTimeComparisonData } from '../../../../storyShared/data/trendsTimeComparisonData';
import { bindWithProps } from '../../../../test-utils';

export default {
  title: 'React Spectrum Charts 2/Chart/Tests/Time Comparison',
  component: Chart,
};

const UserGrowthBar = bindWithProps(UserGrowthBarTimeComparisonStory);
UserGrowthBar.args = {
  data: userGrowthTimeComparisonData,
  colors: userGrowthColors,
  height: 500,
  minWidth: 600,
  maxWidth: 1600,
  width: 'auto',
  lineTypes: [['shortDash', 'solid']],
  opacities: [[0.5, 1]],
};

const FunnelBar = bindWithProps(FunnelTimeComparisonStory);
FunnelBar.args = {
  data: funnelConversionTimeComparisonData,
  colors: funnelColors,
  height: 500,
  minWidth: 840,
  width: 'auto',
  lineTypes: ['shortDash', 'solid'],
  opacities: [0.5, 1],
};

const TrendsStackedBar = bindWithProps(TrendsTimeComparisonStackedBarStory);
TrendsStackedBar.args = {
  data: trendsTimeComparisonData,
  height: 500,
  minWidth: 840,
  width: 'auto',
  lineTypes: ['shortDash', 'solid'],
  opacities: [0.5, 1],
};

const TrendsLine = bindWithProps(TrendsTimeComparisonLineStory);
TrendsLine.args = {
  data: trendsTimeComparisonData,
  height: 500,
  minWidth: 840,
  width: 'auto',
  lineTypes: ['shortDash', 'solid'],
  opacities: [0.5, 1],
};

export { UserGrowthBar, FunnelBar, TrendsStackedBar, TrendsLine };
