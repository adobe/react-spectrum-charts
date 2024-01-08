import { FILTERED_TABLE, HIGHLIGHT_CONTRAST_RATIO, MARK_ID } from '@constants';
import { getTooltip, hasPopover } from '@specBuilder/marks/markUtils';
import { MarkChildElement } from 'types';
import {
	ArcMark,
	EncodeEntryName,
	Mark,
	NumericValueRef,
	ProductionRule,
	TextBaselineValueRef,
	TextEncodeEntry,
	TextValueRef,
} from 'vega';

export const getArcMark = (name: string, holeRatio: number, radius: string, children: MarkChildElement[]): ArcMark => {
	return {
		type: 'arc',
		name,
		from: { data: FILTERED_TABLE },
		encode: {
			enter: {
				fill: { scale: 'color', field: 'id' },
				x: { signal: 'width / 2' },
				y: { signal: 'height / 2' },
				tooltip: getTooltip(children, name),
			},
			update: {
				startAngle: { field: 'startAngle' },
				endAngle: { field: 'endAngle' },
				padAngle: { value: 0.01 },
				innerRadius: { signal: `${holeRatio} * ${radius}` },
				outerRadius: { signal: radius },
				fillOpacity: getOpacityRules(name, children),
			},
		},
	};
};

export const getOpacityRules = (name: string, children: MarkChildElement[]): ProductionRule<NumericValueRef> => {
	const lowOpacity = 1 / HIGHLIGHT_CONTRAST_RATIO;
	const hoveredSignal = `${name}_hoveredId`;
	const selectedSignal = `${name}_selectedId`;

	const opacityRules = [
		{
			test: `${hoveredSignal} && datum.${MARK_ID} !== ${hoveredSignal}`,
			value: lowOpacity,
		},
		{
			value: 1,
		},
	];
	if (hasPopover(children)) {
		opacityRules.splice(1, 0, {
			test: `${selectedSignal} && datum.${MARK_ID} !== ${selectedSignal}`,
			value: lowOpacity,
		});
	}
	return opacityRules;
};

export const getAggregateMetricMark = (
	name: string,
	metric: string,
	radius: string,
	holeRatio: number,
	metricLabel: string | undefined
): Mark => {
	const groupMark: Mark = {
		type: 'group',
		name: `${name}_aggregateText`,
		marks: [
			{
				type: 'text',
				name: `${name}_aggregateMetricNumber`,
				from: { data: `${name}_aggregateData` },
				encode: getMetricNumberEncodeEnter(metric, radius, holeRatio, !!metricLabel, false),
			},
		],
	};
	if (metricLabel) {
		groupMark.marks!.push({
			type: 'text',
			name: `${name}_aggregateMetricLabel`,
			from: { data: `${name}_aggregateData` },
			encode: getMetricLabelEncodeEnter(radius, holeRatio, metricLabel),
		});
	}
	return groupMark;
};

export const getPercentMetricMark = (
	name: string,
	metric: string,
	radius: string,
	holeRatio: number,
	metricLabel: string | undefined
): Mark => {
	const groupMark: Mark = {
		type: 'group',
		name: `${name}_percentText`,
		marks: [
			{
				type: 'text',
				name: `${name}_percentMetricNumber`,
				from: { data: `${name}_booleanData` },
				encode: getMetricNumberEncodeEnter(metric, radius, holeRatio, !!metricLabel, true),
			},
		],
	};
	if (metricLabel) {
		groupMark.marks!.push({
			type: 'text',
			name: `${name}_percentMetricLabel`,
			from: { data: `${name}_booleanData` },
			encode: getMetricLabelEncodeEnter(radius, holeRatio, metricLabel),
		});
	}
	return groupMark;
};

export const getMetricNumberEncodeEnter = (
	metric: string,
	radius: string,
	holeRatio: number,
	showingLabel: boolean,
	isBoolean: boolean
): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
	return {
		enter: {
			x: { signal: 'width / 2' },
			y: { signal: 'height / 2' },
			text: getMetricNumberText(metric, isBoolean),
			fontSize: getFontSize(radius, holeRatio, true),
			align: { value: 'center' },
			baseline: getAggregateMetricBaseline(radius, holeRatio, showingLabel),
		},
	};
};

export const getMetricNumberText = (metric: string, isBoolean: boolean): ProductionRule<TextValueRef> => {
	if (isBoolean) {
		return { signal: `format(datum['${metric}'], '.0%')` };
	}
	return { signal: "upper(replace(format(datum.sum, '.3~s'), 'G', 'B'))" };
};

export const getMetricLabelEncodeEnter = (
	radius: string,
	holeRatio: number,
	metricLabel: string
): Partial<Record<EncodeEntryName, TextEncodeEntry>> => {
	return {
		enter: {
			x: { signal: 'width / 2' },
			y: getLabelYWithOffset(radius, holeRatio),
			text: { value: metricLabel },
			fontSize: getFontSize(radius, holeRatio, false),
			align: { value: 'center' },
			baseline: { value: 'top' },
		},
	};
};

