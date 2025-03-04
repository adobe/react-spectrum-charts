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
	BACKGROUND_COLOR,
	FILTERED_TABLE,
	HIGHLIGHTED_GROUP,
	HIGHLIGHTED_ITEM,
	HIGHLIGHTED_SERIES,
	LINEAR_COLOR_SCALE,
	LINE_TYPE_SCALE,
	LINE_WIDTH_SCALE,
	OPACITY_SCALE,
	SELECTED_GROUP,
	SELECTED_ITEM,
	SELECTED_SERIES,
	SERIES_ID,
	SYMBOL_PATH_WIDTH_SCALE,
	SYMBOL_SHAPE_SCALE,
	SYMBOL_SIZE_SCALE,
	TABLE,
	NAVIGATION_ID_KEY,
	NAVIGATION_PAIRS
} from '@constants';
import { Area, Axis, Bar, Legend, Line, Scatter, Title } from '@rsc';
import { Combo } from '@rsc/alpha';
import { BigNumber, Donut } from '@rsc/rc';
import colorSchemes from '@themes/colorSchemes';
import { produce } from 'immer';
import { Data, LinearScale, OrdinalScale, PointScale, Scale, Signal, Spec } from 'vega';
import {default as DataNavigator} from 'data-navigator'
import {StructureOptions, DimensionList, DimensionDatum, Structure, NavigationRules, Dimensions, DimensionNavigationRules, ChildmostNavigationStrategy} from '../../node_modules/data-navigator/dist/src/data-navigator'

import {
	AreaElement,
	AxisElement,
	BarElement,
	ChartColors,
	ChartSymbolShape,
	ColorScale,
	ColorScheme,
	Colors,
	ComboElement,
	DonutElement,
	LegendElement,
	LineElement,
	LineType,
	LineTypes,
	LineWidth,
	Opacities,
	SanitizedSpecProps,
	ScatterElement,
	SymbolShapes,
	SymbolSize,
	TitleElement,
} from '../types';
import { addArea } from './area/areaSpecBuilder';
import { addAxis } from './axis/axisSpecBuilder';
import { addBar } from './bar/barSpecBuilder';
import { addCombo } from './combo/comboSpecBuilder';
import { getSeriesIdTransform } from './data/dataUtils';
import { addDonut } from './donut/donutSpecBuilder';
import { setHoverOpacityForMarks } from './legend/legendHighlightUtils';
import { addLegend } from './legend/legendSpecBuilder';
import { addLine } from './line/lineSpecBuilder';
import { getOrdinalScale } from './scale/scaleSpecBuilder';
import { addScatter } from './scatter/scatterSpecBuilder';
import { getGenericValueSignal } from './signal/signalSpecBuilder';
import {
	getColorValue,
	getFacetsFromScales,
	getLineWidthPixelsFromLineWidth,
	getPathFromSymbolShape,
	getStrokeDashFromLineType,
	getSymbolWidthFromRscSymbolSize,
	getVegaSymbolSizeFromRscSymbolSize,
	initializeSpec,
} from './specUtils';
import { addTitle } from './title/titleSpecBuilder';

