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

import { DEFAULT_COLOR_SCHEME, HIGHLIGHT_CONTRAST_RATIO } from '@constants';
import { addFieldToFacetScaleDomain } from '@specBuilder/scale/scaleSpecBuilder';
import {
	getColorValue,
	getLineWidthPixelsFromLineWidth,
	getPathFromPrismSymbolShape,
	getStrokeDashFromLineType,
} from '@specBuilder/specUtils';
import { spectrumColors } from '@themes';
import merge from 'deepmerge';
import produce from 'immer';
import { WritableDraft } from 'immer/dist/internal';
import {
	ColorFacet,
	ColorScheme,
	FacetRef,
	FacetType,
	LegendDescription,
	LegendLabel,
	LegendProps,
	LegendSpecProps,
	LineTypeFacet,
	LineWidthFacet,
	OpacityFacet,
	Position,
	SecondaryFacetType,
	SymbolShapeFacet,
} from 'types';
import {
	BaseValueRef,
	Color,
	Data,
	FilterTransform,
	GroupMark,
	Legend,
	LegendEncode,
	Mark,
	NumericValueRef,
	ProductionRule,
	Scale,
	Signal,
	SignalRef,
	Spec,
} from 'vega';

import { getHighlightSeriesSignal, getLegendLabelsSeriesSignal, hasSignalByName } from '../signal/signalSpecBuilder';

interface Facet {
	facetType: FacetType | SecondaryFacetType;
	field: string;
}

export const addLegend = produce<Spec, [LegendProps & { colorScheme?: ColorScheme }]>(
	(
		spec,
		{
			color,
			descriptions,
			highlight = false,
			hiddenEntries = [],
			legendLabels,
			lineType,
			lineWidth,
			opacity,
			position = 'bottom',
			symbolShape,
			colorScheme = DEFAULT_COLOR_SCHEME,
			title,
		}
	) => {
		const { formattedColor, formattedLineType, formattedLineWidth, formattedSymbolShape } =
			formatFacetRefsWithPresets(color, lineType, lineWidth, symbolShape, colorScheme);

		// put props back together now that all defaults are set
		const legendProps: LegendSpecProps = {
			color: formattedColor,
			descriptions,
			highlight,
			hiddenEntries,
			legendLabels,
			lineType: formattedLineType,
			lineWidth: formattedLineWidth,
			opacity,
			position,
			symbolShape: formattedSymbolShape,
			colorScheme,
			title,
		};

		// get the keys and facet types that are used to divide the data for this visualization
		const facets = getFacets(spec.scales ?? []);
		// if there are no facets, there is no need for a legend
		if (facets.length === 0) return;

		const uniqueFacetFields = [...new Set(facets.map((facet) => facet.field))];
		spec.data = addData(spec.data ?? [], {
			facets: uniqueFacetFields,
			hiddenEntries,
		});
		spec.scales = addLegendEntriesScale(spec.scales ?? [], legendProps);

		const legend: Legend = {
			fill: 'legendEntries',
			direction: ['top', 'bottom'].includes(position) ? 'horizontal' : 'vertical',
			orient: position,
			title,
			encode: getEncodings(facets, legendProps),
			columns: getColumns(position),
		};
		if (highlight || legendLabels) {
			spec.signals = addSignals(spec.signals ?? [], { spec, highlight, legendLabels });
		}

		spec.legends = [legend];
	}
);

/**
 * converts facets that could reference preset values to the actual vega supported value
 * Example {value: 'L'} => {value: 3}
 * @param color
 * @param lineType
 * @param lineWidth
 * @param theme
 */
export const formatFacetRefsWithPresets = (
	color: ColorFacet | undefined,
	lineType: LineTypeFacet | undefined,
	lineWidth: LineWidthFacet | undefined,
	symbolShape: SymbolShapeFacet | undefined,
	theme
) => {
	let formattedColor: FacetRef<string> | undefined;
	if (color && typeof color === 'object') {
		formattedColor = { value: getColorValue(color.value, theme) };
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
	}
);

/**
 * Adds a new data set that aggregates the data off of the facet fields
 * This creates a row for every unique combination of the facets in the data
 * Each unique combination gets joined with a pipe to create a single string to use as legend entries
 */
