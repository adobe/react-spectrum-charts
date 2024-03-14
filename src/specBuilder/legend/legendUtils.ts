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
import { getColorValue, getPathFromSymbolShape } from '@specBuilder/specUtils';
import { spectrumColors } from '@themes';
import merge from 'deepmerge';
import {
	FacetRef,
	FacetType,
	LegendDescription,
	LegendLabel,
	LegendSpecProps,
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

import { ColorValueV6 } from '@react-types/shared';
import { getHighlightOpacityAnimationValue } from '@specBuilder/marks/markUtils';

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
			expr: `indexof(${JSON.stringify(hiddenEntries)}, datum.${name}Entries) === -1`,
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

const getHoverEncodings = (facets: Facet[], props: LegendSpecProps): LegendEncode => {
	const { highlight, highlightedSeries, name, onMouseOver, onMouseOut, descriptions } = props;
	if (highlight || highlightedSeries || descriptions) {
		return {
			entries: {
				name: `${name}_legendEntry`,
				interactive: true,
				enter: {
					tooltip: getTooltip(descriptions, name), // only add tooltip if descriptions exist
				},
				update: {
					fill: { value: 'transparent' }, // need something here to trigger the tooltip
				},
			},
			labels: {
				update: {
					fillOpacity: getOpacityEncoding(props),
				},
			},
			symbols: {
				update: {
					fillOpacity: getSymbolOpacityEncoding(facets, props),
					strokeOpacity: getOpacityEncoding(props),
				},
			},
		};
	} else if (onMouseOver || onMouseOut) {
		return {
			entries: {
				name: `${name}_legendEntry`,
				interactive: true,
				enter: {
					fill: { value: 'transparent' },
				},
			},
		};
	}

	return {};
};

const getTooltip = (descriptions: LegendDescription[] | undefined, name: string) => {
	if (descriptions?.length) {
		return { signal: `merge(datum, {'rscComponentName': '${name}'})` };
	}
	return undefined;
};

/**
 * simple opacity encoding for legend labels and the symbol stroke opacity
 * @param legendProps
 * @returns opactiy encoding
 */
export const getOpacityEncoding = ({
	highlight,
	highlightedSeries,
	keys,
	name,
}: LegendSpecProps): ProductionRule<NumericValueRef> | undefined => {
	const highlightSignalName = keys ? `${name}_highlight` : 'highlightedSeries';
	// only add symbol opacity if highlight is true or highlightedSeries is defined
	if (highlight || highlightedSeries) {
		return getHighlightOpacityEncoding({ value: 1 / HIGHLIGHT_CONTRAST_RATIO }, { value: 1 }, highlightSignalName);
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
export const getSymbolOpacityEncoding = (
	facets: Facet[],
	{ highlight, highlightedSeries, keys, name, opacity, animations }: LegendSpecProps
): ProductionRule<NumericValueRef> | undefined => {
	const highlightSignalName = keys ? `${name}_highlight` : 'highlightedSeries';
	// only add symbol opacity if highlight is true or highlightedSeries is defined
	if (highlight || highlightedSeries) {
		if (facets || opacity) {
			const opacityEncoding = getSymbolFacetEncoding<number>({
				facets,
				facetType: 'opacity',
				customValue: opacity,
				name,
			}) ?? { value: 1 };
			//TODO: add comments/tests/etc
			if (animations == true) {
				return getHighlightOpacityAnimationEncoding(
					getHighlightOpAnimationValue(opacityEncoding),
					opacityEncoding,
					highlightSignalName
				);
			}
			if ('signal' in opacityEncoding) {
				return getHighlightOpacityEncoding(
					{ signal: opacityEncoding.signal + ` / ${HIGHLIGHT_CONTRAST_RATIO}` },
					opacityEncoding,
					highlightSignalName
				);
			}
			if ('value' in opacityEncoding && typeof opacityEncoding.value === 'number') {
				return getHighlightOpacityEncoding(
					{ value: opacityEncoding.value / HIGHLIGHT_CONTRAST_RATIO },
					opacityEncoding,
					highlightSignalName
				);
			}
		}
		return getHighlightOpacityEncoding({ value: 1 / HIGHLIGHT_CONTRAST_RATIO }, { value: 1 }, highlightSignalName);
	}
	return undefined;
};

const getHighlightOpacityEncoding = (
	highlightOpacity: BaseValueRef<number>,
	defaultOpacity: BaseValueRef<number>,
	highlightSignalName: string
): ProductionRule<NumericValueRef> => {
	return [
		{
			test: `${highlightSignalName} && datum.value !== ${highlightSignalName}`,
			...highlightOpacity,
		},
		defaultOpacity,
	];
};
//TODO: add comments/tests/etc
const getHighlightOpAnimationValue = (opacityEncoding: BaseValueRef<number>,): { signal: string } => {
	if ('signal' in opacityEncoding) {
		return getHighlightOpacityAnimationValue(opacityEncoding);
	}
	return getHighlightOpacityAnimationValue({ value: 1 })
}
//TODO: add comments/tests/etc
const getHighlightOpacityAnimationEncoding = (
	highlightOpacity: BaseValueRef<number>,
	defaultOpacity: BaseValueRef<number>,
	highlightSignalName: string,
	): ProductionRule<NumericValueRef> => {
	return [
		{
			test: `${highlightSignalName} && datum.value !== ${highlightSignalName}`,
			...highlightOpacity
		},
		{
			test: `!${highlightSignalName} && datum.value !== ${highlightSignalName}_prev`,
			...highlightOpacity
		},
		defaultOpacity,
	]
}

export const getSymbolEncodings = (facets: Facet[], props: LegendSpecProps): LegendEncode => {
	const { color, lineType, lineWidth, name, opacity, symbolShape, colorScheme } = props;
	let update: SymbolEncodeEntry = {
		fill: [
			...getHiddenSeriesColorRule(props, 'gray-300'),
			getSymbolFacetEncoding<Color>({ facets, facetType: 'color', customValue: color, name }) ?? {
				value: spectrumColors[colorScheme]['categorical-100'],
			},
		],
		fillOpacity: getSymbolFacetEncoding<number>({ facets, facetType: 'opacity', customValue: opacity, name }),
		size: getSymbolFacetEncoding<number>({ facets, facetType: 'symbolSize', name }),
		stroke: [
			...getHiddenSeriesColorRule(props, 'gray-300'),
			getSymbolFacetEncoding<Color>({ facets, facetType: 'color', customValue: color, name }) ?? {
				value: spectrumColors[colorScheme]['categorical-100'],
			},
		],
		strokeDash: getSymbolFacetEncoding<number[]>({ facets, facetType: 'lineType', customValue: lineType, name }),
		strokeOpacity: getSymbolFacetEncoding<number>({ facets, facetType: 'opacity', name }),
		strokeWidth: getSymbolFacetEncoding<number>({ facets, facetType: 'lineWidth', customValue: lineWidth, name }),
		shape: getSymbolFacetEncoding<string>({ facets, facetType: 'symbolShape', customValue: symbolShape, name }),
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
	name,
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
			signal: `scale('${signal}', data('${name}Aggregate')[datum.index].${facet.field})[indexof(domain('${scale}'), data('${name}Aggregate')[datum.index].${secondaryFacet.field})% length(scale('${signal}', data('${name}Aggregate')[datum.index].${facet.field}))]`,
		};
	}

	return { signal: `scale('${facetType}', data('${name}Aggregate')[datum.index].${facet.field})` };
};

export const getHiddenSeriesColorRule = (
	{ colorScheme, hiddenSeries, isToggleable, keys }: LegendSpecProps,
	colorValue: ColorValueV6
): ({
	test?: string;
} & ColorValueRef)[] => {
	// if the legend doesn't support hide/show or if it has custom keys, don't add the hidden series color rule
	if ((!isToggleable && !hiddenSeries) || keys) return [];
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
	if ((hiddenSeries || isToggleable) && !keys) {
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
	if ((isToggleable && !keys) || onClick) {
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
