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
import { Fragment, ReactNode } from 'react';

import { MARK_ID, SELECTED_ITEM, SELECTED_SERIES, SERIES_ID } from '@constants';
import {
	Annotation,
	Area,
	Axis,
	AxisAnnotation,
	Bar,
	ChartPopover,
	ChartTooltip,
	Legend,
	Line,
	MetricRange,
	ReferenceLine,
	Scatter,
	ScatterPath,
	Title,
	Trendline,
	TrendlineAnnotation,
} from '@rsc';
import { Donut, DonutSummary, SegmentLabel } from '@rsc/rc';
import { Combo } from '@rsc/alpha';
import { View } from 'vega';

import {
	AreaElement,
	AxisAnnotationChildElement,
	AxisAnnotationElement,
	AxisChildElement,
	AxisElement,
	BarElement,
	ChartChildElement,
	ChartElement,
	ChartTooltipElement,
	ChildElement,
	Datum,
	DonutElement,
	LegendElement,
	LineElement,
	MarkChildElement,
	RscElement,
	ScatterElement,
	TrendlineElement,
} from '../types';

type MappedElement = { name: string; element: ChartElement | RscElement };
type ElementCounts = {
	area: number;
	axis: number;
	axisAnnotation: number;
	bar: number;
	donut: number;
	legend: number;
	line: number;
	scatter: number;
};

// coerces a value that could be a single value or an array of that value to an array
export function toArray<Child>(children: Child | Child[] | undefined): Child[] {
	if (children === undefined) return [];
	if (Array.isArray(children)) return children;
	return [children];
}

export const getElementDisplayName = (element: unknown): string => {
	if (
		!element ||
		typeof element !== 'object' ||
		!('type' in element && element.type) ||
		!(typeof element.type === 'object' || typeof element.type === 'function') ||
		!('displayName' in element.type) ||
		typeof element.type.displayName !== 'string'
	)
		return 'no-display-name';
	return element.type.displayName;
};

// removes all non-chart specific elements
export const sanitizeRscChartChildren = (children: unknown): ChartChildElement[] => {
	const chartChildDisplyNames = [
		Area.displayName,
		Axis.displayName,
		Bar.displayName,
		Donut.displayName,
		Legend.displayName,
		Line.displayName,
		Scatter.displayName,
		Title.displayName,
		Combo.displayName,
	] as string[];
	return toArray(children)
		.flat()
		.filter((child): child is ChartChildElement => chartChildDisplyNames.includes(getElementDisplayName(child)));
};

export const sanitizeMarkChildren = (children: unknown): MarkChildElement[] => {
	const markChildDisplayNames = [
		Annotation.displayName,
		ChartTooltip.displayName,
		ChartPopover.displayName,
		ScatterPath.displayName,
		MetricRange.displayName,
		DonutSummary.displayName,
		SegmentLabel.displayName,
		Trendline.displayName,
	] as string[];

	return toArray(children)
		.flat()
		.filter((child): child is MarkChildElement => markChildDisplayNames.includes(getElementDisplayName(child)));
};

export const sanitizeAxisChildren = (children: unknown): AxisChildElement[] => {
	const axisChildDisplayNames = [AxisAnnotation.displayName, ReferenceLine.displayName] as string[];
	return toArray(children)
		.flat()
		.filter((child): child is AxisChildElement => axisChildDisplayNames.includes(getElementDisplayName(child)));
};

export const sanitizeAxisAnnotationChildren = (children: ReactNode): AxisAnnotationChildElement[] => {
	const axisAnnotationChildDisplayNames = [ChartTooltip.displayName, ChartPopover.displayName] as string[];

	return toArray(children)
		.flat()
		.filter((child): child is AxisAnnotationChildElement =>
			axisAnnotationChildDisplayNames.includes(getElementDisplayName(child))
		);
};

