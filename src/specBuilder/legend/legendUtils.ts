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
	COMPONENT_NAME,
	DEFAULT_OPACITY_RULE,
	FILTERED_TABLE,
	HIGHLIGHTED_GROUP,
	HIGHLIGHTED_SERIES,
	HIGHLIGHT_CONTRAST_RATIO,
	LINE_TYPE_SCALE,
	LINE_WIDTH_SCALE,
	OPACITY_SCALE,
	SYMBOL_SHAPE_SCALE,
	SYMBOL_SIZE_SCALE
} from '@constants';
import { getColorValue, getPathFromSymbolShape } from '@specBuilder/specUtils';
import { spectrumColors } from '@themes';
import merge from 'deepmerge';
import {
	BaseValueRef,
	Color,
	ColorValueRef,
	FilterTransform,
	GuideEncodeEntry,
	LegendEncode,
	Mark,
	NumericValueRef,
	ProductionRule,
	SignalRef,
	SymbolEncodeEntry
} from 'vega';

import { ColorValueV6 } from '@react-types/shared';
import { getLegendMarkOpacityRules, getLegendSeriesOpacityRules } from '@specBuilder/marks/markUtils';

import {
	FacetRef,
	FacetType,
	LegendDescription,
	LegendLabel,
	LegendSpecProps,
	Position,
	SecondaryFacetType,
} from '../../types';

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
export const getHiddenEntriesFilter = (hiddenEntries: string[], name: string): FilterTransform[] => {
	if (!hiddenEntries.length) return [];
	return [
		{
			type: 'filter',
			expr: `indexof(${JSON.stringify(hiddenEntries)}, datum.${name}Entries) === -1`
		}
	];
};

/**
 * Get the legend encodings
 * @param facets
 * @param legendProps
 * @param marks
 * @returns
 */
export const getEncodings = (facets: Facet[], legendProps: LegendSpecProps, marks: Mark[]): LegendEncode => {
	const symbolEncodings = getSymbolEncodings(facets, legendProps);
	const hoverEncodings = getHoverEncodings(facets, legendProps);
	const legendLabelsEncodings = getLegendLabelsEncodings(legendProps.name, legendProps.legendLabels);
	const showHideEncodings = getShowHideEncodings(legendProps);
	// merge the encodings together
	return mergeLegendEncodings([symbolEncodings, legendLabelsEncodings, hoverEncodings, showHideEncodings]);
};

const getLegendLabelsEncodings = (name: string, legendLabels: LegendLabel[] | undefined): LegendEncode => {
	if (legendLabels) {
		return {
			labels: {
				update: {
					text: [
						{
							// Test whether a legendLabel exists for the seriesName, if not use the seriesName
							test: `indexof(pluck(${name}_labels, 'seriesName'), datum.value) > -1`,
							signal: `${name}_labels[indexof(pluck(${name}_labels, 'seriesName'), datum.value)].label`,
						},
						{ signal: 'datum.value' }
					]
				}
			}
		};
	}
	return {};
};

const getHoverEncodings = (facets: Facet[], props: LegendSpecProps, marks: Mark[]): LegendEncode => {
	const { highlight, highlightedSeries, name, onMouseOver, onMouseOut, descriptions } = props;
	if (highlight || highlightedSeries || descriptions) {
		return {
			entries: {
				name: `${name}_legendEntry`,
				interactive: true,
				enter: {
					tooltip: getTooltip(descriptions, name) // only add tooltip if descriptions exist
				},
				update: {
					fill: { value: 'transparent' } // need something here to trigger the tooltip
				}
			},
			labels: {
				update: {
					opacity: getOpacityEncoding(props, marks),
				},
			},
			symbols: {
				update: {
					opacity: getOpacityEncoding(props, marks),
				},
			},
		};
	} else if (onMouseOver || onMouseOut) {
		return {
			entries: {
				name: `${name}_legendEntry`,
				interactive: true,
				enter: {
					fill: { value: 'transparent' }
				}
			}
		};
	}

	return {};
};

