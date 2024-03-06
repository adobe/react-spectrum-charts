/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { HIGHLIGHTED_ITEM, HIGHLIGHTED_SERIES, SELECTED_ITEM, SELECTED_SERIES } from '@constants';
import { Signal } from 'vega';

import { getGenericSignal } from './signal/signalSpecBuilder';

export const defaultHighlightedItemSignal = getGenericSignal(HIGHLIGHTED_ITEM);
export const defaultHighlightedSeriesSignal = getGenericSignal(HIGHLIGHTED_SERIES);
export const defaultSelectedItemSignal = getGenericSignal(SELECTED_ITEM);
export const defaultSelectedSeriesSignal = getGenericSignal(SELECTED_SERIES);

export const defaultSignals: Signal[] = [
	defaultHighlightedItemSignal,
	defaultHighlightedSeriesSignal,
	defaultSelectedItemSignal,
	defaultSelectedSeriesSignal,
];
