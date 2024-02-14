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
import { Trendline } from '@components/Trendline';
import { FILTERED_TABLE, LINEAR_PADDING, MARK_ID, MS_PER_DAY, TRENDLINE_VALUE } from '@constants';
import { getSeriesIdTransform, getTableData } from '@specBuilder/data/dataUtils';
import { getLineHoverMarks, getLineStrokeOpacity } from '@specBuilder/line/lineMarkUtils';
import { LineMarkProps } from '@specBuilder/line/lineUtils';
import {
	getColorProductionRule,
	getLineWidthProductionRule,
	getStrokeDashProductionRule,
	getXProductionRule,
	hasInteractiveChildren,
	hasPopover,
	hasTooltip,
} from '@specBuilder/marks/markUtils';
import { getScaleName } from '@specBuilder/scale/scaleSpecBuilder';
import {
	getGenericSignal,
	getSeriesHoveredSignal,
	getUncontrolledHoverSignal,
} from '@specBuilder/signal/signalSpecBuilder';
import { getDimensionField, getFacetsFromProps } from '@specBuilder/specUtils';
import { sanitizeTrendlineChildren } from '@utils';
import { produce } from 'immer';
import {
	AggregateMethod,
	LineSpecProps,
	MarkChildElement,
	RegressionMethod as RscRegressionMethod,
	ScaleType as RscScaleType,
	ScatterSpecProps,
	TrendlineElement,
	TrendlineMethod,
	TrendlineProps,
	TrendlineSpecProps,
	WindowMethod,
} from 'types';
import {
	AggregateOp,
	AggregateTransform,
	CollectTransform,
	Data,
	ExtentTransform,
	FilterTransform,
	FormulaTransform,
	GroupMark,
	JoinAggregateTransform,
	LineMark,
	LookupTransform,
	NumericValueRef,
	RegressionMethod,
	RegressionTransform,
	RuleMark,
	Scale,
	ScaleType,
	Signal,
	SignalRef,
	SourceData,
	Transforms,
	WindowTransform,
} from 'vega';

/** These are all the spec props that currently support trendlines */
type TrendlineParentProps = LineSpecProps | ScatterSpecProps;

export const getTrendlines = (children: MarkChildElement[], markName: string): TrendlineSpecProps[] => {
	const trendlineElements = children.filter((child) => child.type === Trendline) as TrendlineElement[];
	return trendlineElements.map((trendline, index) => applyTrendlinePropDefaults(trendline.props, markName, index));
};

export const applyTrendlinePropDefaults = (
	{
		children,
		dimensionExtent,
		dimensionRange = [null, null],
		displayOnHover = false,
		highlightRawPoint = false,
		lineType = 'dashed',
		lineWidth = 'M',
		method = 'linear',
		opacity = 1,
		...props
	}: TrendlineProps,
	markName: string,
	index: number,
): TrendlineSpecProps => ({
	children: sanitizeTrendlineChildren(children),
	displayOnHover,
	dimensionExtent: dimensionExtent ?? dimensionRange,
	dimensionRange,
	highlightRawPoint,
	lineType,
	lineWidth,
	method,
	metric: TRENDLINE_VALUE,
	name: `${markName}Trendline${index}`,
	opacity,
	...props,
});

export const getTrendlineMarks = (markProps: TrendlineParentProps): (GroupMark | RuleMark)[] => {
	const { children, color, lineType, name } = markProps;
	const { facets } = getFacetsFromProps({ color, lineType });

	const marks: (GroupMark | RuleMark)[] = [];
	const trendlines = getTrendlines(children, name);
	for (const trendlineProps of trendlines) {
		const dataSuffix = isRegressionMethod(trendlineProps.method) ? '_highResolutionData' : '_data';
		if (isAggregateMethod(trendlineProps.method)) {
			marks.push(getTrendlineRuleMark(markProps, trendlineProps));
		} else {
			marks.push({
				name: `${trendlineProps.name}_group`,
				type: 'group',
				clip: true,
				from: {
					facet: {
						name: `${trendlineProps.name}_facet`,
						data: trendlineProps.name + dataSuffix,
						groupby: facets,
					},
				},
				marks: [getTrendlineLineMark(markProps, trendlineProps)],
			});
		}
	}

	if (trendlines.some((trendline) => hasTooltip(trendline.children))) {
		marks.push(
			getTrendlineHoverMarks(
				markProps,
				trendlines.some((trendlineProps) => trendlineProps.highlightRawPoint),
			),
		);
	}

	return marks;
};

