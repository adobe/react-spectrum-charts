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
	DEFAULT_COLOR_SCHEME,
	DEFAULT_METRIC, FILTERED_PREVIOUS_TABLE,
	FILTERED_TABLE,
	LINE_TYPE_SCALE,
	OPACITY_SCALE,
	PADDING_RATIO,
	STACK_ID,
	TRELLIS_PADDING
} from '@constants';
import { getTransformSort } from '@specBuilder/data/dataUtils';
import { hasInteractiveChildren } from '@specBuilder/marks/markUtils';
import {
	addDomainFields,
	addFieldToFacetScaleDomain,
	addMetricScale,
	getDefaultScale,
	getMetricScale,
	getScaleIndexByName,
	getScaleIndexByType,
	addRSCAnimationScales,
} from '@specBuilder/scale/scaleSpecBuilder';
import { addHighlightedItemSignalEvents, getGenericSignal, getRSCAnimationSignals } from '@specBuilder/signal/signalSpecBuilder';
import { getFacetsFromProps } from '@specBuilder/specUtils';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { BarProps, BarSpecProps, ChartData, ColorScheme } from 'types';
import {
	BandScale,
	Data,
	FormulaTransform,
	Mark,
	OrdinalScale,
	Scale,
	Signal,
	Spec,
	Transforms
} from 'vega';

import { getBarPadding, getScaleValues, isDodgedAndStacked } from './barUtils';
import { getDodgedMark } from './dodgedBarUtils';
import { getDodgedAndStackedBarMark, getStackedBarMarks } from './stackedBarUtils';
import { addTrellisScale, getTrellisGroupMark, isTrellised } from './trellisedBarUtils';

export const addBar = produce<Spec, [BarProps & { colorScheme?: ColorScheme; index?: number, data?: ChartData[], previousData?: ChartData[], animations?: boolean }]>(
	(
		spec,
		{
			children,
			color = { value: 'categorical-100' },
			colorScheme = DEFAULT_COLOR_SCHEME,
			dimension = DEFAULT_CATEGORICAL_DIMENSION,
			index = 0,
			lineType = { value: 'solid' },
			lineWidth = 0,
			metric = DEFAULT_METRIC,
			name,
			opacity = { value: 1 },
			orientation = 'vertical',
			paddingRatio = PADDING_RATIO,
			trellisOrientation = 'horizontal',
			trellisPadding = TRELLIS_PADDING,
			type = 'stacked',
			...props
		}
	) => {
		// put props back together now that all defaults are set
		const barProps: BarSpecProps = {
			children: sanitizeMarkChildren(children),
			orientation,
			color,
			colorScheme,
			dimension,
			index,
			lineType,
			lineWidth,
			metric,
			name: toCamelCase(name || `bar${index}`),
			opacity,
			paddingRatio,
			trellisOrientation,
			trellisPadding,
			type,
			...props,
		};
		spec.data = addData(spec.data ?? [], barProps);
		spec.signals = addSignals(spec.signals ?? [], barProps);
		spec.scales = addScales(spec.scales ?? [], barProps);
		spec.marks = addMarks(spec.marks ?? [], barProps);
	}
);

export const addSignals = produce<Signal[], [BarSpecProps]>(
	(signals, { children, name, paddingRatio, paddingOuter: barPaddingOuter, animations }) => {
		// We use this value to calculate ReferenceLine positions.
		const { paddingInner } = getBarPadding(paddingRatio, barPaddingOuter);
		signals.push(getGenericSignal('paddingInner', paddingInner));

		if (!children.length) {
			return;
		}
		//TODO: add comments
		if (animations == true && hasInteractiveChildren(children)) {
			signals.push(...getRSCAnimationSignals(name));
		}
		addHighlightedItemSignalEvents(signals, name);
	}
);