export function buildSpec(props: SanitizedSpecProps) {
	const {
		backgroundColor,
		children,
		colors,
		colorScheme,
		description,
		hiddenSeries,
		highlightedItem,
		highlightedSeries,
		idKey,
		lineTypes,
		lineWidths,
		opacities,
		symbolShapes,
		symbolSizes,
		chartLayers,
		title,
	} = props;
	let spec = initializeSpec(null, { backgroundColor, colorScheme, description, title });
	spec.signals = getDefaultSignals(props);
	spec.scales = getDefaultScales(colors, colorScheme, lineTypes, lineWidths, opacities, symbolShapes, symbolSizes);

	// need to build the spec in a specific order
	const buildOrder = new Map();
	buildOrder.set(Area, 0);
	buildOrder.set(Bar, 0);
	buildOrder.set(Line, 0);
	buildOrder.set(Donut, 0);
	buildOrder.set(Scatter, 0);
	buildOrder.set(Combo, 0);
	buildOrder.set(Legend, 1);
	buildOrder.set(Axis, 2);
	buildOrder.set(Title, 3);

	let { areaCount, axisCount, barCount, comboCount, donutCount, legendCount, lineCount, scatterCount } =
		initializeComponentCounts();
	const specProps = { colorScheme, idKey, highlightedItem };
	// const chartLayers: DimensionList = []
	spec = [...children]
		.sort((a, b) => buildOrder.get(a.type) - buildOrder.get(b.type))
		.reduce((acc: Spec, cur) => {
			if (!('displayName' in cur.type)) {
				console.error('Invalid component type. Component is missing display name.');
				return acc;
			}
			/**
			 * type.displayName is used because it doesn't get minified, unlike type.name
			 * If we simply compare cur.type to the component,
			 * that uses referential equailty which fails in production when the component is imported from a different module like ./alpha
			 */
			switch (cur.type.displayName) {
				case Area.displayName:
					areaCount++;
					return addArea(acc, { ...(cur as AreaElement).props, ...specProps, index: areaCount });
				case Axis.displayName:
					axisCount++;
					return addAxis(acc, { ...(cur as AxisElement).props, ...specProps, index: axisCount });
				case Bar.displayName:
					barCount++;
					return addBar(acc, { ...(cur as BarElement).props, ...specProps, index: barCount });
				case Donut.displayName:
					donutCount++;
					return addDonut(acc, { ...(cur as DonutElement).props, ...specProps, index: donutCount });
				case Legend.displayName:
					legendCount++;
					return addLegend(acc, {
						...(cur as LegendElement).props,
						...specProps,
						index: legendCount,
						hiddenSeries,
						highlightedSeries,
					});
				case Line.displayName:
					lineCount++;
					return addLine(acc, { ...(cur as LineElement).props, ...specProps, index: lineCount });
				case Scatter.displayName:
					scatterCount++;
					return addScatter(acc, { ...(cur as ScatterElement).props, ...specProps, index: scatterCount });
				case Title.displayName:
					// No title count. There can only be one title.
					return addTitle(acc, { ...(cur as TitleElement).props });
				case BigNumber.displayName:
					// Do nothing and do not throw an error
					return acc;
				case Combo.displayName:
					comboCount++;
					return addCombo(acc, { ...(cur as ComboElement).props, ...specProps, index: comboCount });
				default:
					console.error(`Invalid component type: ${cur.type.displayName} is not a supported <Chart> child`);
					return acc;
			}
		}, spec);

	// copy the spec so we don't mutate the original
	spec = JSON.parse(JSON.stringify(spec));
	spec.data = addData(spec.data ?? [], { facets: getFacetsFromScales(spec.scales) });

	// add signals and update marks for controlled highlighting if there isn't a legend with highlight enabled
	if (highlightedSeries) {
		setHoverOpacityForMarks(spec.marks ?? []);
	}

	// clear out all scales that don't have any fields on the domain
	spec = removeUnusedScales(spec);

	// now that our vega spec is made, we can generate our navigation spec (which are our dimensions)
	buildNavigationDimensions(spec,children,chartLayers)
	return spec;
}

