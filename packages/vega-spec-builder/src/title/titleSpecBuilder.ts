/*
 * Copyright 2023 Adobe. All rights reserved.
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

type TitleOptionsWithDefaults = 'fontWeight' | 'position' | 'orient';

const baseDefaults: Required<Pick<TitleOptions, TitleOptionsWithDefaults>> = {
  fontWeight: DEFAULT_TITLE_FONT_WEIGHT,
  position: 'middle',
  orient: 'top',
};

type S2OptionDefaults = 'position';

const s2DefaultOptions: Required<Pick<TitleOptions, S2OptionDefaults>> = {
  position: 'start',
};

export const applyTitleOptionsDefaults = (titleOptions: TitleOptions & { s2?: boolean }): TitleOptions => {
  return {
    ...baseDefaults,
    ...(titleOptions.s2 ? s2DefaultOptions : {}),
    ...titleOptions,
  };
};

export const addTitle = produce<ScSpec, [TitleOptions & { s2?: boolean }]>((spec, titleOptions) => {
  const { text, fontWeight, position, orient } = applyTitleOptionsDefaults(titleOptions);

  spec.title = {
    text,
    fontWeight,
    anchor: position,
    frame: 'group',
    orient,
  };

  return spec;
});