export const fontBreakpoints = [76, 64, 52, 40];
export const metricNumberFontSizes = [72, 60, 48, 36];
export const metricLabelFontSizes = [24, 18, 12, 0];

export const getAggregateMetricBaseline = (
	radius: string,
	holeRatio: number,
	showingLabel: boolean
): ProductionRule<TextBaselineValueRef> => {
	// whenever we aren't showing the label, the metric number should be in the middle
	// we check if the radius * holeRatio is greater than the second breakpoint because after that point the label dissapears
	return {
		signal: showingLabel ? `${radius} * ${holeRatio} > ${fontBreakpoints[2]} ? 'alphabetic' : 'middle'` : 'middle',
	};
};

export const getFontSize = (
	radius: string,
	holeRatio: number,
	isPrimaryText: boolean
): ProductionRule<NumericValueRef> => {
	return [
		{
			test: `${radius} * ${holeRatio} > ${fontBreakpoints[0]}`,
			value: isPrimaryText ? metricNumberFontSizes[0] : metricLabelFontSizes[0],
		},
		{
			test: `${radius} * ${holeRatio} > ${fontBreakpoints[1]}`,
			value: isPrimaryText ? metricNumberFontSizes[1] : metricLabelFontSizes[1],
		},
		{
			test: `${radius} * ${holeRatio} > ${fontBreakpoints[2]}`,
			value: isPrimaryText ? metricNumberFontSizes[2] : metricLabelFontSizes[2],
		},
		{
			test: `${radius} * ${holeRatio} > ${fontBreakpoints[3]}`,
			value: isPrimaryText ? metricNumberFontSizes[3] : metricLabelFontSizes[3],
		},
		{ value: 0 },
	];
};

// The offset is based off the font size of the metric label. However, we can't use tests here, so the signal is nested ternary statements
export const getLabelYWithOffset = (radius: string, holeRatio: number): ProductionRule<NumericValueRef> => {
	const openSpace = `${radius} * ${holeRatio}`;
	return {
		signal: `height / 2`,
		offset: {
			// if open space is greater than first breakpoint, return first size. Otherwise, check second breakpoint for second size, etc.
			signal: `${openSpace} > ${fontBreakpoints[0]} ? ${metricLabelFontSizes[0]} : ${openSpace} > ${fontBreakpoints[1]} ? ${metricLabelFontSizes[1]} : ${openSpace} > ${fontBreakpoints[2]} ? ${metricLabelFontSizes[2]} : 0`,
		},
	};
};

export const getDirectLabelMark = (name: string, radius: string, metric: string, segment: string): Mark => {
	return {
		name: `${name}_directLabels`,
		type: 'group',
		marks: [
			{
				type: 'text',
				name: `${name}_directLabelSegment`,
				from: { data: FILTERED_TABLE },
				encode: {
					enter: getDirectLabelTextEntry(radius, segment, 'bottom'),
				},
			},
			{
				type: 'text',
				name: `${name}_directLabelMetric`,
				from: { data: FILTERED_TABLE },
				encode: {
					enter: getDirectLabelTextEntry(radius, metric, 'top', true),
				},
			},
		],
	};
};

export const getDirectLabelTextEntry = (
	radius: string,
	datumProperty: string,
	baselinePosition: 'top' | 'bottom',
	format: boolean = false
): TextEncodeEntry => {
	return {
		text: getDisplayTextForLargeSlice(radius, datumProperty, format),
		x: { signal: 'width / 2' },
		y: { signal: 'height / 2' },
		radius: { signal: `${radius} + 15` },
		theta: { signal: "(datum['startAngle'] + datum['endAngle']) / 2" },
		fontSize: { value: 14 },
		width: { signal: `getLabelWidth(datum['${datumProperty}'], 'bold', '14') + 10` },
		align: {
			signal: "(datum['startAngle'] + datum['endAngle']) / 2 <= PI ? 'left' : 'right'",
		},
		baseline: { value: baselinePosition },
	};
};

export const getDisplayTextForLargeSlice = (
	radius: string,
	datumProperty: string,
	format: boolean,
	minArcLength: number = 40 // minimum arc length to display text, in pixels
): ProductionRule<TextValueRef> => {
	return {
		//if we want to go back to displaying based on radians rather than arc length, use this if statement:  if(datum['endAngle'] - datum['startAngle'] < 0.3
		signal: `if((${radius} * (datum['endAngle'] - datum['startAngle'])) < ${minArcLength}, '', ${
			format ? `format(datum['${datumProperty}'], ',')` : `datum['${datumProperty}']`
		})`,
	};
};