export const sanitizeTrendlineChildren = (children: unknown): ChartTooltipElement[] => {
	const trendlineChildDisplayNames = [ChartTooltip.displayName, TrendlineAnnotation.displayName] as string[];
	return toArray(children)
		.flat()
		.filter((child): child is ChartTooltipElement =>
			trendlineChildDisplayNames.includes(getElementDisplayName(child))
		);
};

// converts any string to the camelcase equivalent
export function toCamelCase(str: string) {
	const words = str.match(/[A-Z]{2,}(?=[A-Z][a-z]+\d*|\b)|[A-Z]?[a-z]+\d*|[A-Z]|\d+/g);
	if (words) {
		return words
			.map((word, i) => {
				if (i === 0) return word.toLowerCase();
				return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
			})
			.join('');
	}
	return str;
}

/**
 * IMMUTABLE
 *
 * Adds the value to the target array if it doesn't exist, otherwise removes it
 * @param target
 * @param value
 * @returns
 */
export const toggleStringArrayValue = (target: string[], value: string): string[] => {
	if (target.includes(value)) {
		return target.filter((item) => item !== value);
	}
	return [...target, value];
};

// traverses the children to find the first element instance of the proivded type
export function getElement(
	element: ReactNode | (() => void),
	type:
		| typeof Axis
		| typeof Bar
		| typeof ChartPopover
		| typeof ChartTooltip
		| typeof Legend
		| typeof Line
		| typeof Scatter
): ChartElement | RscElement | undefined {
	// if the element is undefined or 'type' doesn't exist on the element, stop searching
	if (!element || typeof element !== 'object' || !('type' in element) || element.type === Fragment) {
		return undefined;
	}

	// if the type matches, we found our element
	if (element.type === type) return element as ChartElement | RscElement;

	// if there aren't any more children to search, stop looking
	if (!('children' in element.props)) return undefined;

	for (const child of toArray(element.props.children)) {
		const desiredElement = getElement(child, type);
		// if an element was found, return it
		if (desiredElement) return desiredElement;
	}
	// no element matches found, give up all hope...
	return undefined;
}

/**
 * Traverses the mark elements finding all elements of the provided type and get the correct name for the element it is associated with
 * @param element
 * @param type
 * @returns
 */
export const getAllMarkElements = (
	target: unknown,
	source:
		| typeof Area
		| typeof Bar
		| typeof Donut
		| typeof Line
		| typeof Scatter,
	elements: MappedElement[] = [],
	name: string = ''
): MappedElement[] => {
	if (
		!target ||
		typeof target !== 'object' ||
		!('type' in target && target.type) ||
		!(typeof target.type === 'object' || typeof target.type === 'function') ||
		!('displayName' in target.type) ||
		typeof target.type.displayName !== 'string'
	) {
		return elements;
	}
	// if the type matches, we found our element
	if (target.type === source) {
		return [...elements, { name, element: target as ChartElement | RscElement }];
	}

	// if there aren't any more children to search, stop looking
	if (!('props' in target) || typeof target.props !== 'object' || !target.props || !('children' in target.props))
		return elements;

	const elementCounts = initElementCounts();
	const desiredElements: MappedElement[] = [];
	for (const child of toArray(target.props.children)) {
		const childName = getElementName(child, elementCounts);
		desiredElements.push(...getAllMarkElements(child, source, elements, [name, childName].filter(Boolean).join('')));
	}
	// no element matches found, give up all hope...
	return [...elements, ...desiredElements];
};

/**
 * Traverses the child elements finding all elements of the provided type and get the correct name for the element it is associated with
 * @param element
 * @param type
 * @returns
 */