const getTooltip = (descriptions: LegendDescription[] | undefined, name: string) => {
	if (descriptions?.length) {
		return { signal: `merge(datum, {'${COMPONENT_NAME}': '${name}'})` };
	}
	return undefined;
};

/**
 * simple opacity encoding for legend labels and the symbol stroke opacity
 * @param legendProps
 * @returns opacity encoding
 * @param marks
 */
export const getOpacityEncoding = ({
	animations,
	highlight,
	highlightedSeries,
	keys,
}: LegendSpecProps): ProductionRule<NumericValueRef> | undefined => {
	const highlightSignalName = keys?.length ? HIGHLIGHTED_GROUP : HIGHLIGHTED_SERIES;
	// only add symbol opacity if highlight is true or highlightedSeries is defined
	if (highlight || highlightedSeries) {

		//If animations are enabled, set legend animation opacity rules
		
		if (animations) {
			/*
			this is the check for chart type and is the reason the spec.marks had to be pushed to
			getCategoricalLegend in legendSpecBuilder
			 */
			if (marks.some((mark) => mark.name == 'line0_group' || mark.name == 'area0_group')) {
				// get opacity rules for legend if the chart relies on Series ID for highlighting
				return getLegendSeriesOpacityRules();
			} else {
				// get opacity rules for legend if the chart relies on Mark ID for highlighting
				return getLegendMarkOpacityRules();
			}
		}
		return [
			{
				test: `isValid(${highlightSignalName}) && datum.value !== ${highlightSignalName}`,
				value: 1 / HIGHLIGHT_CONTRAST_RATIO,
			},
			DEFAULT_OPACITY_RULE
		];
	}
	return undefined;
};

export const getSymbolEncodings = (facets: Facet[], props: LegendSpecProps): LegendEncode => {
	const { color, lineType, lineWidth, name, opacity, symbolShape, colorScheme } = props;
	const enter: SymbolEncodeEntry = {
		fillOpacity: getSymbolFacetEncoding<number>({ facets, facetType: OPACITY_SCALE, customValue: opacity, name }),
		shape: getSymbolFacetEncoding<string>({
			facets,
			facetType: SYMBOL_SHAPE_SCALE,
			customValue: symbolShape,
			name
		}),
		size: getSymbolFacetEncoding<number>({ facets, facetType: SYMBOL_SIZE_SCALE, name }),
		strokeDash: getSymbolFacetEncoding<number[]>({
			facets,
			facetType: LINE_TYPE_SCALE,
			customValue: lineType,
			name
		}),
		strokeWidth: getSymbolFacetEncoding<number>({
			facets,
			facetType: LINE_WIDTH_SCALE,
			customValue: lineWidth,
			name
		})
	};
	const update: SymbolEncodeEntry = {
		fill: [
			...getHiddenSeriesColorRule(props, 'gray-300'),
			getSymbolFacetEncoding<Color>({ facets, facetType: COLOR_SCALE, customValue: color, name }) ?? {
				value: spectrumColors[colorScheme]['categorical-100']
			}
		],
		stroke: [
			...getHiddenSeriesColorRule(props, 'gray-300'),
			getSymbolFacetEncoding<Color>({ facets, facetType: COLOR_SCALE, customValue: color, name }) ?? {
				value: spectrumColors[colorScheme]['categorical-100']
			}
		]
	};
	// Remove undefined values
	const symbols: GuideEncodeEntry<SymbolEncodeEntry> = JSON.parse(JSON.stringify({ enter, update }));
	return {
		entries: {
			name: `${name}_legendEntry`
		},
		symbols
	};
};

