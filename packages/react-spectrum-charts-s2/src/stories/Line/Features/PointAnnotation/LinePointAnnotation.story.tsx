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

import { Chart } from '../../../../Chart';
import { Axis, Legend, Line, LinePointAnnotation } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { bindWithProps } from '../../../../test-utils';
import { visitsByChannelData } from '../../lineData';
import { setControls } from '../../lineStoryUtils';

export default {
  title: 'React Spectrum Charts 2/Line/Features/Point Annotation',
  component: LinePointAnnotation,
};

// Annotations label the static points, which mark marketing events.
const PointAnnotationStory: StoryFn<typeof LinePointAnnotation> = (args): ReactElement => {
  const chartProps = useChartProps({ data: visitsByChannelData, minWidth: 400, maxWidth: 800, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Visits" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="visits" color="channel" staticPoint="hasEvent">
        <LinePointAnnotation {...args} />
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const Basic = bindWithProps(PointAnnotationStory);
Basic.args = { textKey: 'event' };
setControls(Basic, ['textKey']);

const Anchor = bindWithProps(PointAnnotationStory);
Anchor.args = { textKey: 'event', anchor: 'bottom' };
setControls(Anchor, ['anchor']);

const MatchLineColor = bindWithProps(PointAnnotationStory);
MatchLineColor.args = { textKey: 'event', matchLineColor: true };
setControls(MatchLineColor, ['matchLineColor']);

export { Basic, Anchor, MatchLineColor };
