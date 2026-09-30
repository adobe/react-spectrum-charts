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
/* eslint-disable react/prop-types */
import { ReactElement, useState } from 'react';

import { StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import { Chart } from '../../../Chart';
import { Axis, ChartPopover, Legend, Line, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { LegendProps } from '../../../types';
import { playgroundTimeSeriesData } from '../../playgroundData';
import { category, chartArgTypes, popoverArgTypes, renderPopoverContent } from '../../playgroundUtils';

interface LegendPlaygroundArgs extends LegendProps {
  chartTitle?: string;
  height: number;
  maxWidth: number;
  colorScheme?: 'light' | 'dark';
  backgroundColor?: string;
  showAxes: boolean;
  showPopover: boolean;
  popoverWidth: number;
  popoverRightClick: boolean;
  popoverHighlightBy: 'item' | 'series' | 'dimension';
  controlledHiddenSeries: boolean;
  hideCreate: boolean;
  hideReview: boolean;
  hidePublish: boolean;
  showDescriptions: boolean;
}

export default {
  title: 'React Spectrum Charts 2/Legend/Playground',
  component: Legend,
  argTypes: {
    ...chartArgTypes,
    ...popoverArgTypes,
    ...category('Legend', ['align', 'color', 'defaultHiddenSeries', 'descriptions', 'hiddenEntries', 'highlight', 'isToggleable', 'keys', 'legendLabels', 'labelLimit', 'lineType', 'lineWidth', 'name', 'opacity', 'position', 'symbolShape', 'title', 'titleLimit']),
    align: { control: 'select', options: [undefined, 'start', 'middle', 'end'], table: { category: 'Legend' } },
    position: { control: 'select', options: ['top', 'bottom', 'left', 'right'], table: { category: 'Legend' } },
    labelLimit: { control: { type: 'range', min: 40, max: 240, step: 5 }, table: { category: 'Legend' } },
    titleLimit: { control: { type: 'range', min: 40, max: 240, step: 5 }, table: { category: 'Legend' } },
    showAxes: { control: 'boolean', table: { category: 'Chart' } },
    controlledHiddenSeries: { control: 'boolean', table: { category: 'Controlled hidden series' } },
    hideCreate: { control: 'boolean', table: { category: 'Controlled hidden series' } },
    hideReview: { control: 'boolean', table: { category: 'Controlled hidden series' } },
    hidePublish: { control: 'boolean', table: { category: 'Controlled hidden series' } },
    showDescriptions: { control: 'boolean', table: { category: 'Legend descriptions' } },
  },
};

const LegendPlaygroundStory: StoryFn<LegendPlaygroundArgs> = ({
  chartTitle,
  height,
  maxWidth,
  colorScheme,
  backgroundColor,
  showAxes,
  showPopover,
  popoverWidth,
  popoverRightClick,
  popoverHighlightBy,
  controlledHiddenSeries,
  hideCreate,
  hideReview,
  hidePublish,
  showDescriptions,
  ...legendProps
}): ReactElement => {
  const [clickedHiddenSeries, setClickedHiddenSeries] = useState<string[]>([]);
  const chartProps = useChartProps({ data: playgroundTimeSeriesData, height, maxWidth });
  const argHiddenSeries = [
    ...(hideCreate ? ['Create'] : []),
    ...(hideReview ? ['Review'] : []),
    ...(hidePublish ? ['Publish'] : []),
  ];
  const controlledHidden = [...new Set([...argHiddenSeries, ...clickedHiddenSeries])];
  const hiddenSeries = controlledHiddenSeries && controlledHidden.length > 0 ? controlledHidden : undefined;
  const descriptions = showDescriptions
    ? [
        { seriesName: 'Create', title: 'Create', description: 'Documents created in the selected period.' },
        { seriesName: 'Review', title: 'Review', description: 'Review activity in the selected period.' },
        { seriesName: 'Publish', title: 'Publish', description: 'Published documents in the selected period.' },
      ]
    : undefined;
  const handleLegendClick = (seriesName: string): void => {
    action('Legend:onClick')(seriesName);
    if (!controlledHiddenSeries) return;
    setClickedHiddenSeries((current) =>
      current.includes(seriesName) ? current.filter((series) => series !== seriesName) : [...current, seriesName]
    );
  };

  return (
    <Chart {...chartProps} colorScheme={colorScheme} backgroundColor={backgroundColor} hiddenSeries={hiddenSeries}>
      {chartTitle ? <Title text={chartTitle} /> : undefined}
      {showAxes ? <Axis position="bottom" labelFormat="time" /> : undefined}
      {showAxes ? <Axis position="left" grid /> : undefined}
      <Line dimension="datetime" metric="value" color="series" scaleType="time" />
      <Legend
        {...legendProps}
        descriptions={descriptions}
        onClick={handleLegendClick}
        onMouseOut={action('Legend:onMouseOut')}
        onMouseOver={action('Legend:onMouseOver')}
      >
        {showPopover ? (
          <ChartPopover
            width={popoverWidth}
            rightClick={popoverRightClick}
            UNSAFE_highlightBy={popoverHighlightBy}
            onOpenChange={action('Legend ChartPopover:onOpenChange')}
          >
            {renderPopoverContent(['series', 'value'])}
          </ChartPopover>
        ) : undefined}
      </Legend>
    </Chart>
  );
};

export const Playground = bindWithProps(LegendPlaygroundStory);
Playground.args = {
  chartTitle: 'Legend controls and popover',
  height: 400,
  maxWidth: 760,
  showAxes: true,
  showPopover: true,
  popoverWidth: 240,
  popoverRightClick: true,
  popoverHighlightBy: 'series',
  controlledHiddenSeries: true,
  hideCreate: false,
  hideReview: false,
  hidePublish: true,
  showDescriptions: true,
  align: 'start',
  color: 'series',
  defaultHiddenSeries: [],
  descriptions: [],
  hiddenEntries: [],
  highlight: true,
  isToggleable: true,
  keys: undefined,
  legendLabels: [{ seriesName: 'Create', label: 'Create workflow', maxLength: 24 }],
  labelLimit: 160,
  lineType: undefined,
  lineWidth: undefined,
  name: 'legend0',
  opacity: undefined,
  position: 'bottom',
  symbolShape: undefined,
  title: 'Workflow',
  titleLimit: 160,
} satisfies LegendPlaygroundArgs;
