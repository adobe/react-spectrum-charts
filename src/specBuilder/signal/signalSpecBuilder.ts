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
import { FILTERED_TABLE, HIGHLIGHTED_GROUP, MARK_ID, RSC_ANIMATION, HIGHLIGHTED_ITEM, HIGHLIGHTED_SERIES, SERIES_ID } from '@constants';
import { Signal } from 'vega';

/**
 * Does signal with given name exist?
 */
export const hasSignalByName = (signals: Signal[], name: string) => {
	return signals.some((signal) => signal.name === name);
};

/**
 *  Returns a controlled hover signal.
 *  Controlled hover signals get manually updated via the view in Chart.tsx
 */
export const getControlledHoveredIdSignal = (name: string): Signal => {
	return {
		name: `${name}_controlledHoveredId`,
		value: null,
		on: [{ events: `@${name}:mouseout`, update: 'null' }],
	};
};

/**
 *  Returns a controlled hover signal.
 *  Controlled hover signals get manually updated via the view in Chart.tsx
 */
export const getControlledHoveredGroupSignal = (name: string): Signal => {
	return {
		name: `${name}_controlledHoveredGroup`,
		value: null,
		on: [{ events: `@${name}:mouseout`, update: 'null' }],
	};
};

/**
 * Returns the highlighted series signal
 */
export const addHighlightSignalLegendHoverEvents = (
	signals: Signal[],
	legendName: string,
	includeHiddenSeries: boolean,
	keys?: string[]
) => {
	const signalName = keys?.length ? HIGHLIGHTED_GROUP : HIGHLIGHTED_SERIES;
	const highlightedItemSignal = signals.find((signal) => signal.name === signalName);
	if (highlightedItemSignal) {
		if (highlightedItemSignal.on === undefined) {
			highlightedItemSignal.on = [];
		}
		const update = getHighlightSignalUpdateExpression(legendName, includeHiddenSeries, keys);
		highlightedItemSignal.on.push(
		...[
			{
				events: `@${legendName}_legendEntry:mouseover`,
				update
			},
			{ events: `@${legendName}_legendEntry:mouseout`, update: 'null' },
		]
	);
		const highlightedItemSignalPrev = signals.find((signal) => signal.name === `${signalName}_prev`);
		//TODO: Add documentation
		if (highlightedItemSignalPrev) {
			highlightedItemSignalPrev.on?.push({ events: `@${legendName}_legendEntry:mouseover`, update });
		}
	}
};

