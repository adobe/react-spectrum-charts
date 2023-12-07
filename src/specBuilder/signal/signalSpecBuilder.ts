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
import {
	ANIMATION_COLOR_DIRECTION,
	ANIMATION_COLOR_DIRECTION_FADE,
	ANIMATION_COLOR_SIGNAL,
	ANIMATION_SCALE,
	ANIMATION_SCALE_INVERSE,
	ANIMATION_SIGNAL,
	MARK_ID,
	SERIES_ID,
} from '@constants';
import { getAnimationDefaults } from '@utils';
import { Animation } from 'types';
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
export const getUncontrolledHoverSignals = (
	name: string,
	nestedDatum?: boolean,
	eventName: string = name
): Signal[] => {
	return getCurrentAndPrevHoverSignals(
		`${name}_hoveredId`,
		`${nestedDatum ? 'datum.' : ''}datum.${MARK_ID}`,
		eventName
	);
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
 *  Returns the hover signal for series
 *  Useful when you want to highlight the whole series on hover (area)
 */
export const getSeriesHoveredSignals = (name: string, nestedDatum?: boolean, eventName: string = name): Signal[] => {
	return getCurrentAndPrevHoverSignals(
		`${name}_hoveredSeries`,
		`${nestedDatum ? 'datum.' : ''}datum.${SERIES_ID}`,
		eventName
	);
};

const getCurrentAndPrevHoverSignals = (name: string, updateValue: string, eventName: string = name) => {
	const mouseoverEvent = { events: `@${eventName}:mouseover`, update: updateValue };
	return [
		{
			name: name,
			value: null,
			on: [mouseoverEvent, { events: `@${eventName}:mouseout`, update: 'null' }],
		},
		{
			// Keeps track of the previously hovered id without clearing it when the mouse leaves the mark
			name: `${name}_prev`,
			value: null,
			on: [mouseoverEvent],
		},
	];
};

/**
 * Returns the highlighted series signal
 */
export const getHighlightSeriesSignals = (name: string, includeHiddenSeries: boolean): Signal[] => {
	const hoveredSeries = 'domain("legendEntries")[datum.index]';
	const update = includeHiddenSeries
		? `indexof(hiddenSeries, ${hoveredSeries}) === -1 ? ${hoveredSeries} : ''`
		: hoveredSeries;
	return [
		{
			name: 'highlightedSeries',
			value: null,
			on: [
				{ events: `@${name}:mouseover`, update },
				{ events: `@${name}:mouseout`, update: "''" },
			],
		},
		{
			// Keeps track of the previously hovered series without clearing it when the mouse leaves the series
			name: 'highlightedSeries_prev',
			value: null,
			on: [{ events: `@${name}:mouseover`, update }],
		},
	];
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

// 60 frames every 1000 milliseconds
const FPS = 1000 / 60;

export const getAnimationSignal = (animation: Animation): Signal => {
	const { duration, curve } = getAnimationDefaults(animation);

	// Steps = total number of frames in the animation
	// Step value = amount to increment the animation signal by each frame

	// Divide duration by the time for each frame to get the number of steps.
	// Use Math.abs to ensure that the duration is positive.
	const steps = Math.abs(duration) / FPS;
	const stepValue = 1 / steps;
	let signalOn: Signal['on'];

	if (curve === 'ease-in-out') {
		signalOn = [
			{
				events: `timer{${FPS}}`,
				update:
					// Use an ease-in scale for the first half of the animation, and an ease-out scale for the second half.
					`${ANIMATION_SIGNAL} < .5 ? ` +
					`scale('${ANIMATION_SCALE}', scale('${ANIMATION_SCALE_INVERSE}', ${ANIMATION_SIGNAL}) + ${stepValue}) : ` +
					// Have to subtract .5 from the signal because the {ANIMATION_SCALE} expects a value between 0 and .5,
					`scale('${ANIMATION_SCALE}Out', scale('${ANIMATION_SCALE}', ${ANIMATION_SIGNAL} - 0.5) + ${stepValue})`,
			},
		];
	} else {
		signalOn = [
			{
				events: `timer{${FPS}}`,
				// We need to apply the inverse transform to the animation signal when adding the step value,
				// so that the signal will increase at a constant rate, despite the easing curve.
				update: `scale('${ANIMATION_SCALE}', scale('${ANIMATION_SCALE_INVERSE}', ${ANIMATION_SIGNAL}) + ${stepValue})`,
			},
		];
	}

	return {
		name: ANIMATION_SIGNAL,
		value: 0,
		on: signalOn,
	};
};

export const getColorAnimationSignals = (eventName: string): Signal[] => {
	return [
		{
			name: ANIMATION_COLOR_DIRECTION,
			value: ANIMATION_COLOR_DIRECTION_FADE.in,
			on: getColorAnimationFadeEvents(eventName),
		},
		{
			name: ANIMATION_COLOR_SIGNAL,
			value: 0,
			on: [
				{
					events: `timer{${FPS}}`,
					update: `clamp(${ANIMATION_COLOR_SIGNAL} + .06 * ${ANIMATION_COLOR_DIRECTION}, 0, 1)`,
				},
			],
		},
	];
};

export const getColorAnimationFadeEvents = (eventName: string) => {
	return [
		{
			events: `@${eventName}:mouseover`,
			update: `${ANIMATION_COLOR_DIRECTION_FADE.out}`,
		},
		{
			events: `@${eventName}:mouseout`,
			update: `${ANIMATION_COLOR_DIRECTION_FADE.in}`,
		},
	];
};