const getSymbolFacetEncoding = <T>({
		customValue,
		facets,
		facetType,
		name
	}: {
	customValue?: FacetRef<T>;
	facets?: Facet[];
	facetType: FacetType;
	name: string;
}): BaseValueRef<T> | undefined => {
	if (customValue) {
		if (typeof customValue === 'string') {
			return { signal: `scale('${facetType}', data('${name}Aggregate')[datum.index].${customValue})` };
		}
		return { value: customValue.value };
	}

	if (!facets) return;

	const secondaryFacetMapping: { [key in FacetType]: { scale: SecondaryFacetType; signal: string } } = {
		color: { scale: 'secondaryColor', signal: 'colors' },
		linearColor: { scale: 'secondaryColor', signal: 'colors' },
		lineType: { scale: 'secondaryLineType', signal: 'lineTypes' },
		lineWidth: { scale: 'secondaryLineWidth', signal: 'lineWidths' },
		opacity: { scale: 'secondaryOpacity', signal: 'opacities' },
		symbolShape: { scale: 'secondarySymbolShape', signal: 'symbolShapes' },
		symbolSize: { scale: 'secondarySymbolSize', signal: 'symbolSizes' },
		symbolPathWidth: { scale: 'secondarySymbolPathWidth', signal: 'symbolPathWidths' },
	};

	const facet = facets.find((f) => f.facetType === facetType);
	if (!facet) return;
	const secondaryFacet = facets.find((f) => f.facetType === secondaryFacetMapping[facetType].scale);
	if (secondaryFacet) {
		const { scale, signal } = secondaryFacetMapping[facetType];
		return {
			signal: `scale('${signal}', data('${name}Aggregate')[datum.index].${facet.field})[indexof(domain('${scale}'), data('${name}Aggregate')[datum.index].${secondaryFacet.field})% length(scale('${signal}', data('${name}Aggregate')[datum.index].${facet.field}))]`
		};
	}

	return { signal: `scale('${facetType}', data('${name}Aggregate')[datum.index].${facet.field})` };
};

export const getHiddenSeriesColorRule = (
	{ colorScheme, hiddenSeries, isToggleable, keys, name }: LegendSpecProps,
	colorValue: ColorValueV6
): ({
	test?: string;
} & ColorValueRef)[] => {
	if (!isToggleable && !hiddenSeries.length) return [];
	if (keys?.length) {
		return [
			{
				test: `indexof(pluck(data('${FILTERED_TABLE}'), '${name}_highlightGroupId'), datum.value) === -1`,
				value: getColorValue(colorValue, colorScheme),
			},
		];
	}
	return [{ test: 'indexof(hiddenSeries, datum.value) !== -1', value: getColorValue(colorValue, colorScheme) }];
};

/**
 * Gets the required encondings for show/hide toggleable legends
 * @param isToggleable
 * @returns
 */
export const getShowHideEncodings = (props: LegendSpecProps): LegendEncode => {
	const { colorScheme, hiddenSeries, isToggleable, keys, name, onClick } = props;
	let hiddenSeriesEncode: LegendEncode = {};
	// if the legend supports hide/show and doesn't have custom keys, add the hidden series encodings
	if (hiddenSeries || isToggleable) {
		hiddenSeriesEncode = {
			labels: {
				update: {
					fill: [
						...getHiddenSeriesColorRule(props, 'gray-500'),
						{ value: getColorValue('gray-700', colorScheme) }
					]
				}
			}
		};
	}

	let clickEncode: LegendEncode = {};
	if ((isToggleable && !keys) || onClick) {
		clickEncode = {
			entries: {
				name: `${name}_legendEntry`,
				interactive: true,
				enter: {
					fill: { value: 'transparent' },
					cursor: { value: 'pointer' }
				}
			}
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

/**
 * Gets the symbol type (shape) for the legend
 * @param symbolShape
 * @returns symbolShape
 */
export const getSymbolType = (symbolShape: FacetRef<string> | undefined): string => {
	if (symbolShape && typeof symbolShape === 'object' && 'value' in symbolShape)
		return getPathFromSymbolShape(symbolShape.value);
	return 'circle';
};
