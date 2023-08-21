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
import { Item, MarkType, SceneItem, Spec, View } from 'vega';

import { Axis, Bar, ChartPopover, ChartTooltip, Legend, Line } from './';
import {
	ChartChildElement,
	ChartTooltipElement,
	ChildElement,
	Children,
	Datum,
	LegendElement,
	MarkBounds,
	MarkChildElement,
	PopoverHandler,
	PrismChildElement,
	PrismElement,
	TooltipHandler,
} from './types';

// coerces a value that could be a single value or an array of that value to an array
export function toArray<Child>(children: Child | Child[] | undefined): Child[] {
	if (children === undefined) return [];
	if (Array.isArray(children)) return children;
	return [children];
}

// removes all non-prism specific elements
export const sanitizeChartChildren = (children: Children<PrismChildElement> | undefined): ChartChildElement[] => {
	return toArray(children).filter((child): child is ChartChildElement => isChartChildElement(child));
};

export const sanitizeMarkChildren = (children: Children<MarkChildElement> | undefined): MarkChildElement[] => {
	return toArray(children).filter((child): child is MarkChildElement => isMarkChildElement(child));
};

export const sanitizeTrendlineChildren = (
	children: Children<ChartTooltipElement> | undefined
): ChartTooltipElement[] => {
	return toArray(children).filter((child): child is ChartTooltipElement =>
		isMarkChildElement<ChartTooltipElement>(child)
	);
};

const isChartChildElement = (child: ChildElement<ChartChildElement> | undefined): child is ChartChildElement => {
	return isPrismComponent(child);
};
const isMarkChildElement = <T extends MarkChildElement = MarkChildElement>(
	child: ChildElement<T> | undefined
): child is T => {
	return isPrismComponent(child);
};

const isPrismComponent = (child?: ChildElement<MarkChildElement> | ChildElement<ChartChildElement>): boolean => {
	return Boolean(
		child && typeof child !== 'string' && typeof child !== 'boolean' && 'type' in child && child.type !== Fragment
	);
};

// creates a default name for a mark
export function getDefaultMarkName(spec: Spec, type: MarkType): string {
	const nElements = spec.marks?.filter((mark) => mark.type === type).length ?? 0;
	return `${type}${nElements}`;
}

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

// converts any string to the snake_case equivalent
export function toSnakeCase(str: string) {
	const words = str.match(/[A-Z]{2,}(?=[A-Z][a-z]+\d*|\b)|[A-Z]?[a-z]+\d*|[A-Z]|\d+/g);
	if (words) {
		return words.map((x) => x.toLowerCase()).join('_');
	}
	return str;
}

// traverses the prism children to find the first element instance of the proivded type
export function getElement(
	element:
		| PrismElement
		| PrismChildElement
		| TooltipHandler
		| PopoverHandler
		| LegendElement
		| boolean
		| string
		| ReactFragment
		| undefined,
	type: typeof Axis | typeof Legend | typeof Line | typeof Bar | typeof ChartTooltip | typeof ChartPopover
): PrismElement | PrismChildElement | undefined {
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
 * Gets the bounds for an item provided by the click handler.
 * If the item is in a group that has an offset (like for a grouped bar),
 * then the offset is added to the bounds.
 * @param item
 * @returns MarkBounds
 */
export const getItemBounds = (item: Item | null | undefined): MarkBounds => {
	if (isItemSceneItem(item)) {
		const groupOffset = {
			x: item.mark.group.x || 0,
			y: item.mark.group.y || 0,
		};
		return {
			x1: item.bounds.x1 + groupOffset.x,
			x2: item.bounds.x2 + groupOffset.x,
			y1: item.bounds.y1 + groupOffset.y,
			y2: item.bounds.y2 + groupOffset.y,
		};
	}
	return { x1: 0, x2: 0, y1: 0, y2: 0 };
};

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
		view.signal(selectedIdSignalName, selectedData?.prismMarkId ?? null);
	}
	if (selectedSeriesSignalName) {
		view.signal(selectedSeriesSignalName, selectedData?.prismSeriesId ?? null);
	}
};

export function isItemSceneItem(item: unknown): item is Item & SceneItem {
	if (typeof item !== 'object' || item === null) return false;
	return 'bounds' in item && 'datum' in item;
}