export const getHighlightSignalUpdateExpression = (
	legendName: string,
	includeHiddenSeries: boolean,
	keys?: string[]
) => {
	const hoveredSeriesExpression = `domain("${legendName}Entries")[datum.index]`;
	if (!includeHiddenSeries) return hoveredSeriesExpression;
	if (keys?.length) {
		return `indexof(pluck(data("${FILTERED_TABLE}"),"${legendName}_highlightGroupId"), ${hoveredSeriesExpression}) !== -1 ? ${hoveredSeriesExpression} : null`;
	}
	return `indexof(hiddenSeries, ${hoveredSeriesExpression}) === -1 ? ${hoveredSeriesExpression} : null`;
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
 * Returns a basic value based signal
 */
export const getGenericValueSignal = (name: string, value: unknown = null): Signal => {
	return { name, value };
};

/**
 * Returns a basic value based signal
 */
export const getGenericUpdateSignal = (name: string, update: string): Signal => {
	return { name, update };
};

/**
 * adds on events to the highlighted item signal
 * @param signals
 * @param markName
 * @param datumOrder how deep the datum is nested (i.e. 1 becomes datum.rscMarkId, 2 becomes datum.datum.rscMarkId, etc.)
 * @param animations
 * @param animateFromZero
 * @param needsDisable
 * @param excludeDataKey data items with a truthy value for this key will be excluded from the signal
 */
export const addHighlightedItemSignalEvents = (
	{
		signals,
		markName,
		idKey,
		excludeDataKeys,
		datumOrder = 1,
		animations = false,
		animateFromZero = false,
	}: {
		signals: Signal[],
		markName: string,
		idKey: string,
		excludeDataKeys?: string[],
		datumOrder?: number,
		animations?: boolean,
		animateFromZero?: boolean,
		needsDisable?: boolean
	}
) => {
	const highlightedItemSignal = signals.find((signal) => signal.name === HIGHLIGHTED_ITEM);
	if (highlightedItemSignal) {
		if (highlightedItemSignal.on === undefined) {
			highlightedItemSignal.on = [];
		}
		const datum = new Array(datumOrder).fill('datum.').join('');

    const update = animations && animateFromZero ? `timerValue === 1 ? ${datum}${idKey} : null` : `${datum}${idKey}`;
		const excludeDataKeysCondition = excludeDataKeys
			?.map((excludeDataKey) => `${datum}${excludeDataKey}`)
			.join(' || ');
		highlightedItemSignal.on.push(
			...[
				{
					events: `@${markName}:mouseover`,
					update: excludeDataKeys?.length
						? `(${excludeDataKeysCondition}) ? null : ${update}`
						: update,
				},
				{ events: `@${markName}:mouseout`, update: 'null' },
			]
		);
	}
};

/**
 * adds on events to the highlighted series signal
 * @param signals
 * @param markName
 * @param datumOrder how deep the datum is nested (i.e. 1 becomes datum.rscMarkId, 2 becomes datum.datum.rscMarkId, etc.)
 * @param excludeDataKey data items with a truthy value for this key will be excluded from the signal
 */
export const addHighlightedSeriesSignalEvents = (
	signals: Signal[],
	markName: string,
	datumOrder = 1,
	excludeDataKeys?: string[]
) => {
	const highlightedSeriesSignal = signals.find((signal) => signal.name === HIGHLIGHTED_SERIES);
	if (highlightedSeriesSignal) {
		if (highlightedSeriesSignal.on === undefined) {
			highlightedSeriesSignal.on = [];
		}
		const datum = new Array(datumOrder).fill('datum.').join('');

		const excludeDataKeysCondition = excludeDataKeys
			?.map((excludeDataKey) => `${datum}${excludeDataKey}`)
			.join(' || ');
		highlightedSeriesSignal.on.push(
			...[
				{
					events: `@${markName}:mouseover`,
					update: excludeDataKeys?.length
						? `(${excludeDataKeysCondition}) ? null : ${datum}${SERIES_ID}`
						: `${datum}${SERIES_ID}`,
				},
				{ events: `@${markName}:mouseout`, update: 'null' },
			]
		);
	}
};
/**
 * get all signals required for opacity animations
 * @param name
 * @param nestedDatum
 * @param isNull
 * @returns Signal[]
 */
//TODO: Add tests
export const getRscAnimationSignals = (name: string, nestedDatum?: boolean, isNull?: boolean): Signal[] => {
	return [
		getRscAnimation(),
		getRscColorAnimationDirection(name),
		getRscColorAnimation(),
		getRscHighlightedItemPrevSignal(name, nestedDatum),
		getRscHighlightedSeriesPrevSignal(name, nestedDatum, isNull),
	];
};
/**
 * gets the animations direction signal events for legends
 * @param name
 */
//TODO: Add tests
export const getRscLegendColorAnimationDirection = (name: string): { update: string; events: string }[] => {
	return [
		{ events: `@${name}_legendEntry:mouseover`, update: '1' },
		{ events: `@${name}_legendEntry:mouseout`, update: '-1' },
	];
};
/**
 * gets the animations direction signal events for trend lines
 * @param name
 */
//TODO: Add tests
export const getRscTrendlineColorAnimationDirection = (name: string): { events: string; update: string }[] => {
	return [
		{ events: `@${name}_voronoi:mouseover`, update: '1' },
		{ events: `@${name}_voronoi:mouseout`, update: '-1' },
	];
};
/**
 * gets the previous highlighted item events for legends
 * @param name
 */
//TODO: Add tests
export const getRscLegendHighlightedItemPrev = (name: string): { events: string; update: string }[] => {
	return [{ events: `@${name}_legendEntry:mouseover`, update: 'null' }];
};
/**
 * gets the animation signal for Opacity animations
 * @returns Signal
 */
//TODO: add tests
const getRscAnimation = (): Signal => {
	return {
		name: RSC_ANIMATION,
		value: 0,
		on: [
			{
				events: 'timer{16.666666666666668}',
				update: `scale('rscAnimationCurve', scale('rscAnimationCurveInverse', ${RSC_ANIMATION}) + 0.03333333333333334)`,
			},
		],
	};
};
/**
 * gets the Color animation direction signal for Opacity animations
 * @param name
 * @returns Signal
 */
//TODO: add tests
const getRscColorAnimationDirection = (name: string): Signal => {
	return {
		name: 'rscColorAnimationDirection',
		value: -1,
		on: [
			{ events: `@${concatName(name)}:mouseover`, update: '1' },
			{ events: `@${concatName(name)}:mouseout`, update: '-1' },
		],
	};
};
/**
 * gets the color animation signal for Opacity animations
 * @returns Signal
 */
//TODO: add tests
const getRscColorAnimation = (): Signal => {
	return {
		name: 'rscColorAnimation',
		value: 0,
		on: [
			{
				events: 'timer{16.666666666666668}',
				update:
					"scale('rscAnimationCurve', scale('rscAnimationCurveInverse', rscColorAnimation) " +
					'+ 0.06 * rscColorAnimationDirection)',
			},
		],
	};
};
/**
 * Gets the previous highlighted item signal for opacity animations. This signal is important for easing out
 * when there is no hovering over the chart.
 * @param name
 * @param nestedDatum
 * @returns Signal
 */
//TODO add test
const getRscHighlightedItemPrevSignal = (name: string, nestedDatum?: boolean): Signal => {
	return {
		name: `${HIGHLIGHTED_ITEM}_prev`,
		value: null,
		on: [{ events: `@${concatName(name)}:mouseover`, update: `${nestedDatum ? 'datum.' : ''}datum.${MARK_ID}` }],
	};
};
/**
 * Gets the previous highlighted Series signal. Important for when there is no hovering over
 * legends with highlighting enabled.
 * @param name
 * @param nestedDatum
 * @param isNull
 * @returns Signal
 */
//TODO: add tests
const getRscHighlightedSeriesPrevSignal = (name: string, nestedDatum?: boolean, isNull?: boolean): Signal => {
	return {
		name: `${HIGHLIGHTED_SERIES}_prev`,
		value: null,
		on: [
			{
				events: `@${concatName(name)}:mouseover`,
				update: isNull ? 'null' : `${nestedDatum ? 'datum.' : ''}datum.${SERIES_ID}`,
			},
		],
	};
};

/**
 * Concatenates the name if the mark has voronoi marks
 * @param name
 * @returns string
 */
//TODO: add tests
const concatName = (name: string): string => {
	if (name == 'line0' || name == 'scatter0' || name.includes('Trendline')) {
		name = name.concat('_voronoi');
	}
	return name;
};
