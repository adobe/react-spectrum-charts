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
import { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { Combo } from '../../../alpha';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';
import { peopleAdoptionComboData } from '../../data/data';
import { getPeopleAdoptionComboMarks } from '../../components/Combo/Combo.story';

export default {
  title: 'RSC/Chart/S2/Combo',
  component: Combo,
};

const defaultChartProps: ChartProps = {
  data: peopleAdoptionComboData,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
  s2: true,
};

const S2ComboStory: StoryFn<typeof Combo> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return <Chart {...chartProps}>{getPeopleAdoptionComboMarks(args, { value: 'categorical-200' })}</Chart>;
};

const S2Combo = bindWithProps(S2ComboStory);
S2Combo.args = {
  name: 'combo0',
  dimension: 'datetime',
};

export { S2Combo };
