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
  DEFAULT_BULLET_DIRECTION,
  DEFAULT_LABEL_POSITION,
  DEFAULT_SCALE_TYPE,
  DEFAULT_SCALE_VALUE,
} from '@spectrum-charts/constants';

import { BulletProps } from '../../../types';

const Gauge: FC<BulletProps> = ({
  name = 'gauge0', // Why the zero?
  metric = 'currentAmount', // CurrVal
  dimension = 'graphLabel', // Graph Title ?
  target = 'target', // Yes
  direction = DEFAULT_BULLET_DIRECTION, // Left to right Note to selves: Do this
  numberFormat = '', // ints or floats ??? Help Mr Almighty Wizard ???
  showTarget = true, // Where you want
  showTargetValue = false, // Number of what you want
  labelPosition = DEFAULT_LABEL_POSITION, // Above gauge to label the needle
  scaleType = DEFAULT_SCALE_TYPE, // Need Angle and Tick
  maxScaleValue = DEFAULT_SCALE_VALUE, // Max Arc Value
  thresholdBarColor = false, // filler color
  // Things to add:
    // ticksNumber
    // clamping
    // needle (on or off, sizing of it)
    // arcMinVal and arcMaxVal
    // size of tick lines
    // needle length
    // arc thickness
    // label ticks? Enable and disable?
}) => {
  return null;
};

// displayName is used to validate the component type in the spec builder
Gauge.displayName = 'Gauge';

export { Gauge };
