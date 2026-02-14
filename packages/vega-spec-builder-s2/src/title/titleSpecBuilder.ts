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
import { produce } from 'immer';

import { DEFAULT_TITLE_FONT_WEIGHT } from '@spectrum-charts/constants';

import { ScSpec, TitleOptions } from '../types';

type TitleOptionsWithDefaults = 'fontWeight' | 'fontSize' | 'position' | 'orient';

const baseDefaults: Required<Pick<TitleOptions, TitleOptionsWithDefaults>> = {
  fontWeight: DEFAULT_TITLE_FONT_WEIGHT,
  fontSize: 18,
  position: 'middle',
  orient: 'top',
};

type S2OptionDefaults = 'fontWeight' | 'fontSize' | 'position';

const s2DefaultOptions: Required<Pick<TitleOptions, S2OptionDefaults>> = {
  fontWeight: 700,
  fontSize: 24,
  position: 'start',
};

export const applyTitleOptionsDefaults = (titleOptions: TitleOptions): TitleOptions => {
  return {
    ...baseDefaults,
    ...s2DefaultOptions, // Always apply S2 options in vega-spec-builder-s2
    ...titleOptions,
  };
};

export const addTitle = produce<ScSpec, [TitleOptions]>((spec, titleOptions) => {
  const { text, fontWeight, fontSize, position, orient } = applyTitleOptionsDefaults(titleOptions);

  spec.title = {
    text,
    fontWeight,
    fontSize,
    anchor: position,
    frame: 'group',
    orient,
  };

  return spec;
});