const getTrendlineRuleMark = (markProps: TrendlineParentProps, trendlineProps: TrendlineSpecProps): RuleMark => {
	const { dimension, colorScheme } = markProps;
	const { dimensionExtent, lineType, lineWidth, metric, name } = trendlineProps;
	const color = trendlineProps.color ? { value: trendlineProps.color } : markProps.color;
	const scaleType = getScaleType(markProps);
	const dimensionField = getDimensionField(dimension, scaleType);

	return {
		name,
		type: 'rule',
		clip: true,
		from: {
			data: `${name}_highResolutionData`,
		},
		interactive: false,
		encode: {
			enter: {
				y: { scale: 'yLinear', field: metric },
				stroke: getColorProductionRule(color, colorScheme),
				strokeDash: getStrokeDashProductionRule({ value: lineType }),
				strokeWidth: getLineWidthProductionRule({ value: lineWidth }),
			},
			update: {
				x: getRuleXProductionRule(dimensionExtent[0], dimensionField, scaleType),
				x2: getRuleX2ProductionRule(dimensionExtent[1], dimensionField, scaleType),
				strokeOpacity: getLineStrokeOpacity(getLineMarkProps(markProps, trendlineProps)),
			},
		},
	};
};

const getRuleXProductionRule = (
	startDimensionExtent: number | 'domain' | null,
	dimension: string,
	scaleType: RscScaleType,
): NumericValueRef => {
	const scale = getScaleName('x', scaleType);
	switch (startDimensionExtent) {
		case null:
			return { scale, field: `${dimension}Min` };
		case 'domain':
			return { value: 0 };
		default:
			return { scale, value: startDimensionExtent };
	}
};

const getRuleX2ProductionRule = (
	endDimensionExtent: number | 'domain' | null,
	dimension: string,
	scaleType: RscScaleType,
): NumericValueRef => {
	const scale = getScaleName('x', scaleType);
	switch (endDimensionExtent) {
		case null:
			return { scale, field: `${dimension}Max` };
		case 'domain':
			return { signal: 'width' };
		default:
			return { scale, value: endDimensionExtent };
	}
};

const getTrendlineLineMark = (markProps: TrendlineParentProps, trendlineProps: TrendlineSpecProps): LineMark => {
	const { colorScheme, dimension } = markProps;
	const scaleType = getScaleType(markProps);
	const { lineType, lineWidth, metric, name } = trendlineProps;

	const x = trendlineUsesNormalizedDimension(trendlineProps.method, scaleType)
		? { scale: 'xTrendline', field: `${dimension}Normalized` }
		: getXProductionRule(scaleType, dimension);
	const color = trendlineProps.color ? { value: trendlineProps.color } : markProps.color;

	return {
		name,
		type: 'line',
		from: { data: `${name}_facet` },
		interactive: false,
		encode: {
			enter: {
				y: { scale: 'yLinear', field: metric },
				stroke: getColorProductionRule(color, colorScheme),
				strokeDash: getStrokeDashProductionRule({ value: lineType }),
				strokeWidth: getLineWidthProductionRule({ value: lineWidth }),
			},
			update: {
				x,
				strokeOpacity: getLineStrokeOpacity(getLineMarkProps(markProps, trendlineProps)),
			},
		},
	};
};

