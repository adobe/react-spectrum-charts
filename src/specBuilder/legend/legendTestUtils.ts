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
import {
	COLOR_SCALE,
	DEFAULT_CATEGORICAL_DIMENSION,
	DEFAULT_COLOR,
	DEFAULT_METRIC,
	DEFAULT_OPACITY_RULE,
	FILTERED_TABLE,
	HIGHLIGHTED_SERIES,
	HIGHLIGHT_CONTRAST_RATIO,
	LEGEND_TOOLTIP_DELAY,
} from '@constants';
import { LineMark } from 'vega';

import { LegendSpecProps } from '../../types';

/**
 * Wait for the the duration of the legend tooltip hover delay.
 */
export const waitForLegendTooltip = async () => {
	await new Promise((resolve) => setTimeout(resolve, LEGEND_TOOLTIP_DELAY));
};

/**
 * Tooltips are rendered in a portal, so jest's default cleanup won't remove them.
 * This helper will remove all vega tooltips from the DOM.
 */
export const cleanupTooltips = () => {
	document.body.querySelectorAll('.vg-tooltip').forEach((node) => {
		node.remove();
	});
};

export const opacityEncoding = [
	{ test: `${HIGHLIGHTED_SERIES} && datum.value !== ${HIGHLIGHTED_SERIES}`, value: 1 / HIGHLIGHT_CONTRAST_RATIO },
	DEFAULT_OPACITY_RULE,
];

export const defaultMark: LineMark = {
	name: 'line0',
	type: 'line',
	from: {
		data: FILTERED_TABLE,
	},
	encode: {
		enter: {
			x: { scale: 'x', field: DEFAULT_CATEGORICAL_DIMENSION },
			y: { scale: 'y', field: DEFAULT_METRIC },
			stroke: { scale: COLOR_SCALE, field: DEFAULT_COLOR },
		},
		update: {
			opacity: [],
		},
	},
};

export const defaultLegendProps: LegendSpecProps = {
	colorScheme: 'light',
	hiddenEntries: [],
	hiddenSeries: [],
	highlight: false,
	index: 0,
	isToggleable: false,
	name: 'legend0',
	position: 'bottom',
};