export const buildNavigationDimensions = (spec, children, out: DimensionList) => {
	let popped: DimensionDatum | undefined = undefined;
	let navigableChartType = "";
	let isDodged = false;
	const navigableDimensions = {};
	const childArray = [...children]
	let count = 0;

	const dimensionTypes = {
		"categorical": {
			type: "categorical",
			createNumericalSubdivisions: 1
		},
		// curently we don't support any numerical scales, but later (for scatter) you'll want to
		"numerical": {
			type: "numerical",
			createNumericalSubdivisions: 4 // we should *at least* divide numerical dimensions into navigable quartiles
		}
	}

	let i = 0;
	for (i = 0; i < childArray.length; i++) {
		// below, we validate that we only create data navigator dimensions for "valid" chart types
		// as of now, only "bar" chart variants are valid
		if (childArray[i].type.displayName === Bar.displayName) {
			if (!navigableChartType) {
				// we should ideally have all of this stored somewhere!
				// below are the scale types that we want to look for that bar might use
				// (not sure if bar uses time, but I included it here)
				navigableChartType = childArray[i].type.displayName
				navigableDimensions[childArray[i].type.displayName] = {
					ordinal: dimensionTypes.categorical,
					band: dimensionTypes.categorical,
					point: dimensionTypes.categorical,
					time: dimensionTypes.categorical
				}
			}
			if (!isDodged && childArray[i].props?.type === 'dodged') {
				isDodged = true
			} 
		}
	}
	const scales = (spec.scales || []);
	scales.forEach(s => {
		// the code below probably doesn't need too much tweaking between types?
		// we don't want to include "legend" from the scales, since that is redundant
		// we also want to make sure that we include the fields here!
		if (navigableDimensions[navigableChartType]?.[s.type] && s.domain?.fields?.[0] && !(s.name?.includes("legend"))) {
			count++
			// since we only support left/right (1 dimension) and up/down (second dimension), we don't want more than 3 dimensions
			if (count < 3) {
				let childmostNavigation: ChildmostNavigationStrategy = "within"
				// generally, we default to left/right but sometimes also want to check for y axis stuff
				let navigationRules = !s.name?.includes("y") ? NAVIGATION_PAIRS.HORIZONTAL : NAVIGATION_PAIRS.VERTICAL
				
				if (count === 2) {
					// if we have a bar chart with 2 dimensions that isn't dodged?
					// this is a stacked bar, so we nav across instead of within
					if (navigableChartType === Bar.displayName && !isDodged && out[0].behavior) {
						childmostNavigation = "across"
						out[0].behavior.childmostNavigation = "across"
					}

					navigationRules = NAVIGATION_PAIRS.VERTICAL
					if (s.name?.includes("x") || out[0].navigationRules === NAVIGATION_PAIRS.VERTICAL) {
						// if we already used vertical or current is horizontal, we want to set current dimension to horizonal
						navigationRules = NAVIGATION_PAIRS.HORIZONTAL
						// we want to make absolutely sure that the previous dimension is correct as vertical
						out[0].navigationRules = NAVIGATION_PAIRS.VERTICAL as DimensionNavigationRules
						// we want to start with left/right always, so we pop this out to add after our current dimension
						popped = out.pop()
					}
				}
				const d = navigableDimensions[navigableChartType][s.type]
				const dimension: DimensionDatum = {
					dimensionKey: s.domain.fields[0],
					type: d.type,
					// these are operations we perform when creating the dimension
					operations: {
						createNumericalSubdivisions: d.createNumericalSubdivisions,
						compressSparseDivisions: true
					},
					// these are props for setting structural behavior patterns (which influence navigation)
					behavior: {
						extents: "circular",
						childmostNavigation
					},
					// here we specify a function to create unique division ids
					divisionOptions: {
						divisionNodeIds: (dimensionKey, keyValue, i) => "_" + keyValue + "_key_" + dimensionKey + i
					},
					// here we set the navigation rules
					navigationRules: navigationRules as DimensionNavigationRules
				}
				out.push(dimension)
				if (popped) {
					out.push(popped)
				}
			}
		}
	})
}

export const buildNavigationStructure = (data, props, chartLayers) : Structure => {
	const layers = props.list ? "" : chartLayers;
	const structureOptions : StructureOptions = {
		data,
		idKey: NAVIGATION_ID_KEY,
		// addIds: true,
		// keysForIdGeneration: [],
		dimensions: {
			values: layers
		}
	}

	// now we build with data navigator:
	return DataNavigator.structure(structureOptions)
}

export const buildStructureHandler = (structure: Structure, navigationRules: NavigationRules, dimensions: Dimensions) => {
	return DataNavigator.input({
		structure,
		navigationRules,
		entryPoint: dimensions[Object.keys(dimensions)[0]].nodeId,
		// exitPoint
	})
}

export const removeUnusedScales = produce<Spec>((spec) => {
	spec.scales = spec.scales?.filter((scale) => {
		return !('domain' in scale && scale.domain && 'fields' in scale.domain && scale.domain.fields.length === 0);
	});
});

const initializeComponentCounts = () => {
	return {
		areaCount: -1,
		axisCount: -1,
		barCount: -1,
		comboCount: -1,
		donutCount: -1,
		legendCount: -1,
		lineCount: -1,
		scatterCount: -1,
	};
};