export const addData = produce<Data[], [{ facets: string[]; hiddenEntries: string[] }]>(
	(data, { facets, hiddenEntries }) => {
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
	}
);

const getHiddenEntriesFilter = (hiddenEntries: string[]): FilterTransform[] => {
	if (!hiddenEntries.length) return [];
	return [
		{
			type: 'filter',
			expr: `indexof(${JSON.stringify(hiddenEntries)}, datum.legendEntries) === -1`,
		},
	];
};

const addSignals = produce<
	Signal[],
	[{ spec: WritableDraft<Spec>; highlight: boolean; legendLabels: LegendLabel[] | undefined }]
>((signals, { spec, highlight, legendLabels }) => {
	if (highlight) {
		if (!hasSignalByName(signals, 'highlightedSeries')) {
			signals.push(getHighlightSeriesSignal());
		}
		spec.marks = setHoverOpacityForMarks(spec.marks ?? []);
	}

	if (legendLabels) {
		if (!hasSignalByName(signals, 'legendLabels')) {
			signals.push(getLegendLabelsSeriesSignal(legendLabels));
		}
	}
});

const getEncodings = (facets: Facet[], legendProps: LegendSpecProps): LegendEncode | undefined => {
	const { descriptions, highlight, legendLabels, opacity } = legendProps;
	const symbolEncodings = getSymbolEncodings(facets, legendProps);
	const hoverEncodings = getHoverEncodings(highlight, opacity, facets, descriptions);
	const legendLabelsEncodings = getLegendLabelsEncodings(legendLabels);
	// merge the encodings together
	const mergedEncodings = merge(symbolEncodings, legendLabelsEncodings);
	return merge(mergedEncodings, hoverEncodings);
};

function getLegendLabelsEncodings(legendLabels: LegendLabel[] | undefined): LegendEncode {
	if (legendLabels) {
		return {
			labels: {
				update: {
					text: [
						{
							// Test whether a legendLabel exists for the seriesName, if not use the seriesName
							test: "indexof(pluck(legendLabels, 'seriesName'), datum.value) > -1",
							signal: "legendLabels[indexof(pluck(legendLabels, 'seriesName'), datum.value)].label",
						},
						{ signal: 'datum.value' },
					],
				},
			},
		};
	}
	return {};
}

function getHoverEncodings(
	highlight: boolean,
	opacity?: OpacityFacet,
	facets?: Facet[],
	descriptions?: LegendDescription[]
): LegendEncode {
	if (highlight || descriptions) {
		return {
			entries: {
				name: 'legendEntry',
				interactive: true,
				enter: {
					tooltip: getTooltip(descriptions), // only add tooltip if descriptions exist
				},
				update: {
					fill: { value: 'transparent' }, // need something here to trigger the tooltip
				},
			},
			labels: {
				update: {
					fillOpacity: getOpacityEncoding(highlight), // only add fill opacity if highlight is true
				},
			},
			symbols: {
				update: {
					fillOpacity: getOpacityEncoding(highlight, opacity, facets), // only add fill opacity if highlight is true
					strokeOpacity: getOpacityEncoding(highlight), // only add stroke opacity if highlight is true
				},
			},
		};
	}
	return {};
}

const getTooltip = (descriptions?: LegendDescription[]) => {
	if (descriptions) {
		return { signal: 'datum' };
	}
	return undefined;
};

/**
 * Combines the opacity facet encodings with the highlight behavior which halves the opacity of non-highlighted legend entries
 * @param highlight
 * @param opacity
 * @param facets
 * @returns
 */
export const getOpacityEncoding = (
	highlight: boolean,
	opacity?: OpacityFacet,
	facets?: Facet[]
): ProductionRule<NumericValueRef> | undefined => {
	if (highlight) {
		if (facets || opacity) {
			const opacityEncoding = getSymbolFacetEncoding<number>({
				facets,
				facetType: 'opacity',
				customValue: opacity,
			}) ?? { value: 1 };
			if ('signal' in opacityEncoding) {
				return getHighlightOpacityEncoding(
					{ signal: opacityEncoding.signal + ` / ${HIGHLIGHT_CONTRAST_RATIO}` },
					opacityEncoding
				);
			}
			if ('value' in opacityEncoding && typeof opacityEncoding.value === 'number') {
				return getHighlightOpacityEncoding(
					{ value: opacityEncoding.value / HIGHLIGHT_CONTRAST_RATIO },
					opacityEncoding
				);
			}
		}
		return getHighlightOpacityEncoding({ value: 1 / HIGHLIGHT_CONTRAST_RATIO }, { value: 1 });
	}
	return undefined;
};

