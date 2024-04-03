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
import { HIGHLIGHTED_ITEM, HIGHLIGHTED_SERIES, MARK_ID, RSC_ANIMATION, SERIES_ID } from '@constants';
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
export const getControlledHoverSignal = (name: string): Signal => {
	return {
		name: `${name}_controlledHoveredId`,
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
) => {
	const highlightedSeriesSignal = signals.find((signal) => signal.name === HIGHLIGHTED_SERIES);
	if (highlightedSeriesSignal) {
		if (highlightedSeriesSignal.on === undefined) {
			highlightedSeriesSignal.on = [];
		}
		//TODO: Add documentation
		const highlightedSeriesSignalPrev = signals.find((signal) => signal.name === `${HIGHLIGHTED_SERIES}_prev`)
		const hoveredSeries = `domain("${legendName}Entries")[datum.index]`;
		const update = includeHiddenSeries
			? `indexof(hiddenSeries, ${hoveredSeries}) === -1 ? ${hoveredSeries} : null`
			: hoveredSeries;
		highlightedSeriesSignal.on.push(
			...[
				{ events: `@${legendName}_legendEntry:mouseover`, update },
				{ events: `@${legendName}_legendEntry:mouseout`, update: 'null' },
			]
		);
		//TODO: Add documentation
		if (highlightedSeriesSignalPrev) {
			highlightedSeriesSignalPrev.on?.push(
				{ events: `@${legendName}_legendEntry:mouseover`, update }
			)
		}
	}
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

/**
 * adds on events to the highlighted item signal
 * @param signals
 * @param markName
 * @param datumOrder how deep the datum is nested (i.e. 1 becomes datum.rscMarkId, 2 becomes datum.datum.rscMarkId, etc.)
 */
export const addHighlightedItemSignalEvents = (signals: Signal[], markName: string, datumOrder = 1) => {
	const highlightedItemSignal = signals.find((signal) => signal.name === HIGHLIGHTED_ITEM);
	if (highlightedItemSignal) {
		if (highlightedItemSignal.on === undefined) {
			highlightedItemSignal.on = [];
		}
		highlightedItemSignal.on.push(
			...[
				{
					events: `@${markName}:mouseover`,
					update: `${new Array(datumOrder).fill('datum.').join('')}${MARK_ID}`,
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
 */
export const addHighlightedSeriesSignalEvents = (signals: Signal[], markName: string, datumOrder = 1) => {
	const highlightedSeriesSignal = signals.find((signal) => signal.name === HIGHLIGHTED_SERIES);
	if (highlightedSeriesSignal) {
		if (highlightedSeriesSignal.on === undefined) {
			highlightedSeriesSignal.on = [];
		}
		highlightedSeriesSignal.on.push(
			...[
				{
					events: `@${markName}:mouseover`,
					update: `${new Array(datumOrder).fill('datum.').join('')}${SERIES_ID}`,
				},
				{ events: `@${markName}:mouseout`, update: 'null' },
			]
		);
	}
};
//TODO: Add documentation
export const getRSCAnimationSignals = (name: string, nestedDatum?: boolean, isNull?: boolean): Signal[] => {
	return [
		getRSCAnimation(),
		getRSCColorAnimationDirection(name),
		getRSCColorAnimation(),
		getRSCHighlightedItemPrevSignal(name, nestedDatum),
		getRSCHighlightedSeriesPrevSignal(name, nestedDatum, isNull),
	]
}
//TODO: Add documentation
export const getRSCLegendColorAnimationDirection = (name: string): ({ update: string; events: string })[] => {
	return [
		{ events: `@${name}_legendEntry:mouseover`, update: '1' },
		{ events: `@${name}_legendEntry:mouseout`, update: '-1' }
	];
};
//TODO: Add documentation
export const getRSCTrendlineColorAnimationDirection = (name: string): ({ events: string, update: string })[] => {
	return [
		{ events: `@${name}_voronoi:mouseover`, update: '1' },
		{ events: `@${name}_voronoi:mouseout`, update: '-1' }
	]
}
//TODO: Add documentation
export const getRSCLegendHighlightedItemPrev = (name: string): ({ events: string, update: string})[] => {
	return [
		{ events: `@${name}_legendEntry:mouseover`, update: 'null'}
	]
}
//TODO: add documentation
const getRSCAnimation = (): Signal => {
	return {
		name: RSC_ANIMATION,
		value: 0,
		on: [{
			events: 'timer{16.666666666666668}',
			update: `scale('rscAnimationCurve', scale('rscAnimationCurveInverse', ${RSC_ANIMATION}) + 0.03333333333333334)`
		}]
	};
};
//TODO: add documentation
const getRSCColorAnimationDirection = (name: string): Signal => {
	return {
		name: 'rscColorAnimationDirection',
		value: -1,
		on: [
			{ events: `@${concatName(name)}:mouseover`, update: '1' },
			{ events: `@${concatName(name)}:mouseout`, update: '-1' },
		]
	};
};
//TODO: add documentation
const getRSCColorAnimation = (): Signal => {
	return {
		name: 'rscColorAnimation',
		value: 0,
		on: [
			{
				events: 'timer{16.666666666666668}',
				update: 'scale(\'rscAnimationCurve\', scale(\'rscAnimationCurveInverse\', rscColorAnimation) ' +
					'+ 0.06 * rscColorAnimationDirection)'
			}
		]
	};
};
//TODO add documentation
const getRSCHighlightedItemPrevSignal = (name: string, nestedDatum?: boolean): Signal => {
	return {
		name: `${HIGHLIGHTED_ITEM}_prev`,
		value: null,
		on: [
			{ events: `@${concatName(name)}:mouseover`, update: `${nestedDatum ? 'datum.' : ''}datum.${MARK_ID}` },
		]
	}
}
//TODO: add doc/test/etc
const getRSCHighlightedSeriesPrevSignal = (name: string, nestedDatum?: boolean, isNull?: boolean): Signal => {
	return {
		name: `${HIGHLIGHTED_SERIES}_prev`,
		value: null,
		on: [
			{
				events: `@${concatName(name)}:mouseover`,
				update: isNull ? 'null' : `${nestedDatum ? 'datum.' : ''}datum.${SERIES_ID}`
			}
		]
	}
}

const concatName = (name: string): string => {
	if (name == 'line0' || name == 'scatter0' || name.includes('Trendline')) {
		name = name.concat('_voronoi')
	}
	return name
}