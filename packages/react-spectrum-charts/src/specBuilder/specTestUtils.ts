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
import { Signal } from 'vega';

import {
	HIGHLIGHTED_GROUP,
	HIGHLIGHTED_ITEM,
	HIGHLIGHTED_SERIES,
	SELECTED_GROUP,
	SELECTED_ITEM,
	SELECTED_SERIES,
} from '../constants';
import { getGenericValueSignal } from './signal/signalSpecBuilder';

export const defaultHighlightedItemSignal = getGenericValueSignal(HIGHLIGHTED_ITEM);
export const defaultHighlightedGroupSignal = getGenericValueSignal(HIGHLIGHTED_GROUP);
export const defaultHighlightedSeriesSignal = getGenericValueSignal(HIGHLIGHTED_SERIES);
export const defaultSelectedItemSignal = getGenericValueSignal(SELECTED_ITEM);
export const defaultSelectedSeriesSignal = getGenericValueSignal(SELECTED_SERIES);
export const defaultSelectedGroupSignal = getGenericValueSignal(SELECTED_GROUP);

export const defaultSignals: Signal[] = [
	defaultHighlightedItemSignal,
	defaultHighlightedGroupSignal,
	defaultHighlightedSeriesSignal,
	defaultSelectedItemSignal,
	defaultSelectedSeriesSignal,
	defaultSelectedGroupSignal,
];
