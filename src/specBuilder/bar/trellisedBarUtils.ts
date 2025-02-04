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
import { FILTERED_TABLE } from '@constants';
import { addDomainFields, getScaleIndexByName } from '@specBuilder/scale/scaleSpecBuilder';
import { GroupMark, Mark, Scale } from 'vega';

import { BarSpecOptions } from '../../types';
import { getDodgedDimensionEncodings, getTrellisedDimensionEncodings, isDodgedAndStacked } from './barUtils';

/**
 * Generates the trellis group mark
 * @param options
 * @param marks visualization marks (bar, line, etc)
 * @param repeatedScale this is the scale that is repeated for each trellis, for example: y scale for vertical trellis, x scale for horizontal trellis
 * @returns
 */
export const getTrellisGroupMark = (options: BarSpecOptions, marks: Mark[], repeatedScale: Scale): GroupMark => {
	const { trellisOrientation } = options;
	const trellis = options.trellis as string;
	const {
		markName,
		facetName,
		scaleName,
		axis: trellisAxis,
		rangeScale: trellisRangeScale,
	} = getTrellisProperties(options);

	return {
		name: markName,
		type: 'group',

		// Define data source for this trellis
		from: {
			facet: {
				data: FILTERED_TABLE,
				name: facetName,
				groupby: trellis,
			},
		},

		// Override the default 'height' or 'width' signal with the trellis scale bandwidth
		signals: [{ name: trellisRangeScale, update: `bandwidth('${scaleName}')` }],

		// Encode the trellis on its axis
		encode: {
			enter: {
				[trellisAxis]: { scale: scaleName, field: trellis },
				height: { signal: trellisOrientation === 'vertical' ? `bandwidth('${scaleName}')` : 'height' },
				width: { signal: trellisOrientation === 'horizontal' ? `bandwidth('${scaleName}')` : 'width' },
			},
		},

		scales: [repeatedScale],
		marks,
	};
};

export const addTrellisScale = (scales: Scale[], options: BarSpecOptions) => {
	if (!options.trellis) {
		return;
	}
	const { scaleName, rangeScale, paddingInner } = getTrellisProperties(options);
	const trellisScaleIndex = getScaleIndexByName(scales, scaleName, 'band');
	scales[trellisScaleIndex] = addDomainFields(scales[trellisScaleIndex], [options.trellis]);
	scales[trellisScaleIndex] = {
		...scales[trellisScaleIndex],
		range: rangeScale,
		paddingInner,
	} as Scale;
};

export const getTrellisedEncodeEntries = (options: BarSpecOptions) => {
	if (options.type === 'dodged' || isDodgedAndStacked(options)) {
		return getDodgedDimensionEncodings(options);
	}

	return getTrellisedDimensionEncodings(options);
};

export interface BarTrellisProperties {
	facetName: string;
	scaleName: 'xTrellisBand' | 'yTrellisBand';
	markName: 'xTrellisGroup' | 'yTrellisGroup';
	rangeScale: 'width' | 'height';
	axis: 'x' | 'y';
	paddingInner: number;
}

export const getTrellisProperties = ({
	trellisOrientation,
	name,
	trellisPadding,
}: BarSpecOptions): BarTrellisProperties => {
	const axis = trellisOrientation === 'horizontal' ? 'x' : 'y';

	return {
		facetName: `${name}_trellis`,
		scaleName: `${axis}TrellisBand`,
		markName: `${axis}TrellisGroup`,
		rangeScale: axis === 'x' ? 'width' : 'height',
		axis,
		paddingInner: trellisPadding,
	};
};

export const isTrellised = (options: BarSpecOptions) => Boolean(options.trellis);
