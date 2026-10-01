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

import { DEFAULT_METRIC } from '@spectrum-charts/constants';

import { GaugeProps } from '../../../types';

const DEFAULT_GAUGE_COLOR = 'categorical-100';
const DEFAULT_MAX_SCALE_VALUE = 100;
const DEFAULT_METHOD = 'last';
const DEFAULT_MIN_SCALE_VALUE = 0;
const DEFAULT_NUMBER_FORMAT = 'shortNumber';

// arcSize/holeRatio are intentionally absent - they're chart-author-only geometry knobs
// owned by the design system, not end-consumer props. See gauge.types.ts.
// there is also no size prop - typography and needle proportions scale dynamically from the
// chart's actual rendered dimensions (see gaugeSpecBuilder.ts), not from an author-supplied input
// destructure props here and set defaults so that storybook can pick them up
const Gauge: FC<GaugeProps> = ({
  color = DEFAULT_GAUGE_COLOR,
  label,
  maxScaleValue = DEFAULT_MAX_SCALE_VALUE,
  method = DEFAULT_METHOD,
  metric = DEFAULT_METRIC,
  minScaleValue = DEFAULT_MIN_SCALE_VALUE,
  name,
  numberFormat = DEFAULT_NUMBER_FORMAT,
  showNeedle = true,
}) => {
  return null;
};

// displayName is used to validate the component type in the spec builder
Gauge.displayName = 'Gauge';

export { Gauge };
