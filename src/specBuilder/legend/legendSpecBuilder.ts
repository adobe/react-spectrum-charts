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
	DEFAULT_COLOR_SCHEME,
	LINEAR_COLOR_SCALE,
	LINE_TYPE_SCALE,
	OPACITY_SCALE,
	SYMBOL_SHAPE_SCALE,
	SYMBOL_SIZE_SCALE,
} from '@constants';
import { addFieldToFacetScaleDomain } from '@specBuilder/scale/scaleSpecBuilder';
import {
	getColorValue,
	getLineWidthPixelsFromLineWidth,
	getPathFromSymbolShape,
	getStrokeDashFromLineType,
} from '@specBuilder/specUtils';
import { produce } from 'immer';
import {
	ColorFacet,
	ColorScheme,
	FacetRef,
	LegendProps,
	LegendSpecProps,
	LineTypeFacet,
	LineWidthFacet,
	SymbolShapeFacet,
} from 'types';
import { Data, Legend, Mark, Scale, Signal, Spec } from 'vega';

import { getHighlightSeriesSignal, getLegendLabelsSeriesSignal, hasSignalByName } from '../signal/signalSpecBuilder';
import { getFacets, getFacetsFromKeys } from './legendFacetUtils';
import { setHoverOpacityForMarks } from './legendHighlightUtils';
import { Facet, getColumns, getEncodings, getHiddenEntriesFilter, getSymbolType } from './legendUtils';

export const addLegend = produce<
	Spec,
	[LegendProps & { colorScheme?: ColorScheme; index?: number; hiddenSeries?: string[]; highlightedSeries?: string }]
