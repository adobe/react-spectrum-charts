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
import { MutableRefObject } from 'react';

import { COMPONENT_NAME } from '@constants';
import { toggleStringArrayValue } from '@utils';
import { Item, Scene, SceneGroup, SceneItem, ScenegraphEvent, View } from 'vega';

import { Datum, MarkBounds } from '../types';

export type ActionItem = Item | undefined | null;

/**
 * Generates the callback for the mark click handler
 * @param chartView
 * @param hiddenSeries
 * @param chartId
 * @param selectedData
 * @param selectedDataBounds
 * @param selectedDataName
 * @param setHiddenSeries
 * @param legendIsToggleable
 * @param onLegendClick
 * @returns
 */
export const getOnMarkClickCallback = (
	chartView: MutableRefObject<View | undefined>,
	hiddenSeries: string[],
	chartId: MutableRefObject<string>,
	selectedData: MutableRefObject<Datum | null>,
	selectedDataBounds: MutableRefObject<MarkBounds | undefined>,
	selectedDataName: MutableRefObject<string | undefined>,
	setHiddenSeries: (hiddenSeries: string[]) => void,
	legendIsToggleable?: boolean,
	onLegendClick?: (seriesName: string) => void
): ((event: ScenegraphEvent, item: ActionItem) => void) => {
	return (_event: ScenegraphEvent, item: ActionItem) => {
		if (!item) return;
		if (isLegendItem(item)) {
			handleLegendItemClick(item, hiddenSeries, setHiddenSeries, legendIsToggleable, onLegendClick);
			return;
		}

		// if they clicked on a mark group then we want to go down an additional level
		if (isGroupMarkItem(item)) {
			item = item.datum;
		}
		if (isAreaMarkItem(item)) {
			// for area, we want to use the hovered data not the entire area
			item = getItemForAreaMark(item);
		}
		// verify that the user didn't click on a legend, legend marktype = 'group'
		if (isItemSceneItem(item) && item.mark.marktype !== 'group' && chartView.current) {
			// clicking the button will trigger a new view since it will cause a rerender
			// this means we don't need to set the signal value since it would just be cleared on rerender
			// instead, the rerender will set the value of the signal to the selectedData
			const itemName = getItemName(item);
			selectedData.current = { [COMPONENT_NAME]: itemName, ...item.datum };
			// we need to anchor the popover to a div that we move to the same location as the selected mark
			selectedDataBounds.current = getItemBounds(item);
			selectedDataName.current = itemName;
			(document.querySelector(`#${chartId.current} > div > #${itemName}-button`) as HTMLButtonElement)?.click();
		}
	};
};

/**
 * Updates the hidden series when a legend item is clicked
 * @param item
 * @param onLegendMouseInput
 * @returns
 */
export const handleLegendItemMouseInput = (
	item: ActionItem,
	onLegendMouseInput?: (seriesName: string) => void
): void => {
	const legendItemValue = getLegendItemValue(item);
	if (legendItemValue) {
		onLegendMouseInput?.(legendItemValue);
	}
};

/**
 * Generates the callback for simple mouse events
 * @param item
 * @param onLegendMouseInput
 * @returns
 */
export const getOnMouseInputCallback = (
	onMouseInput?: (seriesName: string) => void
): ((event: ScenegraphEvent, item: ActionItem) => void) => {
	return (_event: ScenegraphEvent, item: ActionItem) => {
		if (!item) return;
		if (isLegendItem(item)) {
			handleLegendItemMouseInput(item, onMouseInput);
		}
	};
};

/**
 * Checks if the clicked item is a legend item
 * @param item
 * @returns
 */
export const isLegendItem = (item: Item): boolean => {
	if (isSceneGroup(item)) return true;
	return isItemSceneItem(item) && item.mark.role === 'legend-symbol';
};

/**
 * Updates the hidden series when a legend item is clicked
 * @param item
 * @param hiddenSeries
 * @param setHiddenSeries
 * @returns
 */
