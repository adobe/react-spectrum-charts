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
import { ReactNode } from 'react';

import { Datum } from '@spectrum-charts/vega-spec-builder';

export type ChildElement<T> = T | string | boolean | Iterable<ReactNode>;
export type Children<T> = ChildElement<T> | ChildElement<T>[];
export type OnClickCallback = (datum: Datum) => void;

export interface ClickableChartProps {
	/** Callback that will be run when a point/section is clicked */
	onClick?: OnClickCallback;
}
