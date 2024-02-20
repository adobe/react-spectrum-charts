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
import {
	DEFAULT_COLOR_SCHEME,
	DEFAULT_DIMENSION_SCALE_TYPE,
	DEFAULT_LINEAR_DIMENSION,
	DEFAULT_METRIC,
	FILTERED_TABLE,
	LINEAR_COLOR_SCALE,
	MARK_ID,
} from '@constants';
import { addTimeTransform, getTableData } from '@specBuilder/data/dataUtils';
import { getInteractiveMarkName } from '@specBuilder/line/lineUtils';
import { hasInteractiveChildren, hasPopover } from '@specBuilder/marks/markUtils';
import {
	addContinuousDimensionScale,
	addFieldToFacetScaleDomain,
	addMetricScale,
} from '@specBuilder/scale/scaleSpecBuilder';
import { getGenericSignal, getUncontrolledHoverSignal, hasSignalByName } from '@specBuilder/signal/signalSpecBuilder';
import { addTrendlineData, getTrendlineScales, getTrendlineSignals } from '@specBuilder/trendline';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { ColorScheme, ScatterProps, ScatterSpecProps } from 'types';
import { Data, Scale, Signal, Spec } from 'vega';
import { addScatterMarks } from './scatterMarkUtils';

/**
 * Adds all the necessary parts of a scatter to the spec
 * @param spec Spec
 * @param scatterProps ScatterProps
 */
export const addScatter = produce<Spec, [ScatterProps & { colorScheme?: ColorScheme; index?: number }]>(
	(
		spec,
		{
			children,
			color = { value: 'categorical-100' },
			colorScaleType = 'ordinal',
			colorScheme = DEFAULT_COLOR_SCHEME,
			dimension = DEFAULT_LINEAR_DIMENSION,
			dimensionScaleType = DEFAULT_DIMENSION_SCALE_TYPE,
			index = 0,
			lineType = { value: 'solid' },
			lineWidth = { value: 0 },
			metric = DEFAULT_METRIC,
			name,
			opacity = { value: 1 },
			size = { value: 'M' },
			...props
		},
	) => {
		const sanitizedChildren = sanitizeMarkChildren(children);
		const scatterName = toCamelCase(name || `scatter${index}`);
		// put props back together now that all the defaults have been set
		const scatterProps: ScatterSpecProps = {
			children: sanitizedChildren,
			color,
			colorScaleType,
			colorScheme,
			dimension,
			dimensionScaleType,
			index,
			interactiveMarkName: getInteractiveMarkName(sanitizedChildren, scatterName),
			lineType,
			lineWidth,
			metric,
			name: scatterName,
			opacity,
			size,
			...props,
		};

		spec.data = addData(spec.data ?? [], scatterProps);
		spec.signals = addSignals(spec.signals ?? [], scatterProps);
		spec.scales = setScales(spec.scales ?? [], scatterProps);
		spec.marks = addScatterMarks(spec.marks ?? [], scatterProps);
	},
);

export const addData = produce<Data[], [ScatterSpecProps]>((data, props) => {
	const { children, dimension, dimensionScaleType, name } = props;
	if (dimensionScaleType === 'time') {
		const tableData = getTableData(data);
		tableData.transform = addTimeTransform(tableData.transform ?? [], dimension);
	}
	if (hasPopover(children)) {
		data.push({
			name: `${name}_selectedData`,
			source: FILTERED_TABLE,
			transform: [
				{
					type: 'filter',
					expr: `${name}_selectedId === datum.${MARK_ID}`,
				},
			],
		});
	}
	addTrendlineData(data, props);
});

/**
 * Adds the signals for scatter to the signals array
 * @param signals Signal[]
 * @param scatterProps ScatterSpecProps
 */
export const addSignals = produce<Signal[], [ScatterSpecProps]>((signals, props) => {
	const { children, name } = props;
	// trendline signals
	signals.push(...getTrendlineSignals(props));

	if (!hasInteractiveChildren(children)) return;
	// interactive signals
	if (!hasSignalByName(signals, `${name}_hoveredId`)) {
		// hover signal
		signals.push(getUncontrolledHoverSignal(`${name}`, true, `${name}_voronoi`));
	}
	if (hasPopover(children)) {
		if (!hasSignalByName(signals, `${name}_selectedId`)) {
			// select signal
			signals.push(getGenericSignal(`${name}_selectedId`));
		}
	}
});

/**
 * Sets up all the scales for scatter on the scales array
 * @param scales Scale[]
 * @param scatterProps ScatterSpecProps
 */
export const setScales = produce<Scale[], [ScatterSpecProps]>((scales, props) => {
	const { color, colorScaleType, dimension, dimensionScaleType, lineType, lineWidth, metric, opacity, size } = props;
	// add dimension scale
	addContinuousDimensionScale(scales, { scaleType: dimensionScaleType, dimension });
	// add metric scale
	addMetricScale(scales, [metric]);
	if (colorScaleType === 'linear') {
		// add color to the color domain
		addFieldToFacetScaleDomain(scales, LINEAR_COLOR_SCALE, color);
	} else {
		// add color to the color domain
		addFieldToFacetScaleDomain(scales, 'color', color);
	}
	// add lineType to the lineType domain
	addFieldToFacetScaleDomain(scales, 'lineType', lineType);
	// add lineWidth to the lineWidth domain
	addFieldToFacetScaleDomain(scales, 'lineWidth', lineWidth);
	// add opacity to the opacity domain
	addFieldToFacetScaleDomain(scales, 'opacity', opacity);
	// add size to the size domain
	addFieldToFacetScaleDomain(scales, 'symbolSize', size);

	scales.push(...getTrendlineScales(props));
});
