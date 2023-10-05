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

import { DEFAULT_COLOR_SCHEME, FILTERED_TABLE } from '@constants';
import { addFieldToFacetScaleDomain } from '@specBuilder/scale/scaleSpecBuilder';
import {
	getColorValue,
	getLineWidthPixelsFromLineWidth,
	getPathFromPrismSymbolShape,
	getStrokeDashFromLineType,
} from '@specBuilder/specUtils';
import produce from 'immer';
import {
	ColorFacet,
	ColorScheme,
	FacetRef,
	FacetType,
	LegendProps,
	LegendSpecProps,
	LineTypeFacet,
	LineWidthFacet,
	SecondaryFacetType,
	SymbolShapeFacet,
} from 'types';
import { Data, Legend, Mark, Scale, Signal, Spec } from 'vega';

import {
	getGenericSignal,
	getHighlightSeriesSignal,
	getLegendLabelsSeriesSignal,
	hasSignalByName,
} from '../signal/signalSpecBuilder';
import { setHoverOpacityForMarks } from './legendHighlightUtils';
import { Facet, getColumns, getEncodings, getHiddenEntriesFilter } from './legendUtils';

export const addLegend = produce<Spec, [LegendProps & { colorScheme?: ColorScheme; index?: number }]>(
	(
		spec,
		{
			color,
			hiddenEntries = [],
			highlight = false,
			index = 0,
			isToggleable = false,
			lineType,
			lineWidth,
			position = 'bottom',
			symbolShape,
			title,
			colorScheme = DEFAULT_COLOR_SCHEME,
			...props
		},
	) => {
		const { formattedColor, formattedLineType, formattedLineWidth, formattedSymbolShape } =
			formatFacetRefsWithPresets(color, lineType, lineWidth, symbolShape, colorScheme);

		// put props back together now that all defaults are set
		const legendProps: LegendSpecProps = {
			color: formattedColor,
			hiddenEntries,
			highlight,
			index,
			isToggleable,
			lineType: formattedLineType,
			lineWidth: formattedLineWidth,
			name: `legend${index}`,
			position,
			symbolShape: formattedSymbolShape,
			title,
			colorScheme,
			...props,
		};

		// get the keys and facet types that are used to divide the data for this visualization
		const facets = getFacets(spec.scales ?? []);
		// if there are no facets, there is no need for a legend
		if (facets.length === 0) return;

		const uniqueFacetFields = [...new Set(facets.map((facet) => facet.field))];
		spec.data = addData(spec.data ?? [], { ...legendProps, facets: uniqueFacetFields });
		spec.signals = addSignals(spec.signals ?? [], legendProps);
		spec.scales = addLegendEntriesScale(spec.scales ?? [], legendProps);
		spec.marks = addMarks(spec.marks ?? [], legendProps);

		const legend: Legend = {
			fill: 'legendEntries',
			direction: ['top', 'bottom'].includes(position) ? 'horizontal' : 'vertical',
			orient: position,
			title,
			encode: getEncodings(facets, legendProps),
			columns: getColumns(position),
		};

		spec.legends = [legend];
	},
);

/**
 * converts facets that could reference preset values to the actual vega supported value
 * Example {value: 'L'} => {value: 3}
 * @param color
 * @param lineType
 * @param lineWidth
 * @param colorScheme
 */
export const formatFacetRefsWithPresets = (
	color: ColorFacet | undefined,
	lineType: LineTypeFacet | undefined,
	lineWidth: LineWidthFacet | undefined,
	symbolShape: SymbolShapeFacet | undefined,
	colorScheme: ColorScheme,
) => {
	let formattedColor: FacetRef<string> | undefined;
	if (color && typeof color === 'object') {
		formattedColor = { value: getColorValue(color.value, colorScheme) };
	} else {
		formattedColor = color;
	}

	let formattedLineType: FacetRef<number[]> | undefined;
	if (lineType && typeof lineType === 'object') {
		formattedLineType = { value: getStrokeDashFromLineType(lineType.value) };
	} else {
		formattedLineType = lineType;
	}

	let formattedLineWidth: FacetRef<number> | undefined;
	if (lineWidth && typeof lineWidth === 'object') {
		formattedLineWidth = { value: getLineWidthPixelsFromLineWidth(lineWidth.value) };
	} else {
		formattedLineWidth = lineWidth;
	}

	let formattedSymbolShape: FacetRef<string> | undefined;
	if (symbolShape && typeof symbolShape === 'object') {
		formattedSymbolShape = { value: getPathFromPrismSymbolShape(symbolShape.value) };
	} else {
		formattedSymbolShape = symbolShape;
	}
	return { formattedColor, formattedLineType, formattedLineWidth, formattedSymbolShape };
};