const getLineMarkProps = (
	markProps: TrendlineParentProps,
	{ displayOnHover, lineWidth, metric, name, opacity }: TrendlineSpecProps,
	override?: Partial<LineMarkProps>,
): LineMarkProps => {
	const { children, color, colorScheme, dimension, interactiveMarkName, lineType } = markProps;
	const popoverMarkName = 'popoverMarkName' in markProps ? markProps.popoverMarkName : undefined;
	const scaleType = getScaleType(markProps);
	const staticPoint = 'staticPoint' in markProps ? markProps.staticPoint : undefined;
	return {
		children,
		color,
		colorScheme,
		dimension,
		displayOnHover,
		interactiveMarkName,
		lineType,
		lineWidth: { value: lineWidth },
		metric,
		name,
		opacity: { value: opacity },
		popoverMarkName,
		scaleType,
		staticPoint,
		...override,
	};
};

const getTrendlineHoverMarks = (lineProps: TrendlineParentProps, highlightRawPoint: boolean): GroupMark => {
	const { children, metric, name } = lineProps;
	const trendlines = getTrendlines(children, name);
	const trendlineHoverProps: LineMarkProps = getLineMarkProps(lineProps, trendlines[0], {
		name: `${name}Trendline`,
		children: trendlines.map((trendline) => trendline.children).flat(),
		metric: TRENDLINE_VALUE,
	});

	return {
		name: `${name}Trendline_hoverGroup`,
		type: 'group',
		clip: true,
		marks: getLineHoverMarks(
			trendlineHoverProps,
			`${name}_allTrendlineData`,
			highlightRawPoint ? metric : undefined,
		),
	};
};

/**
 * Adds the necessary data sources and transforms for the trendlines
 * NOTE: this function mutates the data array because it gets called from within a data produce function
 * @param data
 * @param markProps
 */
export const addTrendlineData = (data: Data[], markProps: TrendlineParentProps) => {
	data.push(...getTrendlineData(markProps));

	const tableData = getTableData(data);
	tableData.transform = addTableDataTransforms(tableData.transform ?? [], markProps);
};

/**
 * Adds the table data transforms needed for trendlines
 */
export const addTableDataTransforms = produce<Transforms[], [TrendlineParentProps]>((transforms, markProps) => {
	const { children, dimension, name } = markProps;
	const scaleType = getScaleType(markProps);

	const normalizedDimensionTransformExists = transforms.some(
		(transform) => 'as' in transform && transform.as === `${dimension}Normalized`,
	);
	// if a normalized dimension transform is needed and doesn't exist, add it
	if (hasTrendlineWithNormailizedDimension(markProps) && !normalizedDimensionTransformExists) {
		transforms.push(...getNormalizedDimensionTransform(dimension));
	}

	// add the extent transform for each regression trendline
	const trendlines = getTrendlines(children, name);
	for (const trendlineProps of trendlines) {
		if (isRegressionMethod(trendlineProps.method)) {
			const trendlineDimension = scaleType === 'time' ? `${dimension}Normalized` : dimension;
			transforms.push(getRegressionExtentTransform(trendlineDimension, trendlineProps.name));
		}
	}
});

const getNormalizedDimensionTransform = (dimension: string): Transforms[] => [
	{
		type: 'joinaggregate',
		fields: [dimension],
		as: [`${dimension}Min`],
		ops: ['min'],
	},
	{
		type: 'formula',
		expr: `(datum.${dimension} - datum.${dimension}Min + ${MS_PER_DAY}) / ${MS_PER_DAY}`,
		as: `${dimension}Normalized`,
	},
];

/**
 * adds the data transforms and data sources for the trendlines
 * @param data
 * @param markProps
 */