const getHighlightOpacityEncoding = (
	highlightOpacity: BaseValueRef<number>,
	defaultOpacity: BaseValueRef<number>
): ProductionRule<NumericValueRef> => {
	return [
		{
			test: 'highlightedSeries && datum.value !== highlightedSeries',
			...highlightOpacity,
		},
		defaultOpacity,
	];
};

export const getSymbolEncodings = (
	facets: Facet[],
	{ color, lineType, lineWidth, opacity, symbolShape, colorScheme }: LegendSpecProps
): LegendEncode => {
	const update = {
		fill: getSymbolFacetEncoding<Color>({ facets, facetType: 'color', customValue: color }) || {
			value: spectrumColors[colorScheme]['categorical-100'],
		},
		fillOpacity: getSymbolFacetEncoding<number>({ facets, facetType: 'opacity', customValue: opacity }),
		size: getSymbolFacetEncoding<number>({ facets, facetType: 'symbolSize' }),
		stroke: getSymbolFacetEncoding<Color>({ facets, facetType: 'color', customValue: color }) || {
			value: spectrumColors[colorScheme]['categorical-100'],
		},
		strokeDash: getSymbolFacetEncoding<number[]>({ facets, facetType: 'lineType', customValue: lineType }),
		strokeOpacity: getSymbolFacetEncoding<number>({ facets, facetType: 'opacity' }),
		strokeWidth: getSymbolFacetEncoding<number>({ facets, facetType: 'lineWidth', customValue: lineWidth }),
		shape: getSymbolFacetEncoding<string>({ facets, facetType: 'symbolShape', customValue: symbolShape }),
	};
	// Remove undefined values
	Object.keys(update).forEach((key) => update[key] === undefined && delete update[key]);
	return {
		entries: {
			name: 'legendEntry',
		},
		symbols: {
			update,
		},
	};
};

const getSymbolFacetEncoding = <T>({
	customValue,
	facets,
	facetType,
}: {
	customValue?: FacetRef<T>;
	facets?: Facet[];
	facetType: FacetType;
}): ProductionRule<BaseValueRef<T>> | undefined => {
	if (customValue) {
		if (typeof customValue === 'string') {
			return { signal: `scale('${facetType}', data('legendAggregate')[datum.index].${customValue})` };
		}
		return { value: customValue.value };
	}

	if (!facets) return;

	const secondaryFacetMapping: { [key in FacetType]: { scale: SecondaryFacetType; signal: string } } = {
		color: { scale: 'secondaryColor', signal: 'colors' },
		lineType: { scale: 'secondaryLineType', signal: 'lineTypes' },
		lineWidth: { scale: 'secondaryLineWidth', signal: 'lineWidths' },
		opacity: { scale: 'secondaryOpacity', signal: 'opacities' },
		symbolShape: { scale: 'secondarySymbolShape', signal: 'symbolShapes' },
		symbolSize: { scale: 'secondarySymbolSize', signal: 'symbolSizes' },
	};

	const facet = facets.find((facet) => facet.facetType === facetType);
	if (!facet) return;
	const secondaryFacet = facets.find((f) => f.facetType === secondaryFacetMapping[facetType].scale);
	if (secondaryFacet) {
		const { scale, signal } = secondaryFacetMapping[facetType];
		return {
			signal: `scale('${signal}', data('legendAggregate')[datum.index].${facet.field})[indexof(domain('${scale}'), data('legendAggregate')[datum.index].${secondaryFacet.field})% length(scale('${signal}', data('legendAggregate')[datum.index].${facet.field}))]`,
		};
	}

	return { signal: `scale('${facetType}', data('legendAggregate')[datum.index].${facet.field})` };
};

const getColumns = (position: Position): SignalRef | undefined => {
	if (['left', 'right'].includes(position)) return;
	return { signal: 'floor(width / 220)' };
};

