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
  DEFAULT_GAUGE_DIRECTION,
  DEFAULT_LABEL_POSITION,
  DEFAULT_SCALE_TYPE,
  DEFAULT_SCALE_VALUE,
} from '@spectrum-charts/constants';

import { GaugeProps } from '../../../types';

const Gauge: FC<GaugeProps> = ({
  name = 'bullet0',
  metric = 'currentAmount',
  dimension = 'graphLabel',
  target = 'target',
  direction = DEFAULT_GAUGE_DIRECTION,
  numberFormat = '',
  showTarget = true,
  showTargetValue = false,
  labelPosition = DEFAULT_LABEL_POSITION,
  scaleType = DEFAULT_SCALE_TYPE,
  maxScaleValue = DEFAULT_SCALE_VALUE,
  thresholdBarColor = false,
}) => {
  return null;
};

// displayName is used to validate the component type in the spec builder
Gauge.displayName = 'Gauge';

export { Gauge };
