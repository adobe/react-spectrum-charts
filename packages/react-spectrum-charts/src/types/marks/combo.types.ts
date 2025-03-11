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

import { ComboOptions } from '@spectrum-charts/vega-spec-builder';

import { Children } from '../util.types';
import { BarElement } from './bar.types';
import { LineElement } from './line.types';

export type ComboChildElement = BarElement | LineElement;

export interface ComboProps extends Omit<ComboOptions, 'marks' | 'markType'> {
	children?: Children<ComboChildElement>;
}

export type ComboElement = ReactElement<ComboProps, JSXElementConstructor<ComboProps>>;
