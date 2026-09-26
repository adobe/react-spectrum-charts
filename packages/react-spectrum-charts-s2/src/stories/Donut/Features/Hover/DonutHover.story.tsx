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

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../../Chart';
import { ChartInspect, ChartPopover, Legend } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { Donut, SegmentLabel } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';
import { basicDonutData } from '../../../components/Donut/data';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Features/Hover',
  component: SegmentLabel,
};

const defaultChartProps = { data: basicDonutData, width: 400, height: 400 };

// no chartPopover/chartInspect configured - a SegmentLabel showing a value is enough on its own to
// make the donut hover-interactive, matching the Figma reference
const SimpleDirectLabelStory: StoryFn<typeof SegmentLabel> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <SegmentLabel {...args} />
      </Donut>
    </Chart>
  );
};

// hovering an arc highlights the matching Legend entry, and hovering a Legend entry fades/highlights
// the corresponding arc - both directions of the shared legendHighlightSignals mechanism
const WithLegendStory: StoryFn<typeof SegmentLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, width: 500 });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <SegmentLabel {...args} />
        <ChartInspect />
        <ChartPopover width="auto" />
      </Donut>
      <Legend title="Browsers" position="right" highlight isToggleable />
    </Chart>
  );
};

const InspectAndPopoverStory: StoryFn<typeof Donut> = (): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <ChartInspect />
        <ChartPopover width="auto" />
      </Donut>
    </Chart>
  );
};

const totalCount = basicDonutData.reduce((sum, { count }) => sum + count, 0);

const customContent = (datum: Datum): ReactElement => (
  <div>
    <div>{((Number(datum.count) / totalCount) * 100).toFixed(1)}% of all visitors</div>
    <div style={{ color: '#505050' }}>Browser share, May 2025</div>
  </div>
);

// children are rendered below the default swatch, series, and raw value
const CustomContentStory: StoryFn<typeof Donut> = (): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <ChartInspect>{customContent}</ChartInspect>
        <ChartPopover width="auto">{customContent}</ChartPopover>
      </Donut>
    </Chart>
  );
};

const SimpleDirectLabel = bindWithProps(SimpleDirectLabelStory);
SimpleDirectLabel.args = { value: true, valueFormat: 'shortNumber' };

const WithLegend = bindWithProps(WithLegendStory);
WithLegend.args = { value: true, valueFormat: 'shortNumber' };

const InspectAndPopover = bindWithProps(InspectAndPopoverStory);

const CustomContent = bindWithProps(CustomContentStory);

export { CustomContent, InspectAndPopover, SimpleDirectLabel, WithLegend };