const getFacets = (scales: Scale[]): Facet[] => {
	let facets: Facet[] = [];
	facets = addFacet(facets, scales, 'color');
	facets = addFacet(facets, scales, 'lineType');
	facets = addFacet(facets, scales, 'opacity');
	facets = addFacet(facets, scales, 'secondaryColor');
	facets = addFacet(facets, scales, 'secondaryLineType');
	facets = addFacet(facets, scales, 'secondaryOpacity');
	facets = addFacet(facets, scales, 'secondarySymbolShape');
	facets = addFacet(facets, scales, 'symbolShape');
	return facets;
};

const addFacet = (facets: Facet[], scales: Scale[], facetType: FacetType | SecondaryFacetType) => {
	const scale = scales.find((scale) => scale.name === facetType);
	if (scale?.domain && 'fields' in scale.domain && scale.domain.fields.length) {
		return [...facets, { facetType, field: scale.domain.fields[0].toString() }];
	}
	return facets;
};

/**
 * Adds a new scale that is used to create the legend entries
 */
const addLegendEntriesScale = produce<Scale[], [LegendSpecProps]>(
	(scales, { color, lineType, opacity, symbolShape }) => {
		// it is possible to define fields to facet the data off of on the legend
		// if these fields are not already defined on the scales, we need to add them
		addFieldToFacetScaleDomain(scales, 'color', color);
		addFieldToFacetScaleDomain(scales, 'lineType', lineType);
		addFieldToFacetScaleDomain(scales, 'opacity', opacity);
		addFieldToFacetScaleDomain(scales, 'symbolShape', symbolShape);

		scales.push({
			name: 'legendEntries',
			type: 'ordinal',
			domain: { data: 'legendAggregate', field: 'legendEntries' },
		});
	},
);

const addMarks = produce<Mark[], [LegendSpecProps]>((marks, { highlight }) => {
	if (highlight) {
		setHoverOpacityForMarks(marks);
	}
});

/**
 * Adds a new data set that aggregates the data off of the facet fields
 * This creates a row for every unique combination of the facets in the data
 * Each unique combination gets joined with a pipe to create a single string to use as legend entries
 */
export const addData = produce<Data[], [LegendSpecProps & { facets: string[] }]>(
	(data, { facets, hiddenEntries, hiddenSeries, isToggleable }) => {
		if (isToggleable || hiddenSeries) {
			const index = data.findIndex((datum) => datum.name === FILTERED_TABLE);
			data[index].transform = [
				{ type: 'filter', expr: 'indexof(hiddenSeries, datum.prismSeriesId) === -1' },
				...(data[index].transform ?? []),
			];
		}
		// expression for combining all the facets into a single key
		const expr = facets.map((facet) => `datum.${facet}`).join(' + " | " + ');
		data.push({
			name: 'legendAggregate',
			source: 'table',
			transform: [
				{
					type: 'aggregate',
					groupby: facets,
				},
				{
					type: 'formula',
					as: 'legendEntries',
					expr,
				},
				...getHiddenEntriesFilter(hiddenEntries),
			],
		});
	},
);

export const addSignals = produce<Signal[], [LegendSpecProps]>(
	(signals, { hiddenSeries, highlight, isToggleable, legendLabels, name }) => {
		if (highlight) {
			if (!hasSignalByName(signals, 'highlightedSeries')) {
				signals.push(getHighlightSeriesSignal(name, Boolean(isToggleable || hiddenSeries)));
			}
		}

		if (legendLabels) {
			if (!hasSignalByName(signals, 'legendLabels')) {
				signals.push(getLegendLabelsSeriesSignal(legendLabels));
			}
		}

		if (isToggleable || hiddenSeries) {
			signals.push(getGenericSignal('hiddenSeries', hiddenSeries ?? []));
		}
	},
);
