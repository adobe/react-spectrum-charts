/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { BulletSpecProps, BulletThresholdConfig, ThresholdBackground } from '../../types';

/**
 * Converts a BulletThresholdConfig into an array of detailed ThresholdBackground objects.
 *
 * @param thresholdConfig - The simplified threshold configuration.
 * @returns An array of ThresholdBackground objects.
 * @throws Error if the colors array length does not equal thresholds.length + 1.
 */
export function parseThresholdConfig(thresholdConfig: BulletThresholdConfig): ThresholdBackground[] {
	const { thresholds, colors } = thresholdConfig;

	if (colors.length !== thresholds.length + 1) {
		throw new Error('The number of colors must match the number of thresholds.');
	}

	const thresholdObjects: ThresholdBackground[] = [];
	thresholdObjects.push({
		thresholdMax: thresholds[0],
		fill: colors[0],
	});

	for (let i = 0; i < thresholds.length - 1; i++) {
		thresholdObjects.push({
			thresholdMin: thresholds[i],
			thresholdMax: thresholds[i + 1],
			fill: colors[i + 1],
		});
	}

	thresholdObjects.push({
		thresholdMin: thresholds[thresholds.length - 1],
		fill: colors[colors.length - 1],
	});

	return thresholdObjects;
}

export function getThresholdValues(props: BulletSpecProps): ThresholdBackground[] | undefined {
	let thresholdValues: ThresholdBackground[] | undefined = props.thresholds;
	if (!thresholdValues && props.thresholdConfig) {
		try {
			thresholdValues = parseThresholdConfig(props.thresholdConfig);
		} catch (error) {
			console.error('Error parsing threshold configuration:', error);
		}
	}
	return thresholdValues;
}
