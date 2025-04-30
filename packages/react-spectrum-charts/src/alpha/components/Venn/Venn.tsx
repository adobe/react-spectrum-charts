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

/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC } from 'react';

import {
	DEFAULT_LABEL,
	DEFAULT_VENN_COLOR,
	DEFAULT_VENN_METRIC,
	DEFAULT_VENN_STYLES,
} from '@spectrum-charts/constants';

import { VennProps } from '../../../types';

const Venn: FC<VennProps> = ({
	orientation = '0deg',
	metric = DEFAULT_VENN_METRIC,
	style = DEFAULT_VENN_STYLES,
	label = DEFAULT_LABEL,
	color = DEFAULT_VENN_COLOR,

}) => {
	return null;
};

Venn.displayName = 'Venn';

export { Venn };

