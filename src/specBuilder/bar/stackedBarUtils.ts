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
import { BACKGROUND_COLOR, FILTERED_TABLE, MARK_ID } from '@constants';
import { getInteractive } from '@specBuilder/marks/markUtils';
import { BarSpecProps } from 'types';
import { Mark, RectEncodeEntry, RectMark } from 'vega';

import {
	getAnnotationMarks,
	getBarEnterEncodings,
	getBarUpdateEncodings,
	getBaseBarEnterEncodings,
	getDodgedDimensionEncodings,
	getDodgedGroupMark,
	getOrientationProperties,
	isDodgedAndStacked,
} from './barUtils';
import { getTrellisProperties, isTrellised } from './trellisedBarUtils';
import { getAnimationMarks } from '@specBuilder/specUtils';

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

export const getDodgedAndStackedBarMark = (props: BarSpecProps): Mark => {
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
		from: { data: isDodgedAndStacked(props) ? `${name}_facet` : getBaseDataSourceName(props) },
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
	const { dimension, orientation, previousData, data, animations, animateFromZero, metric } = props;
	if (isDodgedAndStacked(props)) {
		return getDodgedDimensionEncodings(props);
	}

	const { dimensionAxis, rangeScale, dimensionScaleKey, metricScaleKey: scaleKey, metricAxis: startKey } = getOrientationProperties(orientation);

	const endKey = `${startKey}2`;

	return {
		...(animations !== false && animateFromZero && {
			[startKey]: getAnimationMarks(dimension, `${metric}0`, true, data, previousData, scaleKey),
			[endKey]: getAnimationMarks(dimension, `${metric}1`, true, data, previousData, scaleKey)
		}),
		[dimensionAxis]: { scale: dimensionScaleKey, field: dimension },
		[rangeScale]: { scale: dimensionScaleKey, band: 1 },
	};
};

const getBaseDataSourceName = (props: BarSpecProps) => {
	if (isTrellised(props)) return getTrellisProperties(props).facetName;
	return FILTERED_TABLE;
};