export const getTrendlineData = (markProps: TrendlineParentProps): SourceData[] => {
	const data: SourceData[] = [];
	const { children, color, dimension, lineType, name: markName } = markProps;
	const scaleType = getScaleType(markProps);
	const trendlines = getTrendlines(children, markName);

	const concatenatedTrendlineData: { name: string; source: string[] } = {
		name: `${markName}_allTrendlineData`,
		source: [],
	};

	for (const trendlineProps of trendlines) {
		const { children: trendlineChildren, method, name, dimensionRange } = trendlineProps;
		const dimensionRangeTransforms = getTrendlineDimensionRangeTransforms(dimension, dimensionRange);
		const { facets } = getFacetsFromProps({ color, lineType });

		if (isRegressionMethod(method)) {
			data.push({
				name: `${name}_highResolutionData`,
				source: FILTERED_TABLE,
				transform: [
					...dimensionRangeTransforms,
					...getTrendlineStatisticalTransforms(markProps, trendlineProps, true),
					getSeriesIdTransform(facets),
				],
			});
			if (hasInteractiveChildren(trendlineChildren)) {
				data.push(
					{
						name: `${name}_params`,
						source: FILTERED_TABLE,
						transform: [
							...dimensionRangeTransforms,
							...getTrendlineStatisticalTransforms(markProps, trendlineProps, false),
						],
					},
					{
						name: `${name}_data`,
						source: FILTERED_TABLE,
						transform: [
							...dimensionRangeTransforms,
							getTrendlineParamLookupTransform(markProps, trendlineProps),
							...getTrendlineParamFormulaTransforms(dimension, method, scaleType),
						],
					},
				);
			}
		} else if (isAggregateMethod(method)) {
			data.push({
				name: `${name}_highResolutionData`,
				source: FILTERED_TABLE,
				transform: [
					...dimensionRangeTransforms,
					...getTrendlineStatisticalTransforms(markProps, trendlineProps, true),
					getSeriesIdTransform(facets),
				],
			});
			if (hasInteractiveChildren(trendlineChildren)) {
				data.push({
					name: `${name}_data`,
					source: FILTERED_TABLE,
					transform: [
						...dimensionRangeTransforms,
						...getTrendlineStatisticalTransforms(markProps, trendlineProps, false),
					],
				});
			}
		} else if (isWindowMethod(method)) {
			// we want to filter down to the dimension range after calculating the moving average
			data.push({
				name: `${name}_data`,
				source: FILTERED_TABLE,
				transform: [
					...getTrendlineStatisticalTransforms(markProps, trendlineProps, false),
					...dimensionRangeTransforms,
				],
			});
		}
		if (hasInteractiveChildren(trendlineChildren)) {
			concatenatedTrendlineData.source.push(`${name}_data`);
		}
	}

	if (trendlines.some((trendline) => hasInteractiveChildren(trendline.children))) {
		data.push(concatenatedTrendlineData);

		const selectSignal = `${markName}Trendline_selectedId`;
		const hoverSignal = `${markName}Trendline_hoveredId`;
		const trendlineHasPopover = trendlines.some((trendline) => hasPopover(trendline.children));
		const expr = trendlineHasPopover
			? `${selectSignal} === datum.${MARK_ID} || !${selectSignal} && ${hoverSignal} === datum.${MARK_ID}`
			: `${hoverSignal} === datum.${MARK_ID}`;

		data.push({
			name: `${markName}Trendline_highlightedData`,
			source: `${markName}_allTrendlineData`,
			transform: [
				{
					type: 'filter',
					expr,
				},
			],
		});
	}

	return data;
};

/**
 * gets the filter transforms that will restrict the data to the dimension range
 * @param dimension
 * @param dimensionRange
 * @returns filterTansforms
 */
export const getTrendlineDimensionRangeTransforms = (
	dimension: string,
	dimensionRange: [number | null, number | null],
): FilterTransform[] => {
	const filterExpressions: string[] = [];
	if (dimensionRange[0] !== null) {
		filterExpressions.push(`datum.${dimension} >= ${dimensionRange[0]}`);
	}
	if (dimensionRange[1] !== null) {
		filterExpressions.push(`datum.${dimension} <= ${dimensionRange[1]}`);
	}
	if (filterExpressions.length) {
		return [
			{
				type: 'filter',
				expr: filterExpressions.join(' && '),
			},
		];
	}
	return [];
};

