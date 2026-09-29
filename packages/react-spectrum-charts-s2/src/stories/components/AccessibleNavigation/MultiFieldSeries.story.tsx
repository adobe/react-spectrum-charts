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
import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { bindWithProps } from '../../../test-utils';
import {
  FunnelConversion,
  FunnelTimeComparison as FunnelTimeComparisonExample,
  TrendsTimeComparisonBar,
  TrendsTimeComparisonStackedBar,
  UserGrowthTimeComparisonBarGrowth,
} from '../../ChartExamples.story';

export default {
  title: 'React Spectrum Charts 2/Accessible Navigation/Multi-Field Series',
};

/** Renders a Chart Examples story with keyboard navigation on. */
const withNavigation = (Example: StoryFn<typeof Chart>) => {
  const story = bindWithProps<typeof Chart>((args, context) => Example(args, context));
  story.args = { ...Example.args, accessibleNavigation: true } as typeof story.args;
  return story;
};

/** Dodged by `series`, with `period` as a string opacity/lineType: legend entries read "series | period". */
export const TimeComparisonBar = withNavigation(TrendsTimeComparisonBar);

/** Stacked by `series`, dodged by `period` (a two-field opacity array). */
export const TimeComparisonStackedBar = withNavigation(TrendsTimeComparisonStackedBar);

/** Stacked by `series`, dodged by `period`, with negative values. */
export const UserGrowthTimeComparison = withNavigation(UserGrowthTimeComparisonBarGrowth);

/** Dodged by `series`, stacked by `subSeries` (a two-field color array), with hidden legend entries. */
export const FunnelDodgedAndStacked = withNavigation(FunnelConversion);

/** Dodged by `series` and `period`, stacked by `subSeries`. */
export const FunnelTimeComparison = withNavigation(FunnelTimeComparisonExample);
