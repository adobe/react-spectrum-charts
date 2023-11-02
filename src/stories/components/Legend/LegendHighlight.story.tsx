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

import { LegendBarHighlightedSeriesStory, LegendBarStory, defaultProps } from './LegendStoryUtils';

export default {
	title: 'RSC/Legend/Highlight',
	component: Legend,
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for Legend component doc page.',
			},
		},
	},
};

const Basic = LegendBarStory.bind({});
Basic.args = { highlight: true, ...defaultProps };

const Controlled = LegendBarHighlightedSeriesStory.bind({});
Controlled.args = { ...defaultProps };

export { Basic, Controlled };
