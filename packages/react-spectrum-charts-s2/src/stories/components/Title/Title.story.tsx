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
import { Axis, Bar, Legend, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { downloadsByBrowserData } from '../Axis/axisStoryData';

export default {
  title: 'React Spectrum Charts 2/Title/Features',
  component: Title,
  argTypes: {
    position: { control: 'inline-radio', options: ['start', 'middle', 'end'] },
    orient: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
    fontWeight: { control: 'inline-radio', options: ['normal', 'bold', 'lighter'] },
    fontSize: { control: { type: 'range', min: 12, max: 32, step: 2 } },
  },
};

const controls = (...include: string[]) => ({ parameters: { controls: { include } } });

const TitleStory: StoryFn<typeof Title> = (args): ReactElement => {
  const chartProps = useChartProps({ data: downloadsByBrowserData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title {...args} />
      <Axis position="left" grid title="Downloads" numberFormat="shortNumber" />
      <Axis position="bottom" baseline title="Browser" />
      <Bar dimension="browser" metric="downloads" color="os" />
      <Legend />
    </Chart>
  );
};

const text = 'Downloads by browser and operating system';

const Basic = bindWithProps(TitleStory);
Basic.args = { text };
Object.assign(Basic, controls('text'));

const Position = bindWithProps(TitleStory);
Position.args = { text, position: 'middle' };
Object.assign(Position, controls('position'));

const Orient = bindWithProps(TitleStory);
Orient.args = { text, orient: 'bottom' };
Object.assign(Orient, controls('orient'));

const FontWeight = bindWithProps(TitleStory);
FontWeight.args = { text, fontWeight: 'normal' };
Object.assign(FontWeight, controls('fontWeight'));

const FontSize = bindWithProps(TitleStory);
FontSize.args = { text, fontSize: 16 };
Object.assign(FontSize, controls('fontSize'));

export { Basic, Position, Orient, FontWeight, FontSize };