export const getDefaultSignals = ({
	backgroundColor,
	colors,
	colorScheme,
	lineTypes,
	opacities,
	hiddenSeries,
	highlightedItem,
	highlightedSeries,
}: SanitizedSpecProps): Signal[] => {
	// if the background color is transparent, then we want to set the signal background color to gray-50
	// if the signal background color were transparent then backgroundMarks and annotation fill would also be transparent
	const signalBackgroundColor = backgroundColor === 'transparent' ? 'gray-50' : backgroundColor;
	return [
		getGenericValueSignal(BACKGROUND_COLOR, getColorValue(signalBackgroundColor, colorScheme)),
		getGenericValueSignal('colors', getTwoDimensionalColorScheme(colors, colorScheme)),
		getGenericValueSignal('lineTypes', getTwoDimensionalLineTypes(lineTypes)),
		getGenericValueSignal('opacities', getTwoDimensionalOpacities(opacities)),
		getGenericValueSignal('hiddenSeries', hiddenSeries ?? []),
		getGenericValueSignal(HIGHLIGHTED_ITEM, highlightedItem),
		getGenericValueSignal(HIGHLIGHTED_GROUP),
		getGenericValueSignal(HIGHLIGHTED_SERIES, highlightedSeries),
		getGenericValueSignal(SELECTED_ITEM),
		getGenericValueSignal(SELECTED_SERIES),
		getGenericValueSignal(SELECTED_GROUP),
	];
};

export const getTwoDimensionalColorScheme = (colors: ChartColors, colorScheme: ColorScheme): string[][] => {
	if (isColors(colors)) {
		return getColors(colors, colorScheme).map((color) => [color]);
	}
	return colors.map((color) => getColors(color, colorScheme));
};

export const getTwoDimensionalLineTypes = (lineTypes: LineTypes): number[][][] => {
	// 1D array of line types
	if (isLineTypeArray(lineTypes)) {
		return getStrokeDashesFromLineTypes(lineTypes).map((strokeDash) => [strokeDash]);
	}
	// 2D array of line types
	return lineTypes.map((lineTypeArray) => getStrokeDashesFromLineTypes(lineTypeArray));
};

export const getTwoDimensionalOpacities = (opacities: Opacities | undefined): number[][] => {
	if (!opacities) return [[1]];
	// 1D array of line types
	if (isNumberArray(opacities)) {
		return opacities.map((opacity) => [opacity]);
	}
	// 2D array of line types
	return opacities;
};

const getDefaultScales = (
	colors: ChartColors,
	colorScheme: ColorScheme,
	lineTypes: LineTypes,
	lineWidths: LineWidth[],
	opacities: Opacities | undefined,
	symbolShapes: SymbolShapes,
	symbolSizes: [SymbolSize, SymbolSize]
): Scale[] => [
	getColorScale(colors, colorScheme),
	getLinearColorScale(colors, colorScheme),
	getLineTypeScale(lineTypes),
	getLineWidthScale(lineWidths),
	getOpacityScale(opacities),
	getSymbolShapeScale(symbolShapes),
	getSymbolSizeScale(symbolSizes),
	getSymbolPathWidthScale(symbolSizes),
];

export const getColorScale = (colors: ChartColors, colorScheme: ColorScheme): OrdinalScale => {
	// if a two dimensional scale was provided, then just grab the first color in each scale and set that as the scale range
	const range = isColors(colors) ? getColors(colors, colorScheme) : colors.map((c) => getColors(c, colorScheme)[0]);
	return getOrdinalScale('color', range);
};

export const getLinearColorScale = (colors: ChartColors, colorScheme: ColorScheme): LinearScale => {
	// if a two dimensional scale was provided, then just grab the first color in each scale and set that as the scale range
	const range = isColors(colors) ? getColors(colors, colorScheme) : colors.map((c) => getColors(c, colorScheme)[0]);
	return {
		name: LINEAR_COLOR_SCALE,
		type: 'linear',
		range,
		domain: { data: TABLE, fields: [] },
	};
};

export const getLineTypeScale = (lineTypes: LineTypes): OrdinalScale => {
	// if a two dimensional scale was provided, then just grab the first color in each scale and set that as the scale range
	const range = isLineTypeArray(lineTypes)
		? getStrokeDashesFromLineTypes(lineTypes)
		: lineTypes.map((lineTypesArray) => getStrokeDashFromLineType(lineTypesArray[0]));
	return getOrdinalScale(LINE_TYPE_SCALE, range);
};

