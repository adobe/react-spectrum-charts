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

import { getInteractive } from '@specBuilder/marks/markUtils';
import { BarSpecProps } from 'types';
import { Mark, RectEncodeEntry, RectMark } from 'vega';

import {
	getAnnotationMarks,
	getBarEnterEncodings,
	getBarUpdateEncodings,
	getBaseBarEnterEncodings,
	getDodgedGroupMark,
	getDodgedDimensionEncodings,
	isDodgedAndStacked,
	getOrientationProperties,
} from './barUtils';
import { TABLE } from '@constants';
import { getTrellisProperties, isTrellised } from './trellisedBarUtils';

export const getStackedBarMarks = (props: BarSpecProps): Mark[] => {
	const marks: Mark[] = [];
	// add background marks
	// these marks make it so that when the opacity of a bar is lowered (like on hover), you can't see the grid lines behind the bars
	marks.push(getStackedBackgroundBar(props));

	// bar mark
	marks.push(getStackedBar(props));

	// add annotation marks
	marks.push(
		...getAnnotationMarks(
			props,
			getBaseDataSourceName(props),
			getOrientationProperties(props).dimensionScaleKey,
			props.dimension,
		),
	);

	return marks;
};

export const getDodgedAndStackedBarMark = (props: BarSpecProps): Mark => {
	const marks: Mark[] = [];
	// add background marks
	marks.push(getStackedBackgroundBar(props));

	// bar mark
	marks.push(getStackedBar(props));

	// add annotation marks
	marks.push(...getAnnotationMarks(props, `${props.name}Facet`, `${props.name}Position`, `${props.name}DodgeGroup`));

	return { ...getDodgedGroupMark(props), marks };
};

export const getStackedBackgroundBar = (props: BarSpecProps): RectMark => {
	const { name } = props;

	return {
		name: `${name}Background`,
		type: 'rect',
		from: { data: isDodgedAndStacked(props) ? `${name}Facet` : getBaseDataSourceName(props) },
		interactive: false,
		encode: {
			enter: {
				...getBaseBarEnterEncodings(props),
				fill: { signal: 'backgroundColor' },
			},
			update: {
				...getStackedDimensionEncodings(props),
			},
		},
	};
};

export const getStackedBar = (props: BarSpecProps): RectMark => {
	const { children, name } = props;
	return {
		name,
		type: 'rect',
		from: { data: isDodgedAndStacked(props) ? `${name}Facet` : getBaseDataSourceName(props) },
		interactive: getInteractive(children),
		encode: {
			enter: {
				...getBaseBarEnterEncodings(props),
				...getBarEnterEncodings(props),
			},
			update: {
				...getStackedDimensionEncodings(props),
				...getBarUpdateEncodings(props),
			},
		},
	};
};

export const getStackedDimensionEncodings = (props: BarSpecProps): RectEncodeEntry => {
	const { dimension } = props;
	if (isDodgedAndStacked(props)) {
		return getDodgedDimensionEncodings(props);
	}

	const { dimensionAxis, rangeScale, dimensionScaleKey } = getOrientationProperties(props);

	return {
		[dimensionAxis]: { scale: dimensionScaleKey, field: dimension },
		[rangeScale]: { scale: dimensionScaleKey, band: 1 },
	};
};

const getBaseDataSourceName = (props: BarSpecProps) => {
	if (isTrellised(props)) return getTrellisProperties(props).facetName;
	return TABLE;
};