export const getAllElements = (
	target: unknown,
	source:
		| typeof Axis
		| typeof Bar
		| typeof ChartPopover
		| typeof ChartTooltip
		| typeof Legend
		| typeof Line
		| typeof Scatter,
	elements: MappedElement[] = [],
	name: string = ''
): MappedElement[] => {
	if (
		!target ||
		typeof target !== 'object' ||
		!('type' in target && target.type) ||
		!(typeof target.type === 'object' || typeof target.type === 'function') ||
		!('displayName' in target.type) ||
		typeof target.type.displayName !== 'string'
	) {
		return elements;
	}
	// if the type matches, we found our element
	if (target.type === source) return [...elements, { name, element: target as ChartElement | RscElement }];

	// if there aren't any more children to search, stop looking
	if (!('props' in target) || typeof target.props !== 'object' || !target.props || !('children' in target.props))
		return elements;

	const elementCounts = initElementCounts();
	const desiredElements: MappedElement[] = [];
	for (const child of toArray(target.props.children)) {
		const childName = getElementName(child, elementCounts);
		desiredElements.push(...getAllElements(child, source, elements, [name, childName].filter(Boolean).join('')));
	}
	// no element matches found, give up all hope...
	return [...elements, ...desiredElements];
};

const getElementName = (element: unknown, elementCounts: ElementCounts) => {
	if (
		!element ||
		typeof element !== 'object' ||
		!('type' in element && element.type) ||
		!(typeof element.type === 'object' || typeof element.type === 'function') ||
		!('displayName' in element.type) ||
		typeof element.type.displayName !== 'string'
	)
		return '';
	// use displayName since it is the olny way to check alpha and beta components
	switch (element.type.displayName) {
		case Area.displayName:
			elementCounts.area++;
			return getComponentName(element as AreaElement, `area${elementCounts.area}`);
		case Axis.displayName:
			elementCounts.axis++;
			return getComponentName(element as AxisElement, `axis${elementCounts.axis}`);
		case AxisAnnotation.displayName:
			elementCounts.axisAnnotation++;
			return getComponentName(element as AxisAnnotationElement, `Annotation${elementCounts.axisAnnotation}`);
		case Bar.displayName:
			elementCounts.bar++;
			return getComponentName(element as BarElement, `bar${elementCounts.bar}`);
		case Donut.displayName:
			elementCounts.donut++;
			return getComponentName(element as DonutElement, `donut${elementCounts.donut}`);
		case Legend.displayName:
			elementCounts.legend++;
			return getComponentName(element as LegendElement, `legend${elementCounts.legend}`);
		case Line.displayName:
			elementCounts.line++;
			return getComponentName(element as LineElement, `line${elementCounts.line}`);
		case Scatter.displayName:
			elementCounts.scatter++;
			return getComponentName(element as ScatterElement, `scatter${elementCounts.scatter}`);
		case Trendline.displayName:
			return getComponentName(element as TrendlineElement, 'Trendline');
		default:
			return '';
	}
};

export const getComponentName = (element: ChildElement<RscElement>, defaultName: string) => {
	if (typeof element === 'object' && 'props' in element && 'name' in element.props && element.props.name) {
		return toCamelCase(element.props.name);
	}
	return defaultName;
};

const initElementCounts = (): ElementCounts => ({
	area: -1,
	axis: -1,
	axisAnnotation: -1,
	bar: -1,
	donut: -1,
	legend: -1,
	line: -1,
	scatter: -1,
});

/**
 * log for debugging
 */
export function debugLog(
	debug: boolean | undefined,
	{ title = '', contents }: { contents?: unknown; title?: string }
): void {
	if (debug) {
		const rainbow = String.fromCodePoint(0x1f308);
		console.log(`%c${rainbow} ${title}`, 'color: #2780eb', contents);
	}
}

/**
 * Sets the values of the selectedId and selectedSeries signals
 * @param param0
 */
export const setSelectedSignals = ({ selectedData, view }: { selectedData: Datum | null; view: View }) => {
	view.signal(SELECTED_ITEM, selectedData?.[MARK_ID] ?? null);
	view.signal(SELECTED_SERIES, selectedData?.[SERIES_ID] ?? null);
};
