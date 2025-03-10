import { BulletThresholdConfig } from 'types';

import { BulletSpecProps } from '../../types';

interface ThresholdObject {
	thresholdMin?: number;
	thresholdMax?: number;
	fill?: string;
}

function parseThresholdConfig(thresholdConfig: BulletThresholdConfig) {
	const { thresholds, colors } = thresholdConfig;

	if (colors.length !== thresholds.length + 1) {
		throw new Error('The number of colors must match the number of thresholds.');
	}

	const thresholdObjects: ThresholdObject[] = [];
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
