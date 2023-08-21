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

import { DEFAULT_COLOR_SCHEME, DEFAULT_CONTINUOUS_DIMENSION, DEFAULT_METRIC, TABLE } from '@constants';
import { hasInteractiveChildren, hasPopover } from '@specBuilder/marks/markUtils';
import { getFacetsFromProps } from '@specBuilder/specUtils';
import { getTrendlineData, getTrendlineMarks, getTrendlineSignals } from '@specBuilder/trendline/trendlineUtils';
import { getDefaultMarkName, sanitizeMarkChildren, toCamelCase } from '@utils';
import produce from 'immer';
import { ColorScheme, LineProps, LineSpecProps } from 'types';
import { Data, Mark, Scale, Signal, Spec } from 'vega';

import { getTableData } from '../data/dataUtils';
import { addContinuousDimensionScale, addFieldToFacetScaleDomain, addMetricScale } from '../scale/scaleSpecBuilder';
import { getGenericSignal, getUncontrolledHoverSignal, hasSignalByName } from '../signal/signalSpecBuilder';
import { getLineHighlightedData, getLineHoverMarks, getLineMark } from './lineUtils';

export const addLine = produce<Spec, [LineProps & { colorScheme?: ColorScheme }]>(
	(
		spec,
		{
			children,
			color = { value: 'categorical-100' },
			colorScheme = DEFAULT_COLOR_SCHEME,
			dimension = DEFAULT_CONTINUOUS_DIMENSION,
			lineType = { value: 'solid' },
			metric = DEFAULT_METRIC,
			name = getDefaultMarkName(spec, 'line'),
			opacity = { value: 1 },
			padding,
			scaleType = 'time',
		}
	) => {
		// put props back together now that all defaults are set
		const lineProps: LineSpecProps = {
			children: sanitizeMarkChildren(children),
			color,
			colorScheme,
			dimension,
			lineType,
			metric,
			name: toCamelCase(name),
			opacity,
			padding,
			scaleType,
		};

		spec.data = addData(spec.data ?? [], lineProps);
		spec.signals = addSignals(spec.signals ?? [], lineProps);
		spec.scales = setScales(spec.scales ?? [], lineProps);
		spec.marks = addLineMarks(spec.marks ?? [], lineProps);

		return spec;
	}
);

export const addData = produce<Data[], [LineSpecProps]>((data, props) => {
	const { dimension, scaleType, children, name } = props;
	if (scaleType === 'time') {
		const tableData = getTableData(data);
		tableData.transform = tableData.transform ?? [];
		tableData.transform.push({
			type: 'timeunit',
			field: dimension,
			units: ['year', 'month', 'date', 'hours', 'minutes'],
			as: ['datetime0', 'datetime1'],
		});
	}
	if (hasInteractiveChildren(children)) {
		data.push(getLineHighlightedData(name, TABLE, hasPopover(children)));
	}
	data.push(...getTrendlineData(props));
});

export const addSignals = produce<Signal[], [LineSpecProps]>((signals, props) => {
	const { children, name } = props;
	signals.push(...getTrendlineSignals(props));
	if (!hasInteractiveChildren(children)) return;
	if (!hasSignalByName(signals, `${name}VoronoiHoveredId`)) {
		signals.push(getUncontrolledHoverSignal(`${name}Voronoi`, true));
	}
	if (!hasSignalByName(signals, `${name}SelectedId`)) {
		signals.push(getGenericSignal(`${name}SelectedId`));
	}
});

export const setScales = produce<Scale[], [LineSpecProps]>(
	(scales, { metric, dimension, color, lineType, opacity, padding, scaleType }) => {
		// add dimension scale
		addContinuousDimensionScale(scales, { scaleType, dimension, padding });
		// add color to the color domain
		addFieldToFacetScaleDomain(scales, 'color', color);
		// add lineType to the lineType domain
		addFieldToFacetScaleDomain(scales, 'lineType', lineType);
		// add opacity to the opacity domain
		addFieldToFacetScaleDomain(scales, 'opacity', opacity);
		// find the linear scale and add our field to it
		addMetricScale(scales, [metric]);
		return scales;
	}
);

export const addLineMarks = produce<Mark[], [LineSpecProps]>((marks, props) => {
	const { name, children, color, lineType, opacity } = props;

	const { facets } = getFacetsFromProps({ color, lineType, opacity });

	marks.push({
		name: `${name}Group`,
		type: 'group',
		from: {
			facet: {
				name: `${name}Facet`,
				data: TABLE,
				groupby: facets,
			},
		},
		marks: [getLineMark(props, `${name}Facet`)],
	});
	if (hasInteractiveChildren(children)) {
		marks.push(...getLineHoverMarks(props, TABLE));
	}
	marks.push(...getTrendlineMarks(props));
});
