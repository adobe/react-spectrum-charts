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

import { DEFAULT_SANKEY_COLOR, DEFAULT_SANKEY_SOURCE, DEFAULT_SANKEY_TARGET, DEFAULT_SANKEY_VALUE } from '@spectrum-charts/constants';

import { SankeyProps } from '../../../types';

// destructure props here and set defaults so that storybook can pick them up
const Sankey: FC<SankeyProps> = ({
  children,
  color = DEFAULT_SANKEY_COLOR,
  name,
  source = DEFAULT_SANKEY_SOURCE,
  target = DEFAULT_SANKEY_TARGET,
  value = DEFAULT_SANKEY_VALUE,
}) => {
  return null;
};

// displayName is used to validate the component type in the spec builder
Sankey.displayName = 'Sankey';

export { Sankey };