const getTrendlineParamLookupTransform = (
	{ color, lineType }: TrendlineParentProps,
	{ name }: TrendlineSpecProps,
): LookupTransform => {
	const { facets } = getFacetsFromProps({ color, lineType });
	return {
		type: 'lookup',
		from: `${name}_params`,
		key: 'keys',
		fields: facets,
		values: ['coef'],
	};
};

/**
 * This transform is used to calculate the value of the trendline using the coef and the dimension
 * @param dimension mark dimension
 * @param method trenline method
 * @returns formula transorfm
 */
export const getTrendlineParamFormulaTransforms = (
	dimension: string,
	method: TrendlineMethod,
	scaleType: ScaleType | undefined,
): FormulaTransform[] => {
	let expr = '';
	const trendlineDimension = trendlineUsesNormalizedDimension(method, scaleType)
		? `${dimension}Normalized`
		: dimension;
	if (isPolynomialMethod(method)) {
		const order = getPolynomialOrder(method);
		expr = [
			'datum.coef[0]',
			...Array(order)
				.fill(0)
				.map((_e, i) => `datum.coef[${i + 1}] * pow(datum.${trendlineDimension}, ${i + 1})`),
		].join(' + ');
	} else if (method === 'exponential') {
		expr = `datum.coef[0] + exp(datum.coef[1] * datum.${trendlineDimension})`;
	} else if (method === 'logarithmic') {
		expr = `datum.coef[0] + datum.coef[1] * log(datum.${trendlineDimension})`;
	} else if (method === 'power') {
		expr = `datum.coef[0] * pow(datum.${trendlineDimension}, datum.coef[1])`;
	}

	if (!expr) return [];
	return [
		{
			type: 'formula',
			expr,
			as: TRENDLINE_VALUE,
		},
	];
};

export const getTrendlineScales = (props: TrendlineParentProps): Scale[] => {
	const { dimension } = props;

	if (hasTrendlineWithNormailizedDimension(props)) {
		return [
			{
				name: 'xTrendline',
				type: 'linear',
				range: 'width',
				domain: { data: FILTERED_TABLE, fields: [`${dimension}Normalized`] },
				padding: LINEAR_PADDING,
				zero: false,
				nice: false,
			},
		];
	}
	return [];
};

/**
 * determines if the supplied method is a polynomial method
 * @see https://vega.github.io/vega/docs/transforms/regression/
 * @param method
 * @returns boolean
 */
const isAggregateMethod = (method: TrendlineMethod): method is AggregateMethod =>
	['average', 'median'].includes(method);

/**
 * determines if the supplied method is a regression method
 * @see https://vega.github.io/vega/docs/transforms/regression/
 * @param method
 * @returns boolean
 */
const isRegressionMethod = (method: TrendlineMethod): method is RscRegressionMethod =>
	isPolynomialMethod(method) || ['exponential', 'logarithmic', 'power'].includes(method);

/**
 * determines if the supplied method is a polynomial method
 * @see https://vega.github.io/vega/docs/transforms/regression/
 * @param method
 * @returns boolean
 */
const isPolynomialMethod = (method: TrendlineMethod): boolean =>
	method.startsWith('polynomial-') || ['linear', 'quadratic'].includes(method);

/**
 * determines if the supplied method is a windowing method
 * @see https://vega.github.io/vega/docs/transforms/window/
 * @param method
 * @returns boolean
 */
const isWindowMethod = (method: TrendlineMethod): method is WindowMethod => method.startsWith('movingAverage-');

/**
 * determines if the supplied method is a regression method that uses the normalized dimension
 * @see https://vega.github.io/vega/docs/transforms/regression/
 * @param method
 * @returns boolean
 */
const trendlineUsesNormalizedDimension = (method: TrendlineMethod, scaleType: ScaleType | undefined): boolean =>
	scaleType === 'time' && isRegressionMethod(method);

/**
 * determines if any trendlines use the normalized dimension
 * @param markProps
 * @returns boolean
 */
