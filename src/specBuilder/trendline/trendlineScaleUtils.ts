/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { FILTERED_TABLE, LINEAR_PADDING } from '@constants';
import { hasPopover, hasTooltip } from '@specBuilder/marks/markUtils';
import { addRscAnimationScales, hasScaleByName } from '@specBuilder/scale/scaleSpecBuilder';
import { Scale } from 'vega';

import { TrendlineParentProps, getTrendlines, hasTrendlineWithNormalizedDimension } from './trendlineUtils';

/**
 * Gets all the scales used for trendlines
 * @param props
 * @returns Scale[]
 */
export const getTrendlineScales = (props: TrendlineParentProps): Scale[] => {
	const { dimension } = props;
	// if there is a trendline that requires a normalized dimension, add the scale
	if (hasTrendlineWithNormalizedDimension(props)) {
		return [
			{
				name: 'xTrendline',
				type: 'linear',
				range: 'width',
				domain: { data: FILTERED_TABLE, fields: [`${dimension}Normalized`] },
				padding: LINEAR_PADDING,
				zero: false,
				nice: false,
			},
		];
	}
	return [];
};

/**
 * Adds scales to spec if the scales are not already present and if trend lines have a highlighting enabled.
 * @param name
 * @param scales
 * @param props
 */
//TODO: Add tests
export const checkTrendlineAnimationScales = (name: string, scales: Scale[], props: TrendlineParentProps) => {
	if (
		!hasScaleByName(scales, 'rscAnimationCurve') &&
		getTrendlines(props).some((trendline) => hasTooltip(trendline.children) || hasPopover(trendline.children))
	) {
		addRscAnimationScales(scales);
	}
};
