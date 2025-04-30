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
import { spectrumColors } from './spectrumColors';

/**
 * gets the css color string from a spectrum color or a css color string
 * @param color
 * @param colorScheme
 * @returns css color string
 */
export const getColorValue = (color: string, colorScheme: 'light' | 'dark'): string => {
	return spectrumColors[colorScheme][color] || color;
};