const hasTrendlineWithNormailizedDimension = (markProps: TrendlineParentProps): boolean => {
	const trendlines = getTrendlines(markProps.children, markProps.name);

	// only need to add the normalized dimension transform if there is a regression trendline and the dimension is time
	const hasRegressionTrendline = trendlines.some((trendline) => isRegressionMethod(trendline.method));
	const hasTimeScale = getScaleType(markProps) === 'time';
	return hasRegressionTrendline && hasTimeScale;
};

/**
 * gets the statistical transforms that will calculate the trendline values
 * @param markProps
 * @param trendlineProps
 * @returns dataTransforms
 */
const getTrendlineStatisticalTransforms = (
	markProps: TrendlineParentProps,
	trendlineProps: TrendlineSpecProps,
	isHighResolutionData: boolean,
): Transforms[] => {
	const { method } = trendlineProps;
	const scaleType = getScaleType(markProps);
	const dimension = getDimensionField(markProps.dimension, scaleType);

	if (isAggregateMethod(method)) {
		return [getAggregateTransform(markProps, method, isHighResolutionData, dimension)];
	}
	if (isRegressionMethod(method)) {
		return [getRegressionTransform(markProps, trendlineProps, isHighResolutionData)];
	}
	if (isWindowMethod(method)) {
		return [getSortTransform(dimension), getMovingAverageTransform(markProps, method)];
	}

	return [];
};

const getRegressionExtentTransform = (dimension: string, name: string): ExtentTransform => ({
	type: 'extent',
	field: dimension,
	signal: `${name}_extent`,
});

/**
 * gets the sort transform for the provided dimension
 * this is used to sort aggregate and window methods
 * @param dimension
 * @returns CollectTransform
 */
const getSortTransform = (dimension: string): CollectTransform => ({
	type: 'collect',
	sort: {
		field: dimension,
	},
});

/**
 * gets the join aggreagate transform used for calculating the average trendline
 * @param facets data facets
 * @param metric data y key
 * @returns transform
 */
export const getAggregateTransform = (
	{ color, lineType, metric }: TrendlineParentProps,
	method: AggregateMethod,
	isHighResolutionData: boolean,
	dimension: string,
): AggregateTransform | JoinAggregateTransform => {
	const { facets } = getFacetsFromProps({ color, lineType });
	const operations: Record<AggregateMethod, AggregateOp> = {
		average: 'mean',
		median: 'median',
	};
	if (isHighResolutionData) {
		return {
			type: 'aggregate',
			groupby: facets,
			ops: [operations[method], 'min', 'max'],
			fields: [metric, dimension, dimension],
			as: [TRENDLINE_VALUE, `${dimension}Min`, `${dimension}Max`],
		};
	}
	return {
		type: 'joinaggregate',
		groupby: facets,
		ops: [operations[method]],
		fields: [metric],
		as: [TRENDLINE_VALUE],
	};
};

/**
 * gets the regression transform used for calculating the regression trendline
 * regression trendlines are ones that use the x value as a parameter
 * @see https://vega.github.io/vega/docs/transforms/regression/
 * @param markProps
 * @param method
 * @param isHighResolutionData
 * @returns
 */
export const getRegressionTransform = (
	markProps: TrendlineParentProps,
	trendlineProps: TrendlineSpecProps,
	isHighResolutionData: boolean,
): RegressionTransform => {
	const { color, dimension, lineType, metric } = markProps;
	const { dimensionExtent, method, name } = trendlineProps;
	const { facets } = getFacetsFromProps({ color, lineType });

	let regressionMethod: RegressionMethod | undefined;
	let order: number | undefined;

	switch (method) {
		case 'exponential':
			regressionMethod = 'exp';
			break;
		case 'logarithmic':
			regressionMethod = 'log';
			break;
		case 'power':
			regressionMethod = 'pow';
			break;
		default:
			order = getPolynomialOrder(method);
			regressionMethod = 'poly';
			break;
	}

	const isNormalized = getScaleType(markProps) === 'time';
	const trendlineDimension = isNormalized ? `${dimension}Normalized` : dimension;

	return {
		type: 'regression',
		method: regressionMethod,
		order,
		groupby: facets,
		x: trendlineDimension,
		y: metric,
		as: isHighResolutionData ? [trendlineDimension, TRENDLINE_VALUE] : undefined,
		params: !isHighResolutionData,
		extent: isHighResolutionData ? getRegressionExtent(dimensionExtent, name, isNormalized) : undefined,
	};
};
/**
 * gets the order of the polynomial
 * y = a + b * x + … + k * pow(x, order)
 * @see https://vega.github.io/vega/docs/transforms/regression/
 * @param method trendline method
 * @returns order
 */
