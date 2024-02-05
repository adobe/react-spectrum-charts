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
import { ADOBE_CLEAN_FONT } from '@themes/spectrumTheme';
import { FontWeight } from 'vega';

interface LabelDatum {
	index: number;
	label: string;
	value: string | number;
}

/**
 * Hides labels that are the same as the previous label
 * @returns
 */
const formatPrimaryTimeLabels = () => {
	let prevLabel: string;
	return (datum: LabelDatum) => {
		const showLabel = datum.index === 0 || prevLabel !== datum.label;
		prevLabel = datum.label;
		return showLabel ? datum.label : '';
	};
};

/**
 * Utility function that will log the value to the console and return it
 * @param value
 * @returns
 */
const consoleLog = (value) => {
	console.log(value);
	return value;
};

/**
 * Figures out the rendered width of text by drawing it on a canvas
 * @param text
 * @param fontWeight
 * @param fontSize
 * @returns width in pixels
 */
const getLabelWidth = (text: string, fontWeight: FontWeight = 'bold', fontSize: number = 12) => {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	if (context === null) return 0;

	context.font = `${fontWeight} ${fontSize}px ${ADOBE_CLEAN_FONT}`;
	return context.measureText(text).width;
};

const truncateText = (text: string, maxWidth: number, fontWeight: FontWeight = 'normal', fontSize: number = 12) => {
	maxWidth = maxWidth - 4;
	const textWidth = getLabelWidth(text, fontWeight, fontSize);
	const elipsisWidth = getLabelWidth('\u2026', fontWeight, fontSize);
	if (textWidth <= maxWidth) return text;

	let truncatedText = text.slice(0, text.length - 1).trim();

	for (let i = truncatedText.length; i > 0; i--) {
		truncatedText = truncatedText.slice(0, truncatedText.length - 1).trim();
		if (getLabelWidth(truncatedText, fontWeight, fontSize) + elipsisWidth <= maxWidth) break;
	}

	if (truncatedText.length === 0) return text;
	return truncatedText + '\u2026';
};

export const expressionFunctions = {
	consoleLog,
	formatPrimaryTimeLabels: formatPrimaryTimeLabels(),
	getLabelWidth,
	truncateText,
};