>(
	(
		spec,
		{
			color,
			hiddenEntries = [],
			hiddenSeries = [],
			highlight = false,
			highlightedSeries,
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

		const name = `legend${index}`;

		// put props back together now that all defaults are set
		const legendProps: LegendSpecProps = {
			color: formattedColor,
			hiddenEntries,
			hiddenSeries,
			highlight,
			highlightedSeries,
			index,
			isToggleable,
			lineType: formattedLineType,
			lineWidth: formattedLineWidth,
			name,
			position,
			symbolShape: formattedSymbolShape,
			title,
			colorScheme,
			...props,
		};

		// Order matters here. Facets rely on the scales being set up.
		spec.scales = addScales(spec.scales ?? [], legendProps);

		// get the keys and facet types that are used to divide the data for this visualization
		const { ordinalFacets, continuousFacets } = props.keys
			? getFacetsFromKeys(props.keys, spec.scales ?? [])
			: getFacets(spec.scales ?? []);

		const legends: Legend[] = [];

		// if there are any categorical facets, add the legend and supporting data, signals and marks
		if (ordinalFacets.length) {
			// add the legendEntries scale
			// this scale is used to generate every combination of the catergorical facets
			spec.scales.push({
				name: `${name}Entries`,
				type: 'ordinal',
				domain: { data: `${name}Aggregate`, field: `${name}Entries` },
			});

			// just want the unique fields
			const uniqueFacetFields = [...new Set(ordinalFacets.map((facet) => facet.field))];

			spec.data = addData(spec.data ?? [], { ...legendProps, facets: uniqueFacetFields });
			spec.signals = addSignals(spec.signals ?? [], legendProps);
			spec.marks = addMarks(spec.marks ?? [], legendProps);

			// add the legend
			legends.push(getCategoricalLegend(ordinalFacets, legendProps));
		}

		// continuous legends cannot be combined with any other legends
		continuousFacets.forEach((facet) => {
			// add the legend
			legends.push(getContinuousLegend(facet, legendProps));
		});

		// if legends is undefined, initialize it as an empty array
		if (typeof spec.legends === 'undefined') {
			spec.legends = [];
		}
		spec.legends.push(...legends);
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
		formattedSymbolShape = { value: getPathFromSymbolShape(symbolShape.value) };
	} else {
		formattedSymbolShape = symbolShape;
	}
	return { formattedColor, formattedLineType, formattedLineWidth, formattedSymbolShape };
};

/**
 * gets the legend for all the categorical facets
 * @param facets
 * @param props
 * @returns
 */
const getCategoricalLegend = (facets: Facet[], props: LegendSpecProps): Legend => {
	const { name, position, title, labelLimit } = props;
	return {
		fill: `${name}Entries`,
		direction: ['top', 'bottom'].includes(position) ? 'horizontal' : 'vertical',
		orient: position,
		title,
		encode: getEncodings(facets, props),
		columns: getColumns(position),
		labelLimit,
	};
};

/**
 * gets the legend for a continuous facet
 * currently just setup to handle symbolSize since that is the only supported continuous facet
 * @param _facet
 * @param props
 * @returns
 */
export const getContinuousLegend = (facet: Facet, props: LegendSpecProps): Legend => {
	const { symbolShape } = props;
	// add a switch statement here for the different types of continuous legends
	if (facet.facetType === SYMBOL_SIZE_SCALE) {
		return {
			size: SYMBOL_SIZE_SCALE,
			...getLegendLayout(props),
			symbolType: getSymbolType(symbolShape),
		};
	}
	return {
		fill: LINEAR_COLOR_SCALE,
		gradientThickness: 10,
		...getLegendLayout(props),
	};
};

const getLegendLayout = ({ position, title }: LegendSpecProps): Partial<Legend> => {
	return { direction: ['top', 'bottom'].includes(position) ? 'horizontal' : 'vertical', orient: position, title };
};

/**
 * Adds a new scale that is used to create the legend entries
 */
const addScales = produce<Scale[], [LegendSpecProps]>((scales, { color, lineType, opacity, symbolShape }) => {
	// it is possible to define fields to facet the data off of on the legend
	// if these fields are not already defined on the scales, we need to add them
	addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
	addFieldToFacetScaleDomain(scales, LINE_TYPE_SCALE, lineType);
	addFieldToFacetScaleDomain(scales, OPACITY_SCALE, opacity);
	addFieldToFacetScaleDomain(scales, SYMBOL_SHAPE_SCALE, symbolShape);
});

const addMarks = produce<Mark[], [LegendSpecProps]>((marks, { highlight, keys, name }) => {
	if (highlight) {
		setHoverOpacityForMarks(marks, keys, name);
	}
});

/**
 * Adds a new data set that aggregates the data off of the facet fields
 * This creates a row for every unique combination of the facets in the data
 * Each unique combination gets joined with a pipe to create a single string to use as legend entries
 */
export const addData = produce<Data[], [LegendSpecProps & { facets: string[] }]>(
	(data, { facets, hiddenEntries, name }) => {
		// expression for combining all the facets into a single key
		const expr = facets.map((facet) => `datum.${facet}`).join(' + " | " + ');
		data.push({
			name: `${name}Aggregate`,
			source: 'table',
			transform: [
				{
					type: 'aggregate',
					groupby: facets,
				},
				{
					type: 'formula',
					as: `${name}Entries`,
					expr,
				},
				...getHiddenEntriesFilter(hiddenEntries, name),
			],
		});
	},
);

export const addSignals = produce<Signal[], [LegendSpecProps]>(
	(signals, { hiddenSeries, highlight, isToggleable, keys, legendLabels, name }) => {
		if (highlight) {
			const signalName = keys ? `${name}_highlighted` : 'highlightedSeries';
			if (!hasSignalByName(signals, signalName)) {
				signals.push(getHighlightSeriesSignal(name, Boolean(isToggleable || hiddenSeries), keys));
			}
		}

		if (legendLabels) {
			if (!hasSignalByName(signals, 'legendLabels')) {
				signals.push(getLegendLabelsSeriesSignal(legendLabels));
			}
		}
	},
);
