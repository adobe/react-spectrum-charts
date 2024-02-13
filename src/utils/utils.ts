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
import { Fragment, ReactFragment } from 'react';

import { MARK_ID, SERIES_ID } from '@constants';
import { View } from 'vega';

import { Area, Axis, AxisAnnotation, Bar, BigNumber, ChartPopover, ChartTooltip, Legend, Line, Trendline } from '..';
import { Donut } from '../alpha';
import {
	AxisAnnotationChildElement,
	AxisChildElement,
	BigNumberChildElement,
	ChartChildElement,
	ChartElement,
	ChartTooltipElement,
	ChildElement,
	Children,
	Datum,
	LegendElement,
	MarkChildElement,
	PopoverHandler,
	RscElement,
	TooltipHandler,
} from '../types';
import { Icon } from '@adobe/react-spectrum';

type MappedElement = { name: string; element: ChartElement | RscElement };
type ElementCounts = {
	area: number;
	axis: number;
	axisAnnotation: number;
	bar: number;
	donut: number;
	legend: number;
	line: number;
};

// coerces a value that could be a single value or an array of that value to an array
export function toArray<Child>(children: Child | Child[] | undefined): Child[] {
	if (children === undefined) return [];
	if (Array.isArray(children)) return children;
	return [children];
}

// removes all non-chart specific elements
export const sanitizeRscChartChildren = (children: Children<RscElement> | undefined): ChartChildElement[] => {
	return toArray(children)
		.flat()
		.filter((child): child is ChartChildElement => isChartChildElement(child));
};

export const sanitizeBigNumberChildren = (children: Children<BigNumberChildElement> | undefined): BigNumberChildElement[] => {
	const sanitizedChildren = toArray(children)
		.flat()
		.filter((child): child is BigNumberChildElement => isBigNumberChildElement(child));
	return sanitizedChildren.filter(c => c.type == Line)
};

export const chartContainsBigNumber = (children: Children<ChartChildElement> | undefined): ChartChildElement[] => {
	const sanitizedChildren = sanitizeRscChartChildren(children);
	return sanitizedChildren.filter(child => child.type == BigNumber);
}


export const sanitizeMarkChildren = (children: Children<MarkChildElement> | undefined): MarkChildElement[] => {
	return toArray(children)
		.flat()
		.filter((child): child is MarkChildElement => isMarkChildElement(child));
};

export const sanitizeAxisChildren = (children: Children<AxisChildElement> | undefined): AxisChildElement[] => {
	return toArray(children)
		.flat()
		.filter((child): child is AxisChildElement => isMarkChildElement(child));
};

export const sanitizeAxisAnnotationChildren = (
	children: Children<AxisAnnotationChildElement> | undefined
): AxisAnnotationChildElement[] => {
	return toArray(children)
		.flat()
		.filter((child): child is AxisAnnotationChildElement => isMarkChildElement(child));
};
export const sanitizeTrendlineChildren = (
	children: Children<ChartTooltipElement> | undefined
): ChartTooltipElement[] => {
	return toArray(children)
		.flat()
		.filter((child): child is ChartTooltipElement => isMarkChildElement<ChartTooltipElement>(child));
};

const isChartChildElement = (child: ChildElement<ChartChildElement> | undefined): child is ChartChildElement => {
	return isRscComponent(child);
};

const isBigNumberChildElement = (child: ChildElement<BigNumberChildElement> | undefined): child is BigNumberChildElement => {
	return isRscComponent(child)
}

const isMarkChildElement = <T extends MarkChildElement = MarkChildElement>(
	child: ChildElement<T> | undefined
): child is T => {
	return isRscComponent(child);
};

const isRscElement = <T extends RscElement = RscElement>(child: ChildElement<T> | undefined): child is T => {
	return isRscComponent(child);
};

const isRscComponent = (child?: ChildElement<RscElement>): boolean => {
	return Boolean(
		child &&
			typeof child !== 'string' &&
			typeof child !== 'boolean' &&
			'type' in child &&
			child.type !== Fragment &&
			'displayName' in child.type
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
	element:
		| ChartElement
		| RscElement
		| TooltipHandler
		| PopoverHandler
		| LegendElement
		| boolean
		| string
		| ReactFragment
		| undefined,
	type: typeof Axis | typeof Legend | typeof Line | typeof Bar | typeof ChartTooltip | typeof ChartPopover
): ChartElement | RscElement | undefined {
	// if the element is undefined or 'type' doesn't exist on the element, stop searching
	if (
		!element ||
		typeof element === 'boolean' ||
		typeof element === 'string' ||
		!('type' in element) ||
		element.type === Fragment
	) {
		return undefined;
	}

	// if the type matches, we found our element
	if (element.type === type) return element;

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
 * Traverses the child elements finding all elements of the provided type and get the correct name for the element it is associated with
 * @param element
 * @param type
 * @returns
 */
export const getAllElements = (
	target: Children<ChartElement | RscElement>,
	source: typeof Axis | typeof Legend | typeof Line | typeof Bar | typeof ChartTooltip | typeof ChartPopover,
	elements: MappedElement[] = [],
	name: string = ''
): MappedElement[] => {
	if (
		!target ||
		typeof target === 'boolean' ||
		typeof target === 'string' ||
		!('type' in target) ||
		target.type === Fragment
	) {
		return elements;
	}
	// if the type matches, we found our element
	if (target.type === source) return [...elements, { name, element: target }];

	// if there aren't any more children to search, stop looking
	if (!('children' in target.props)) return elements;

	const elementCounts = initElementCounts();
	const desiredElements: MappedElement[] = [];
	for (const child of toArray(target.props.children)) {
		const childName = getElementName(child, elementCounts);
		desiredElements.push(...getAllElements(child, source, elements, [name, childName].filter(Boolean).join('')));
	}
	// no element matches found, give up all hope...
	return [...elements, ...desiredElements];
};

const getElementName = (element: ChildElement<RscElement>, elementCounts: ElementCounts) => {
	if (!(isRscElement(element) && 'displayName' in element.type)) return '';
	// use displayName since it is the olny way to check alpha and beta components
	switch (element.type.displayName) {
		case Area.displayName:
			elementCounts.area++;
			return getComponentName(element, `area${elementCounts.area}`);
		case Axis.displayName:
			elementCounts.axis++;
			return getComponentName(element, `axis${elementCounts.axis}`);
		case AxisAnnotation.displayName:
			elementCounts.axisAnnotation++;
			return getComponentName(element, `Annotation${elementCounts.axisAnnotation}`);
		case Bar.displayName:
			elementCounts.bar++;
			return getComponentName(element, `bar${elementCounts.bar}`);
		case Donut.displayName:
			elementCounts.donut++;
			return getComponentName(element, `donut${elementCounts.donut}`);
		case Legend.displayName:
			elementCounts.legend++;
			return getComponentName(element, `legend${elementCounts.legend}`);
		case Line.displayName:
			elementCounts.line++;
			return getComponentName(element, `line${elementCounts.line}`);
		case Trendline.displayName:
			return getComponentName(element, 'Trendline');
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
export const setSelectedSignals = ({
	selectedData,
	selectedIdSignalName,
	selectedSeriesSignalName,
	view,
}: {
	selectedData: Datum | null;
	selectedIdSignalName: string | null;
	selectedSeriesSignalName: string | null;
	view: View;
}) => {
	if (selectedIdSignalName) {
		view.signal(selectedIdSignalName, selectedData?.[MARK_ID] ?? null);
	}
	if (selectedSeriesSignalName) {
		view.signal(selectedSeriesSignalName, selectedData?.[SERIES_ID] ?? null);
	}
};