export const getPolynomialOrder = (method: TrendlineMethod): number => {
	// method is one of the named polynomial methods
	switch (method) {
		case 'linear':
			return 1;
		case 'quadratic':
			return 2;
	}

	// method is of the form polynomial-<order>
	const order = parseInt(method.split('-')[1]);
	if (order < 1) {
		throw new Error(`Invalid polynomial order: ${order}, order must be an interger greater than 0`);
	}
	return order;
};

const getRegressionExtent = (
	dimensionExtent: TrendlineSpecProps['dimensionExtent'],
	name: string,
	isNormalized: boolean,
): SignalRef => {
	const extentName = `${name}_extent`;
	const extentSignal = dimensionExtent
		.map((value, i) => {
			switch (value) {
				case null:
					return `${extentName}[${i}]`;
				case 'domain':
					const operator = i === 0 ? '-' : '+';
					const extentRange = `(${extentName}[1] - ${extentName}[0])`;
					return `${extentName}[${i}] ${operator} ${extentRange} * 0.3`;
				default:
					// if this is a normalized date, we need to normalize the value
					if (isNormalized) {
						return `(${value} - data('${FILTERED_TABLE}')[0].datetimeMin + ${MS_PER_DAY}) / ${MS_PER_DAY}`;
					}
					return value;
			}
		})
		.join(', ');

	return { signal: `[${extentSignal}]` };
};

export const getMovingAverageTransform = (
	markProps: TrendlineParentProps,
	method: TrendlineMethod,
): WindowTransform => {
	const frameWidth = parseInt(method.split('-')[1]);

	const { color, lineType, metric } = markProps;
	const { facets } = getFacetsFromProps({ color, lineType });

	if (isNaN(frameWidth) || frameWidth < 1) {
		throw new Error(
			`Invalid moving average frame width: ${frameWidth}, frame width must be an integer greater than 0`,
		);
	}
	return {
		type: 'window',
		ops: ['mean'],
		groupby: facets,
		fields: [metric],
		as: [TRENDLINE_VALUE],
		frame: [frameWidth - 1, 0],
	};
};

export const getTrendlineSignals = (markProps: TrendlineParentProps): Signal[] => {
	const signals: Signal[] = [];
	const { children, name: markName } = markProps;
	const trendlines = getTrendlines(children, markName);

	if (trendlines.some((trendline) => hasTooltip(trendline.children))) {
		signals.push(getUncontrolledHoverSignal(`${markName}Trendline`, true, `${markName}Trendline_voronoi`));
		signals.push(getSeriesHoveredSignal(`${markName}Trendline`, true, `${markName}Trendline_voronoi`));
	}

	if (trendlines.some((trendline) => trendline.displayOnHover)) {
		signals.push(getSeriesHoveredSignal(markName, true, `${markName}_voronoi`));
	}

	if (trendlines.some((trendline) => hasPopover(trendline.children))) {
		signals.push(getGenericSignal(`${markName}Trendline_selectedId`));
		signals.push(getGenericSignal(`${markName}Trendline_selectedSeries`));
	}

	return signals;
};

const getScaleType = (markProps: TrendlineParentProps): RscScaleType => {
	return 'scaleType' in markProps ? markProps.scaleType : markProps.dimensionScaleType;
};
