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
import { FADE_FACTOR } from '@spectrum-charts/core-s2/constants';

import { getDeemphasisRamp, getHoverFractionSignal } from '../marks/hoverAnimationUtils';
import { getLineDeemphasisOpacitySignal } from './lineEncodingUtils';

describe('getLineDeemphasisOpacitySignal()', () => {
  test('returns the shared deemphasis-ramp opacity signal for the given mark name', () => {
    const ramp = getDeemphasisRamp(getHoverFractionSignal('line0'));
    expect(getLineDeemphasisOpacitySignal('line0')).toStrictEqual({
      signal: `${FADE_FACTOR} + (1 - ${FADE_FACTOR}) * ${ramp}`,
    });
  });

  test('uses the given mark name in the fraction lookup, not a hardcoded one', () => {
    const ramp = getDeemphasisRamp(getHoverFractionSignal('bar0'));
    expect(getLineDeemphasisOpacitySignal('bar0')).toStrictEqual({
      signal: `${FADE_FACTOR} + (1 - ${FADE_FACTOR}) * ${ramp}`,
    });
  });
});
