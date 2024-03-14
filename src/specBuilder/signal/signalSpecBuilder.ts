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
import { MARK_ID, SERIES_ID } from '@constants';
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
export const getUncontrolledHoverSignal = (name: string, nestedDatum?: boolean, eventName: string = name): Signal => {
	return {
		name: `${name}_hoveredId`,
		value: null,
		on: [
			{ events: `@${eventName}:mouseover`, update: `${nestedDatum ? 'datum.' : ''}datum.${MARK_ID}` },
			{ events: `@${eventName}:mouseout`, update: 'null' }
		]
	};
};

/**
 *  Returns a controlled hover signal.
 *  Controlled hover signals get manually updated via the view in Chart.tsx
 */
export const getControlledHoverSignal = (name: string): Signal => {
	return {
		name: `${name}_controlledHoveredId`,
		value: null,
		on: [{ events: `@${name}:mouseout`, update: 'null' }]
	};
};

/**
 *  Returns the hover signal for series
 *  Useful when you want to highlight the whole series on hover (area)
 */
export const getSeriesHoveredSignal = (name: string, nestedDatum?: boolean, eventName: string = name): Signal => {
	return {
		name: `${name}_hoveredSeries`,
		value: null,
		on: [
			{ events: `@${eventName}:mouseover`, update: `${nestedDatum ? 'datum.' : ''}datum.${SERIES_ID}` },
			{ events: `@${eventName}:mouseout`, update: 'null' }
		]
	};
};

//TODO: add documentation
/**
 * Returns the highlighted series signal
 */
export const getHighlightSeriesSignal = (name: string, includeHiddenSeries: boolean, keys?: string[], isPrev?: boolean): Signal => {
	const hoveredSeries = `domain("${name}Entries")[datum.index]`;
	const update = includeHiddenSeries
		? `indexof(hiddenSeries, ${hoveredSeries}) === -1 ? ${hoveredSeries} : ""`
		: hoveredSeries;
	return {
		name: keys ? `${name}_highlight` : isPrev == true ? 'highlightedSeries_prev': `highlightedSeries`,
		value: null,
		on: !isPrev ? [
			{ events: `@${name}_legendEntry:mouseover`, update },
			{ events: `@${name}_legendEntry:mouseout`, update: '""' }
		] : [
			{ events: `@${name}_legendEntry:mouseover`, update }
		]
	};
};

/**
 * Returns the legendLabels series signal
 */
export const getLegendLabelsSeriesSignal = (value: unknown = null): Signal => {
	return {
		name: 'legendLabels',
		value
	};
};

/**
 * Returns a basic signal
 */
export const getGenericSignal = (name: string, value: unknown = null): Signal => {
	return { name, value };
};

//TODO: Add documentation
export const getAnimationSignals = (name: string): Signal[] => {
	return [
		getRSCAnimation(),
		getRSCColorAnimationDirection(name),
		getRSCColorAnimation(),
		getPrevHoverSignal(name),
		getSelectedID(name)
	]
}

export const getRSCLegendColorAnimationDirection = (name: string): ({ update: string; events: string })[] => {
	return [
		{ events: `@${name}_legendEntry:mouseover`, update: '1' },
		{ events: `@${name}_legendEntry:mouseout`, update: '-1' }
	];
};

//TODO: add documentation
const getRSCAnimation = (): Signal => {
	return {
		name: 'rscAnimation',
		value: 0,
		on: [{
			events: 'timer{16}',
			update: 'scale(\'rscAnimationCurve\', scale(\'rscAnimationCurveInverse\', rscAnimation) + 0.03333333333333334)'
		}]
	};
};

//TODO: add documentation
const getRSCColorAnimationDirection = (name: string): Signal => {
	if (name === 'line0') {
		name = name.concat('_voronoi')
	}
	return {
		name: 'rscColorAnimationDirection',
		value: -1,
		on: [
			{ events: `@${name}:mouseover`, update: '1' },
			{ events: `@${name}:mouseout`, update: '-1' },
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
const getPrevHoverSignal = (name: string): Signal => {
	return {
		"name": `${name}_hoveredId_prev`,
		"value": null,
		"on": [
			{ "events": `@${name}:mouseover`, "update": `datum.${MARK_ID}` },
		]
	}
}

//TODO: add documentation
const getSelectedID = (name: string): Signal => {
	return {
		name: `${name}_selectedId`, value: null
	}
}

//TODO: add doc/test/etc
export const getHoveredSeriesPrevSignal = (name: string, nestedDatum?: boolean): Signal => {
	return {
		name: `${name}_hoveredSeries_prev`,
		value: null,
		on: [
			{
				events: `@${name == 'line0' || name.includes('Trendline') ? `${name}_voronoi`: `${name}`}:mouseover`,
				update: `${nestedDatum ? 'datum.' : ''}datum.${SERIES_ID}`
			}
		]
	}
}