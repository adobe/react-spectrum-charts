/*
 * Copyright 2026 Adobe. All rights reserved.
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
  DEFAULT_GRANULARITY,
  DEFAULT_LABEL_ALIGN,
  DEFAULT_LABEL_FONT_WEIGHT,
  DEFAULT_LABEL_ORIENTATION,
} from '@spectrum-charts/constants';

import { AxisProps } from '../../types';

const Axis: FC<AxisProps> = ({
  position,
  baseline = false,
  baselineOffset = 0,
  granularity = DEFAULT_GRANULARITY,
  grid = false,
  hideDefaultLabels = false,
  labelAlign = DEFAULT_LABEL_ALIGN,
  labelFontWeight = DEFAULT_LABEL_FONT_WEIGHT,
  labelFormat,
  labelLimit,
  labelOrientation = DEFAULT_LABEL_ORIENTATION,
  labels,
  numberFormat = 'shortNumber',
  range = undefined,
  subLabels,
  ticks = false,
  tickCountLimit = undefined,
  tickCountMinimum = undefined,
  tickMinStep = undefined,
  title = undefined,
}) => {
  return null;
};

// displayName is used to validate the component type in the spec builder
Axis.displayName = 'Axis';

export { Axis };
