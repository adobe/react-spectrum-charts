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
import { BarOptions } from './barSpec.types';
import { LineOptions } from './lineSpec.types';

export interface ComboOptions {
	markType: 'combo';

	/** Data field that the metrics are trended against (x-axis for horizontal orientation) */
	dimension?: string;
	/** Sets the name of the component. */
	name?: string;

	// children
	marks?: (BarOptions | LineOptions)[];
}
