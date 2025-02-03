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
import { Axis, GroupMark, Spec } from 'vega';

import { AxisSpecOptions } from '../../types';

/**
 * Checks the spec to see if it is a trellised chart
 * @param spec
 * @returns
 */
export const isTrellisedChart = (spec: Spec): boolean => {
	return /[xy]TrellisGroup/g.test(JSON.stringify(spec));
};

/**
 * Gets all the custom props for a trellis axis
 * If this axis is not a trellis axis, it will return an empty object
 * @param scaleName
 * @returns trellisAxisOptions
 */
export const getTrellisAxisOptions = (scaleName: string): Partial<AxisSpecOptions> => {
	let trellisAxisOptions: Partial<AxisSpecOptions> = {};

	// if 'TrellisBand' is in the scale name then this is a trellis axis
	if (scaleName.includes('TrellisBand')) {
		// shift the labels up/left half the scale bandwidth
		const labelOffsetSignal = `bandwidth('${scaleName}') / -2`;
		const axisType = scaleName.startsWith('x') ? 'x' : 'y';
		trellisAxisOptions = {
			position: axisType === 'x' ? 'top' : 'left',
			labelFontWeight: 'bold',
			labelAlign: undefined, // set this to undefined because we will manually control alignment
			title: undefined,
			vegaLabelAlign: 'left',
			vegaLabelBaseline: 'bottom',
			vegaLabelOffset: axisType === 'x' ? { signal: labelOffsetSignal } : { signal: `${labelOffsetSignal} - 8` }, // y axis needs an extra 8px as vertical padding
			vegaLabelPadding: axisType === 'x' ? 8 : 0, // add vertical padding
		};
	}
	return trellisAxisOptions;
};

/**
 * Adds title encodings so that only the first title is visible.
 * Does not mutate axes but instead returns a copy with the correct encodings added.
 * @param axes
 * @param trellisGroupMark
 * @returns axes
 */
export const encodeAxisTitle = (axes: Axis[], trellisGroupMark: GroupMark) => {
	const { facetName, facetGroupBy, trellisScaleName } = getTrellisGroupProperties(trellisGroupMark);

	return axes.map((axis) => {
		if (axis.title) {
			return {
				...axis,
				encode: {
					...axis.encode,
					title: {
						update: {
							opacity: [
								{
									test: `info(domain('${trellisScaleName}')[0] === data('${facetName}')[0].${facetGroupBy})`,
									value: 1,
								},
								{ value: 0 },
							],
						},
					},
				},
			};
		}
		return axis;
	});
};

/**
 * Gets properties of the trellis group mark
 * @param groupMark
 * @returns properties
 */
export const getTrellisGroupProperties = (
	groupMark: GroupMark
): { facetGroupBy: string; facetName: string; trellisScaleName: string } => {
	const trellisScaleName = `${(groupMark.name ?? 'x')[0]}TrellisBand`;
	const fromFacet = groupMark.from as { facet: { name: string; groupby: string } };

	return { facetGroupBy: fromFacet.facet.groupby, facetName: fromFacet.facet.name, trellisScaleName };
};
