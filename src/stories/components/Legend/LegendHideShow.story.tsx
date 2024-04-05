/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Legend } from '@rsc';

import { LegendBarHiddenSeriesStory, LegendBarStory, defaultProps } from './LegendStoryUtils';

export default {
	title: 'RSC/Legend/Hide Show',
	component: Legend,
};

const DefaultHiddenSeries = LegendBarStory.bind({});
DefaultHiddenSeries.args = {
	defaultHiddenSeries: ['Other'],
	isToggleable: true,
	highlight: true,
	...defaultProps,
};
DefaultHiddenSeries.storyName = 'Default Hidden Series (uncontrolled)';

const HiddenSeries = LegendBarHiddenSeriesStory.bind({});
HiddenSeries.args = { highlight: true, ...defaultProps };
HiddenSeries.storyName = 'Hidden Series (controlled)';

const IsToggleable = LegendBarStory.bind({});
IsToggleable.args = { isToggleable: true, highlight: true, ...defaultProps };
IsToggleable.storyName = 'Is Toggleable (uncontrolled)';

export { DefaultHiddenSeries, HiddenSeries, IsToggleable };