export const addData = produce<Data[], [BarSpecProps]>((data, props) => {
	const { metric, order, type } = props;

	const filteredIndex = data.findIndex((d) => d.name === FILTERED_TABLE);
	const filteredPreviousIndex = data.findIndex((d) => d.name === FILTERED_PREVIOUS_TABLE);

	data[filteredIndex].transform = data[filteredIndex].transform ?? [];
	data[filteredPreviousIndex].transform = data[filteredPreviousIndex].transform ?? [];
	if (type === 'stacked' || isDodgedAndStacked(props)) {
		const stackedDataGroup: Transforms = {
			type: 'stack',
			groupby: getStackFields(props),
			field: metric,
			sort: getTransformSort(order),
			as: [`${metric}0`, `${metric}1`],
		};

		data[filteredIndex].transform?.push(stackedDataGroup);
		data[filteredPreviousIndex].transform?.push(stackedDataGroup);

		data[filteredIndex].transform?.push(getStackIdTransform(props));
		data[filteredPreviousIndex].transform?.push(getStackIdTransform(props));

		data.push(getStackAggregateData(props));
	}
	if (type === 'dodged' || isDodgedAndStacked(props)) {
		data[filteredIndex].transform?.push(getDodgeGroupTransform(props));
		data[filteredPreviousIndex].transform?.push(getDodgeGroupTransform(props));
	}
});

/**
 * data aggregate used to calculate the min and max of the stack
 * used to figure out the corner radius of the bars
 * @param facets
 * @param barSpecProps
 * @returns vega Data object
 */
export const getStackAggregateData = (props: BarSpecProps): Data => {
	const { metric, name } = props;
	return {
		name: `${name}_stacks`,
		source: FILTERED_TABLE,
		transform: [
			{
				type: 'aggregate',
				groupby: getStackFields(props),
				fields: [`${metric}1`, `${metric}1`],
				ops: ['min', 'max'],
			},
			getStackIdTransform(props),
		],
	};
};

export const getPreviousStackAggregateData = (props: BarSpecProps): Data => {
	const { metric, name } = props;
	return {
		name: `${name}_stacks`,
		source: FILTERED_PREVIOUS_TABLE,
		transform: [
			{
				type: 'aggregate',
				groupby: getStackFields(props),
				fields: [`${metric}1`, `${metric}1`],
				ops: ['min', 'max'],
			},
			getStackIdTransform(props),
		],
	};
};

export const getStackIdTransform = (props: BarSpecProps): FormulaTransform => {
	return {
		type: 'formula',
		as: STACK_ID,
		expr: getStackFields(props)
			.map((facet) => `datum.${facet}`)
			.join(' + "," + '),
	};
};

const getStackFields = ({ trellis, color, dimension, lineType, opacity, type }: BarSpecProps): string[] => {
	const { facets, secondaryFacets } = getFacetsFromProps({ color, lineType, opacity });
	return [
		...(trellis ? [trellis] : []),
		dimension,
		...(type === 'dodged' ? facets : []),
		...(type === 'stacked' ? secondaryFacets : []),
	];
};

export const getDodgeGroupTransform = ({ color, lineType, name, opacity, type }: BarSpecProps): FormulaTransform => {
	const { facets, secondaryFacets } = getFacetsFromProps({ color, lineType, opacity });
	return {
		type: 'formula',
		as: `${name}_dodgeGroup`,
		expr: (type === 'dodged' ? facets : secondaryFacets).map((facet) => `datum.${facet}`).join(' + "," + '),
	};
};

export const addScales = produce<Scale[], [BarSpecProps]>((scales, props) => {
	const { color, lineType, opacity, orientation, animations, children } = props;

	//TODO add comments
	if (animations == true && hasInteractiveChildren(children)) {
		addRSCAnimationScales(scales)
	}
	addMetricScale(scales, getScaleValues(props), orientation === 'vertical' ? 'y' : 'x');
	addDimensionScale(scales, props);
	addTrellisScale(scales, props);
	addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
	addFieldToFacetScaleDomain(scales, LINE_TYPE_SCALE, lineType);
	addFieldToFacetScaleDomain(scales, OPACITY_SCALE, opacity);
	addSecondaryScales(scales, props);
});

