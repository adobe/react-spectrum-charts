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
import { JSXElementConstructor, ReactElement } from 'react';

import { Children } from '../util.types';
import { BarElement, BarOptions } from './bar.types';
import { LineElement, LineOptions } from './line.types';

export interface ComboOptions {
	markType: 'combo';

	/** Data field that the metrics are trended against (x-axis for horizontal orientation) */
	dimension?: string;
	/** Sets the name of the component. */
	name?: string;

	// children
	marks?: (BarOptions | LineOptions)[];
}

export type ComboChildElement = BarElement | LineElement;

export interface ComboProps extends Omit<ComboOptions, 'markType'> {
	children?: Children<ComboChildElement>;
}

export type ComboElement = ReactElement<ComboProps, JSXElementConstructor<ComboProps>>;
