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

import { HIGHLIGHT_CONTRAST_RATIO } from '@constants';
import { ColorValueV6 } from '@react-types/shared';
import { getColorValue } from '@specBuilder/specUtils';
import { spectrumColors } from '@themes';
import merge from 'deepmerge';
import {
	FacetRef,
	FacetType,
	LegendDescription,
	LegendLabel,
	LegendSpecProps,
	OpacityFacet,
	Position,
	SecondaryFacetType,
} from 'types';
import {
	BaseValueRef,
	Color,
	ColorValueRef,
	FilterTransform,
	LegendEncode,
	NumericValueRef,
	ProductionRule,
	SignalRef,
	SymbolEncodeEntry,
} from 'vega';

export interface Facet {
	facetType: FacetType | SecondaryFacetType;
	field: string;
}

/**
 * Get the number of columns for the legend
 * @param position
 * @returns
 */
export const getColumns = (position: Position): SignalRef | undefined => {
	if (['left', 'right'].includes(position)) return;
	return { signal: 'floor(width / 220)' };
};

/**
 * Gets the filter transform for hidden entries
 * @param hiddenEntries
 * @returns
 */
export const getHiddenEntriesFilter = (hiddenEntries: string[]): FilterTransform[] => {
	if (!hiddenEntries.length) return [];
	return [
		{
			type: 'filter',
			expr: `indexof(${JSON.stringify(hiddenEntries)}, datum.legendEntries) === -1`,
		},
	];
};

/**
 * Get the legend encodings
 * @param facets
 * @param legendProps
 * @returns
 */
export const getEncodings = (facets: Facet[], legendProps: LegendSpecProps): LegendEncode => {
	const symbolEncodings = getSymbolEncodings(facets, legendProps);
	const hoverEncodings = getHoverEncodings(facets, legendProps);
	const legendLabelsEncodings = getLegendLabelsEncodings(legendProps.legendLabels);
	const showHideEncodings = getShowHideEncodings(legendProps);
	// merge the encodings together
	return mergeLegendEncodings([symbolEncodings, legendLabelsEncodings, hoverEncodings, showHideEncodings]);
};

const getLegendLabelsEncodings = (legendLabels: LegendLabel[] | undefined): LegendEncode => {
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
};

const getHoverEncodings = (
	facets: Facet[],
	{ highlight, name, opacity, descriptions }: LegendSpecProps,
): LegendEncode => {
	if (highlight || descriptions) {
		return {
			entries: {
				name: `${name}_legendEntry`,
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
};

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
	facets?: Facet[],
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
					opacityEncoding,
				);
			}
			if ('value' in opacityEncoding && typeof opacityEncoding.value === 'number') {
				return getHighlightOpacityEncoding(
					{ value: opacityEncoding.value / HIGHLIGHT_CONTRAST_RATIO },
					opacityEncoding,
				);
			}
		}
		return getHighlightOpacityEncoding({ value: 1 / HIGHLIGHT_CONTRAST_RATIO }, { value: 1 });
	}
	return undefined;
};

const getHighlightOpacityEncoding = (
	highlightOpacity: BaseValueRef<number>,
	defaultOpacity: BaseValueRef<number>,
): ProductionRule<NumericValueRef> => {
	return [
		{
			test: 'highlightedSeries && datum.value !== highlightedSeries',
			...highlightOpacity,
		},
		defaultOpacity,
	];
};

export const getSymbolEncodings = (facets: Facet[], props: LegendSpecProps): LegendEncode => {
	const { color, lineType, lineWidth, name, opacity, symbolShape, colorScheme } = props;
	let update: SymbolEncodeEntry = {
		fill: [
			...getHiddenSeriesColorRule(props, 'gray-300'),
			getSymbolFacetEncoding<Color>({ facets, facetType: 'color', customValue: color }) || {
				value: spectrumColors[colorScheme]['categorical-100'],
			},
		],
		fillOpacity: getSymbolFacetEncoding<number>({ facets, facetType: 'opacity', customValue: opacity }),
		size: getSymbolFacetEncoding<number>({ facets, facetType: 'symbolSize' }),
		stroke: [
			...getHiddenSeriesColorRule(props, 'gray-300'),
			getSymbolFacetEncoding<Color>({ facets, facetType: 'color', customValue: color }) || {
				value: spectrumColors[colorScheme]['categorical-100'],
			},
		],
		strokeDash: getSymbolFacetEncoding<number[]>({ facets, facetType: 'lineType', customValue: lineType }),
		strokeOpacity: getSymbolFacetEncoding<number>({ facets, facetType: 'opacity' }),
		strokeWidth: getSymbolFacetEncoding<number>({ facets, facetType: 'lineWidth', customValue: lineWidth }),
		shape: getSymbolFacetEncoding<string>({ facets, facetType: 'symbolShape', customValue: symbolShape }),
	};
	// Remove undefined values
	update = JSON.parse(JSON.stringify(update));
	return {
		entries: {
			name: `${name}_legendEntry`,
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
}): BaseValueRef<T> | undefined => {
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

	const facet = facets.find((f) => f.facetType === facetType);
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

export const getHiddenSeriesColorRule = (
	{ colorScheme, hiddenSeries, isToggleable }: LegendSpecProps,
	colorValue: ColorValueV6,
): ({
	test?: string;
} & ColorValueRef)[] => {
	if (!isToggleable && !hiddenSeries) return [];
	return [{ test: 'indexof(hiddenSeries, datum.value) !== -1', value: getColorValue(colorValue, colorScheme) }];
};

/**
 * Gets the required encondings for show/hide toggleable legends
 * @param isToggleable
 * @returns
 */
export const getShowHideEncodings = (props: LegendSpecProps): LegendEncode => {
	const { colorScheme, hiddenSeries, isToggleable, name, onClick } = props;
	let hiddenSeriesEncode: LegendEncode = {};
	if (hiddenSeries || isToggleable) {
		hiddenSeriesEncode = {
			labels: {
				update: {
					fill: [
						...getHiddenSeriesColorRule(props, 'gray-500'),
						{ value: getColorValue('gray-700', colorScheme) },
					],
				},
			},
		};
	}

	let clickEncode: LegendEncode = {};
	if (isToggleable || onClick) {
		clickEncode = {
			entries: {
				name: `${name}_legendEntry`,
				interactive: true,
				enter: {
					fill: { value: 'transparent' },
					cursor: { value: 'pointer' },
				},
			},
		};
	}
	return mergeLegendEncodings([hiddenSeriesEncode, clickEncode]);
};

/**
 * Merge multiple vega spec legend encodings
 * @param encodings
 * @returns
 */
export const mergeLegendEncodings = (encodings: LegendEncode[]): LegendEncode => {
	let mergedEncodings = {};
	for (const encoding of encodings) {
		mergedEncodings = merge(mergedEncodings, encoding);
	}
	return mergedEncodings;
};
