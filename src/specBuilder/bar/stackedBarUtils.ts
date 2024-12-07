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
import { BACKGROUND_COLOR, FILTERED_TABLE } from '@constants';
import { getInteractive } from '@specBuilder/marks/markUtils';
import { GroupMark, Mark, RectEncodeEntry, RectMark } from 'vega';

import { BarSpecProps } from '../../types';
import { getAnnotationMarks } from './barAnnotationUtils';
import {
	getBarEnterEncodings,
	getBarUpdateEncodings,
	getBaseBarEnterEncodings,
	getDodgedDimensionEncodings,
	getDodgedGroupMark,
	getOrientationProperties,
	isDodgedAndStacked,
} from './barUtils';
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
			getOrientationProperties(props.orientation).dimensionScaleKey,
			props.dimension
		)
	);

	return marks;
};

export const getDodgedAndStackedBarMark = (props: BarSpecProps): GroupMark => {
	const marks: Mark[] = [];
	// add background marks
	marks.push(getStackedBackgroundBar(props));

	// bar mark
	marks.push(getStackedBar(props));

	// add annotation marks
	marks.push(
		...getAnnotationMarks(props, `${props.name}_facet`, `${props.name}_position`, `${props.name}_dodgeGroup`)
	);

	return { ...getDodgedGroupMark(props), marks };
};

export const getStackedBackgroundBar = (props: BarSpecProps): RectMark => {
	const { name } = props;

	return {
		name: `${name}_background`,
		type: 'rect',
		description: 'test background bar group',
		from: { data: isDodgedAndStacked(props) ? `${name}_facet` : getBaseDataSourceName(props) },
		interactive: false,
		encode: {
			enter: {
				...getBaseBarEnterEncodings(props),
				fill: { signal: BACKGROUND_COLOR },
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
		description: 'test bar group',
		from: { data: isDodgedAndStacked(props) ? `${name}_facet` : getBaseDataSourceName(props) },
		interactive: getInteractive(children, props),
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
	const { dimension, orientation } = props;
	if (isDodgedAndStacked(props)) {
		return getDodgedDimensionEncodings(props);
	}

	const { dimensionAxis, rangeScale, dimensionScaleKey } = getOrientationProperties(orientation);

	return {
		[dimensionAxis]: { scale: dimensionScaleKey, field: dimension },
		[rangeScale]: { scale: dimensionScaleKey, band: 1 },
	};
};

const getBaseDataSourceName = (props: BarSpecProps) => {
	if (isTrellised(props)) return getTrellisProperties(props).facetName;
	return FILTERED_TABLE;
};