export const setHoverOpacityForMarks = produce<Mark[]>((marks) => {
	if (!marks.length) return;
	const flatMarks = flattenMarks(marks);
	const seriesMarks = flatMarks.filter(seriesMarkFilter);
	seriesMarks.forEach((mark) => {
		// need to drill down to the prop we need to set and add missing properties if needed
		if (!mark.encode) {
			mark.encode = { update: {} };
		}
		if (!mark.encode.update) {
			mark.encode.update = {};
		}
		const { update } = mark.encode;
		const { fillOpacity, strokeOpacity } = update;

		// the production rule that sets the fill opacity for this mark
		const fillOpacityRule = getOpacityRule(fillOpacity);
		// the new production rule for highlighting
		const highlightFillOpacityRule = getHighlightOpacityRule(fillOpacityRule);

		if (!Array.isArray(update.fillOpacity)) {
			update.fillOpacity = [];
		}
		// // need to insert the new test in the second to last slot
		const fillRuleInsertIndex = Math.max(update.fillOpacity.length - 1, 0);
		update.fillOpacity.splice(fillRuleInsertIndex, 0, highlightFillOpacityRule);

		// the production rule that sets the stroke opacity for this mark
		const strokeOpacityRule = getOpacityRule(strokeOpacity);
		// the new production rule for highlighting
		const highlightStrokeOpacityRule = getHighlightOpacityRule(strokeOpacityRule);

		if (!Array.isArray(update.strokeOpacity)) {
			update.strokeOpacity = [];
		}
		// // need to insert the new test in the second to last slot
		const strokeRuleInsertIndex = Math.max(update.strokeOpacity.length - 1, 0);
		update.strokeOpacity.splice(strokeRuleInsertIndex, 0, highlightStrokeOpacityRule);
	});
	return marks;
});

export const getOpacityRule = (
	opacityRule: ProductionRule<NumericValueRef> | undefined
): ProductionRule<NumericValueRef> => {
	if (opacityRule) {
		// if it's an array and length > 0, get the last value
		if (Array.isArray(opacityRule)) {
			if (opacityRule.length > 0) {
				return opacityRule[opacityRule.length - 1];
			}
		} else {
			return opacityRule;
		}
	}
	return { value: 1 };
};

export const getHighlightOpacityRule = (
	opacityRule: ProductionRule<NumericValueRef>
): { test?: string } & NumericValueRef => {
	const test = 'highlightedSeries && highlightedSeries !== datum.prismSeriesId';
	if ('scale' in opacityRule && 'field' in opacityRule) {
		return {
			test,
			signal: `scale('${opacityRule.scale}', datum.${opacityRule.field}) / ${HIGHLIGHT_CONTRAST_RATIO}`,
		};
	}
	if ('signal' in opacityRule) {
		return { test, signal: `${opacityRule.signal} / ${HIGHLIGHT_CONTRAST_RATIO}` };
	}
	if ('value' in opacityRule && typeof opacityRule.value === 'number') {
		return { test, value: opacityRule.value / HIGHLIGHT_CONTRAST_RATIO };
	}
	return { test, value: 1 / HIGHLIGHT_CONTRAST_RATIO };
};

// filters for marks that have stroke or fill set to use the color scale
const seriesMarkFilter = (mark) => {
	const enter = mark.encode?.enter;
	if (!enter) return false;
	const { fill, stroke } = enter;
	if (fill && 'scale' in fill && fill.scale === 'color') {
		return true;
	}
	// some marks use a 2d color scale, these will use a signal expression to get the color for that series
	if (fill && 'signal' in fill && fill.signal.includes("scale('colors',")) {
		return true;
	}
	if (stroke && 'scale' in stroke && stroke.scale === 'color') {
		return true;
	}
	return false;
};

// marks can be nested under group marks, this flattens them all so they are easier to traverse
function flattenMarks(marks: Mark[]): Mark[] {
	let result = marks;
	for (const mark of marks) {
		if (isGroupMark(mark) && mark.marks) {
			result = [...result, ...flattenMarks(mark.marks)];
		}
	}
	return result;
}

function isGroupMark(mark: Mark): mark is GroupMark {
	return mark.type === 'group';
}