export const getSymbolShapeScale = (symbolShapes: SymbolShapes): OrdinalScale => {
	// if a two dimensional scale was provided, then just grab the first color in each scale and set that as the scale range
	const range = isSymbolShapeArray(symbolShapes)
		? getPathsFromSymbolShapes(symbolShapes)
		: symbolShapes.map((symbolShape) => getPathFromSymbolShape(symbolShape[0]));
	return getOrdinalScale(SYMBOL_SHAPE_SCALE, range);
};

/**
 * returns the symbol size scale
 * @param symbolSizes
 * @returns LinearScale
 */
export const getSymbolSizeScale = (symbolSizes: [SymbolSize, SymbolSize]): LinearScale => ({
	name: SYMBOL_SIZE_SCALE,
	type: 'linear',
	zero: false,
	range: symbolSizes.map((symbolSize) => getVegaSymbolSizeFromRscSymbolSize(symbolSize)),
	domain: { data: TABLE, fields: [] },
});

/**
 * returns the path width scale
 * @param symbolSizes
 * @returns LinearScale
 */
export const getSymbolPathWidthScale = (symbolSizes: [SymbolSize, SymbolSize]): LinearScale => ({
	name: SYMBOL_PATH_WIDTH_SCALE,
	type: 'linear',
	zero: false,
	range: symbolSizes.map((symbolSize) => getSymbolWidthFromRscSymbolSize(symbolSize)),
	domain: { data: TABLE, fields: [] },
});

export const getLineWidthScale = (lineWidths: LineWidth[]): OrdinalScale => {
	const range = lineWidths.map((lineWidth) => getLineWidthPixelsFromLineWidth(lineWidth));
	return getOrdinalScale(LINE_WIDTH_SCALE, range);
};

export const getOpacityScale = (opacities?: Opacities): OrdinalScale | PointScale => {
	if (opacities?.length) {
		const range = isNumberArray(opacities) ? opacities : opacities.map((opacityArray) => opacityArray[0]);
		return getOrdinalScale(OPACITY_SCALE, range);
	}
	return {
		name: OPACITY_SCALE,
		type: 'point',
		range: [1, 0],
		padding: 1,
		align: 1,
		domain: { data: TABLE, fields: [] },
	};
};

function getColors(colors: Colors, colorScheme: ColorScheme): string[] {
	if (Array.isArray(colors)) {
		return colors.map((color: string) => getColorValue(color, colorScheme));
	}
	return colorSchemes[colors];
}

function getStrokeDashesFromLineTypes(lineTypes: LineType[]): number[][] {
	return lineTypes.map((lineType) => getStrokeDashFromLineType(lineType));
}

function getPathsFromSymbolShapes(symbolShapes: ChartSymbolShape[]) {
	return symbolShapes.map((symbolShape) => getPathFromSymbolShape(symbolShape));
}

/**
 * Adds a formula transform to the TABLE data that combines all the facets into a single key
 */
export const addData = produce<Data[], [{ facets: string[] }]>((data, { facets }) => {
	if (facets.length === 0) return;
	data[0]?.transform?.push(...getSeriesIdTransform(facets));

	// add a filter transform to the TABLE data that filters out any hidden series
	const index = data.findIndex((datum) => datum.name === FILTERED_TABLE);
	if (index !== -1) {
		data[index].transform = [
			{ type: 'filter', expr: `indexof(hiddenSeries, datum.${SERIES_ID}) === -1` },
			...(data[index].transform ?? []),
		];
	}
});

export const isColorScale = (colors: ChartColors): colors is ColorScale => {
	return Boolean(!Array.isArray(colors) && colors in colorSchemes);
};

export const isColors = (colors: ChartColors): colors is Colors => {
	return isColorScale(colors) || colors.some((color) => !isColorScale(color) && typeof color === 'string');
};

export const isLineTypeArray = (lineTypes: LineTypes): lineTypes is LineType[] => {
	return lineTypes.some((lineType) => typeof lineType === 'string' || isStrokeDashArray(lineType));
};

export const isStrokeDashArray = (lineType: LineType | LineType[]): lineType is number[] => {
	return Array.isArray(lineType) && !lineType.some((value) => typeof value !== 'number');
};

export const isNumberArray = (opacities: Opacities): opacities is number[] => {
	return !opacities.some((opacity) => Array.isArray(opacity));
};

export const isSymbolShapeArray = (symbolShapes: SymbolShapes): symbolShapes is ChartSymbolShape[] => {
	return !symbolShapes.some((symbolShape) => Array.isArray(symbolShape));
};
