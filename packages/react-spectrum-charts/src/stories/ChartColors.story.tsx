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
import { Chart } from '@rsc';
import { bindWithProps } from '@test-utils';

import { ChartBarStory } from './ChartBarStory';
import { data } from './data/data';

export default {
	title: 'RSC/Chart/Colors',
	component: Chart,
};

const SpectrumColorNames = bindWithProps(ChartBarStory);
SpectrumColorNames.args = {
	colors: ['gray-800', 'gray-700', 'gray-600', 'gray-500'],
	data,
};

const SpectrumDivergentColorScheme = bindWithProps(ChartBarStory);
SpectrumDivergentColorScheme.args = {
	colors: 'divergentOrangeYellowSeafoam5',
	data,
};

const SpectrumSequentialColorScheme = bindWithProps(ChartBarStory);
SpectrumSequentialColorScheme.args = {
	colors: 'sequentialCerulean5',
	data,
};

const CssColors = bindWithProps(ChartBarStory);
CssColors.args = {
	colors: ['purple', 'rgb(38, 142, 108)', '#0d66d0', 'hsl(32deg, 86%, 46%)'],
	data,
};

export { SpectrumColorNames, SpectrumDivergentColorScheme, SpectrumSequentialColorScheme, CssColors };