export const addDimensionScale = (
	scales: Scale[],
	{ dimension, paddingRatio, paddingOuter: barPaddingOuter, orientation }: BarSpecProps
) => {
	const index = getScaleIndexByType(scales, 'band', orientation === 'vertical' ? 'x' : 'y');
	scales[index] = addDomainFields(scales[index], [dimension]);
	const { paddingInner, paddingOuter } = getBarPadding(paddingRatio, barPaddingOuter);

	scales[index] = { ...scales[index], paddingInner, paddingOuter } as BandScale;
};

/**
 * adds scales for the secondary dimensions
 * If a bar is stacked and dodged,
 * @param scales
 * @param param1
 */
export const addSecondaryScales = (scales: Scale[], props: BarSpecProps) => {
	const { color, lineType, opacity } = props;
	if (isDodgedAndStacked(props)) {
		[
			{
				value: color,
				scaleName: 'colors',
				secondaryScaleName: 'secondaryColor',
			},
			{
				value: lineType,
				scaleName: 'lineTypes',
				secondaryScaleName: 'secondaryLineType',
			},
			{
				value: opacity,
				scaleName: 'opacities',
				secondaryScaleName: 'secondaryOpacity',
			},
		].forEach(({ value, scaleName, secondaryScaleName }) => {
			if (Array.isArray(value) && value.length === 2) {
				// secondary value scale used for 2D scales
				const secondaryIndex = getScaleIndexByName(scales, secondaryScaleName, 'ordinal');
				scales[secondaryIndex] = addDomainFields(scales[secondaryIndex], [value[1]]);

				const primaryIndex = getScaleIndexByName(scales, scaleName, 'ordinal');
				const primaryScale = scales[primaryIndex] as OrdinalScale;
				primaryScale.range = { signal: scaleName };
				scales[primaryIndex] = addDomainFields(primaryScale, [value[0]]);
			}
		});
	}
};

export const addMarks = produce<Mark[], [BarSpecProps]>((marks, props) => {
	const barMarks: Mark[] = [];
	console.log('Bar type', props.type);
	if (isDodgedAndStacked(props)) {
		barMarks.push(getDodgedAndStackedBarMark(props));
	} else if (props.type === 'stacked') {
		barMarks.push(...getStackedBarMarks(props));
	} else {
		barMarks.push(getDodgedMark(props));
	}

	// if this is a trellis plot, we add the bars and the repeated scale to the trellis group
	if (isTrellised(props)) {
		const repeatedScale = getRepeatedScale(props);
		console.log('Current barMarks up to this point', barMarks);
		console.log(getTrellisGroupMark(props, barMarks, repeatedScale));
		marks.push(getTrellisGroupMark(props, barMarks, repeatedScale));
	} else {
		marks.push(...barMarks);
	}
});

export const getRepeatedScale = (props: BarSpecProps): Scale => {
	const { orientation, trellisOrientation } = props;
	// if the orientations match then the metric scale is repeated, otherwise the dimension scale is repeated
	// ex. vertical bar in a vertical trellis will have multiple copies of the metric scale
	if (orientation === trellisOrientation) {
		return getMetricScale(getScaleValues(props), orientation === 'vertical' ? 'y' : 'x', orientation);
	} else {
		return getDimensionScale(props);
	}
};

/**
 * Generates a dimension scale and returns it
 * NOTE: does not check if the dimension scale already exists
 * @param param0
 * @returns
 */
const getDimensionScale = ({
	dimension,
	orientation,
	paddingRatio,
	paddingOuter: barPaddingOuter,
}: BarSpecProps): BandScale => {
	let scale = getDefaultScale('band', orientation === 'vertical' ? 'x' : 'y', orientation);
	scale = addDomainFields(scale, [dimension]);
	const { paddingInner, paddingOuter } = getBarPadding(paddingRatio, barPaddingOuter);
	return { ...scale, paddingInner, paddingOuter } as BandScale;
};
