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

import { ROUNDED_SQUARE_PATH } from 'svgPaths';
import { ColorScheme } from 'types';
import { BaseLegendLayout, Config, mergeConfig } from 'vega';

import spectrumColors from './spectrumColors.json';
import { divergentOrangeYellowSeafoam15 } from './divergingColorPalette';
import { categorical16 } from './categoricalColorPalette';
import { sequentialViridis16 } from './sequentialColorPalette';
import { DEFAULT_SYMBOL_SIZE, DEFAULT_SYMBOL_STROKE_WIDTH } from '@constants';

export const ADOBE_CLEAN_FONT =
	"adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Trebuchet MS', 'Lucida Grande', sans-serif";
const FONT_SIZE = 14;

export function getPrismConfig(config: Config | undefined, colorScheme: ColorScheme): Config {
	const defaultConfig = getSpectrumVegaConfig(colorScheme);
	if (config) {
		return mergeConfig(defaultConfig, config);
	}
	return defaultConfig;
}

function getSpectrumVegaConfig(colorScheme: ColorScheme): Config {
	const {
		'blue-400': blue400,
		'gray-200': gray200,
		'gray-300': gray300,
		'gray-700': gray700,
		'gray-800': gray800,
		'gray-900': gray900,
	} = spectrumColors[colorScheme];
	const horizontalLegendLayout: BaseLegendLayout = {
		anchor: 'middle',
		direction: 'horizontal',
		center: true,
		offset: 24,
		bounds: 'full',
	};
	const verticalLegendLayout: BaseLegendLayout = {
		anchor: 'middle',
		direction: 'vertical',
		center: false,
		offset: 24,
		bounds: 'full',
	};

	const defaultColor = spectrumColors[colorScheme]['categorical-100'];

	return {
		axis: {
			bandPosition: 0.5,
			domain: false,
			domainWidth: 2,
			domainColor: gray900,
			gridColor: gray200,
			labelFont: ADOBE_CLEAN_FONT,
			labelFontSize: FONT_SIZE,
			labelFontWeight: 'normal',
			labelPadding: 8,
			labelOverlap: true,
			labelSeparation: 20,
			labelColor: gray800,
			ticks: false,
			tickColor: gray300,
			tickRound: true,
			tickSize: 8,
			tickCap: 'round',
			tickWidth: 1,
			titleAnchor: 'middle',
			titleColor: gray800,
			titleFont: ADOBE_CLEAN_FONT,
			titleFontSize: FONT_SIZE,
			titleFontWeight: 'bold',
			titlePadding: 16,
		},
		axisY: {
			labelLimit: 180,
		},
		range: {
			category: categorical16,
			diverging: divergentOrangeYellowSeafoam15,
			ordinal: categorical16,
			ramp: sequentialViridis16,
		},
		background: 'transparent',
		legend: {
			columnPadding: 20,
			labelColor: gray700,
			labelFont: ADOBE_CLEAN_FONT,
			labelFontSize: FONT_SIZE,
			labelFontWeight: 'normal',
			labelLimit: 184,
			layout: {
				bottom: horizontalLegendLayout,
				top: horizontalLegendLayout,
				left: verticalLegendLayout,
				right: verticalLegendLayout,
			},
			rowPadding: 8,
			symbolSize: 250,
			symbolType: ROUNDED_SQUARE_PATH,
			symbolStrokeColor: gray700,
			titleColor: gray800,
			titleFont: ADOBE_CLEAN_FONT,
			titleFontSize: FONT_SIZE,
			titlePadding: 8,
		},
		arc: {
			fill: defaultColor,
		},
		area: {
			fill: defaultColor,
			opacity: 0.8,
		},
		line: {
			strokeWidth: 2,
			stroke: defaultColor,
		},
		path: {
			stroke: defaultColor,
		},
		rect: {
			strokeWidth: 0,
			stroke: blue400,
			fill: defaultColor,
		},
		rule: {
			stroke: gray900,
			strokeWidth: 2,
		},
		shape: {
			stroke: defaultColor,
		},
		symbol: {
			strokeWidth: DEFAULT_SYMBOL_STROKE_WIDTH,
			size: DEFAULT_SYMBOL_SIZE,
			fill: defaultColor,
		},
		text: {
			fill: gray800,
			font: ADOBE_CLEAN_FONT,
			fontSize: FONT_SIZE,
		},
		title: {
			offset: 10,
			font: ADOBE_CLEAN_FONT,
			fontSize: 18,
			color: gray800,
		},
	};
}