export const handleLegendItemClick = (
	item: ActionItem,
	hiddenSeries: string[],
	setHiddenSeries: (hiddenSeries: string[]) => void,
	legendIsToggleable?: boolean,
	onLegendClick?: (seriesName: string) => void
): void => {
	const legendItemValue = getLegendItemValue(item);
	if (legendItemValue === undefined) return;
	onLegendClick?.(legendItemValue);
	if (!legendIsToggleable) return;
	setHiddenSeries(toggleStringArrayValue(hiddenSeries, legendItemValue));
};

/**
 * Gets the value of the clicked legend item
 * @param item
 * @returns
 */
export const getLegendItemValue = (item: unknown): string | undefined => {
	if (isSceneGroup(item)) {
		const labelItem = item.items.find((mark) => 'role' in mark && mark.role === 'legend-label');
		if (!isScene(labelItem)) return;
		if (!labelItem.items[0]) return;
		if (!('datum' in labelItem.items[0])) return;
		return (labelItem.items[0].datum as { value: string }).value;
	}
	if (isItemSceneItem(item)) {
		return (item.datum as { value: string }).value;
	}
};

/**
 * Checks if the clicked item is a group mark item
 * @param item
 * @returns
 */
export const isGroupMarkItem = (item: Item): boolean => {
	return isItemSceneItem(item.datum);
};

/**
 * Checks if the clicked item is an area mark item
 * @param item
 * @returns
 */
export const isAreaMarkItem = (item: ActionItem): boolean => {
	return item?.mark.marktype === 'area';
};

/**
 * Gets the item that should be used for the selected point when the user clicks on an area mark
 * The default clicked mark is the entire area
 * This will traverse the object to get the correct associated point
 * @param item
 * @returns
 */
export const getItemForAreaMark = (item: ActionItem): ActionItem => {
	// for area, we want to use the hovered data not the entire area
	const pointMark = item?.mark.group.items.find((mark) => mark.name.includes('_anchorPoint'));
	if (pointMark && pointMark.items.length === 1) {
		const point = pointMark.items[0];
		if (isItemSceneItem(point)) {
			return point;
		}
	}
	return item;
};

/**
 * Gets the bounds for an item provided by the click handler.
 * If the item is in a group that has an offset (like for a grouped bar),
 * then the offset is added to the bounds.
 * @param item
 * @returns MarkBounds
 */
export const getItemBounds = (item: ActionItem): MarkBounds => {
	if (isItemSceneItem(item)) {
		const groupOffset = getGroupOffset(item);
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
 * Gets the bounds for an item provided by the click handler.
 * If the item is in a group that has an offset (like for a grouped bar),
 * then the offset is added to the bounds.
 * @param item
 * @returns MarkBounds
 */
export const getItemName = (item: ActionItem): string | undefined => {
	if (isItemSceneItem(item)) {
		const itemName = (item.mark as unknown as { name: string }).name;
		if (!itemName) return;
		return itemName.split('_')[0];
	}
};

/**
 * Gets the the group offset for the provided item.
 *
 * Mark groups can be nested multiple levels deep.
 * This function will recursively step through all groups to get the total offset.
 * @param item
 * @returns
 */
export const getGroupOffset = (item: ActionItem): { x: number; y: number } => {
	if (isItemSceneItem(item)) {
		// recursively step through all groups to get the total offset
		const { x, y } = getGroupOffset(item.mark.group);
		return {
			x: (item.mark.group.x || 0) + x,
			y: (item.mark.group.y || 0) + y,
		};
	}
	return { x: 0, y: 0 };
};

/* TYPE GUARDS */

export function isItemSceneItem(item: unknown): item is Item & SceneItem {
	if (typeof item !== 'object' || item === null) return false;
	return 'bounds' in item && 'datum' in item;
}

export const isSceneGroup = (item: unknown): item is SceneGroup => {
	if (typeof item !== 'object' || item === null) return false;
	return 'context' in item && 'items' in item && 'height' in item && 'width' in item;
};

export const isScene = (item: unknown): item is Scene => {
	if (typeof item !== 'object' || item === null) return false;
	return 'bounds' in item && 'clip' in item;
};
