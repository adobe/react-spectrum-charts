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

import { Signal } from 'vega';

/**
 * Does signal with given name exist?
 */
export const hasSignalByName = (signals: Signal[], name: string) => {
	return signals.some((signal) => signal.name === name);
};

/**
 *  Returns the hover signal for points
 */
export const getUncontrolledHoverSignal = (name: string, nestedDatum?: boolean): Signal => {
	// if there is already an '_' in the name then add 'HoveredId'
	// ex: 'line0_voroni' => 'line0_voroniHoveredId'
	// if there is not an '_' in the name then add '_hoveredId'
	// ex: 'bar0' => 'bar0_hoveredId'
	const signalName = name.includes('_') ? `${name}HoveredId` : `${name}_hoveredId`;
	return {
		name: signalName,
		value: null,
		on: [
			{ events: `@${name}:mouseover`, update: `${nestedDatum ? 'datum.' : ''}datum.prismMarkId` },
			{ events: `@${name}:mouseout`, update: 'null' },
		],
	};
};

/**
 *  Returns a controlled hover signal.
 *  Controlled hover signals get manually updated via the view in Prism.tsx
 */
export const getControlledHoverSignal = (name: string): Signal => {
	return {
		name: `${name}_controlledHoveredId`,
		value: null,
		on: [{ events: `@${name}:mouseout`, update: 'null' }],
	};
};

/**
 *  Returns the hover signal for series
 *  Useful when you want to highlight the whole series on hover (area)
 */
export const getSeriesHoveredSignal = (name: string, series: string, eventName = name): Signal => {
	return {
		name: `${name}_hoveredSeries`,
		value: null,
		on: [
			{ events: `@${eventName}:mouseover`, update: `datum.${series}` },
			{ events: `@${eventName}:mouseout`, update: 'null' },
		],
	};
};

/**
 * Returns the highlighted series signal
 */
export const getHighlightSeriesSignal = (name: string, includeHiddenSeries: boolean): Signal => {
	const hoveredSeries = 'domain("legendEntries")[datum.index]';
	const update = includeHiddenSeries
		? `indexof(hiddenSeries, ${hoveredSeries}) === -1 ? ${hoveredSeries} : ""`
		: hoveredSeries;
	return {
		name: 'highlightedSeries',
		value: null,
		on: [
			{ events: `@${name}_legendEntry:mouseover`, update },
			{ events: `@${name}_legendEntry:mouseout`, update: '""' },
		],
	};
};

/**
 * Returns the legendLabels series signal
 */
export const getLegendLabelsSeriesSignal = (value: unknown = null): Signal => {
	return {
		name: 'legendLabels',
		value,
	};
};

/**
 * Returns a basic signal
 */
export const getGenericSignal = (name: string, value: unknown = null): Signal => {
	return { name, value };
};
