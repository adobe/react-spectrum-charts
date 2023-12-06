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
import { CSSProperties, useState } from 'react';

import { AnimationCurve } from 'types';

/**
 * converts a timestamp to a MMM D format
 * @param timestamp
 * @returns
 */
export const formatTimestamp = (timestamp: number): string => {
	// Create a Date object from the timestamp (assuming the timestamp is in milliseconds)
	const date = new Date(timestamp);

	// Define an array of month abbreviations
	const monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	// Get the month and day from the Date object
	const month = monthAbbreviations[date.getMonth()];
	const day = date.getDate();

	// Format the date in 'MMM D' format
	return `${month} ${day}`;
};

interface AnimationProps {
	curve: AnimationCurve;
	duration: number;
	dataSet: number;
}

export const useAnimationControls = (initialProps?: AnimationProps) => {
	const [animationProps, setAnimationProps] = useState<AnimationProps>({
		dataSet: 0,
		duration: 500,
		curve: 'linear',
		...initialProps,
	});

	const stateSetter = (newState: Partial<AnimationProps>) => () =>
		setAnimationProps((prev) => ({ ...prev, dataSet: (prev.dataSet + 1) % 2, ...newState }));

	const getSelectedStyle = (curveType: AnimationCurve): CSSProperties => ({
		borderColor: animationProps.curve === curveType ? 'blue' : undefined,
		backgroundColor: animationProps.curve === curveType ? 'lightblue' : undefined,
		borderWidth: 1,
		borderRadius: 4,
		padding: '2px 8px',
	});

	return {
		...animationProps,
		component: (
			<div style={{ marginBottom: 16, display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
				<span>Animation curve</span>
				<button style={getSelectedStyle('linear')} onClick={stateSetter({ curve: 'linear' })}>
					Linear
				</button>
				<button style={getSelectedStyle('ease-in')} onClick={stateSetter({ curve: 'ease-in' })}>
					Ease-in
				</button>
				<button style={getSelectedStyle('ease-out')} onClick={stateSetter({ curve: 'ease-out' })}>
					Ease-out
				</button>
				<button style={getSelectedStyle('ease-in-out')} onClick={stateSetter({ curve: 'ease-in-out' })}>
					Ease-in-out
				</button>
				<span style={{ marginLeft: 24 }}>Animation duration (ms)</span>
				<input
					value={animationProps.duration}
					type="number"
					onChange={(e) => stateSetter({ duration: Number(e.target.value) })()}
					min={0}
				/>
			</div>
		),
	};
};
