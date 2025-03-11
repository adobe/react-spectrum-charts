import { BulletThresholdConfig } from 'types';

import { ThresholdBackground } from '../../types';

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
