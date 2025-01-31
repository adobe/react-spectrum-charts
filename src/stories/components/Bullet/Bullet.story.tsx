import React, { ReactElement } from 'react';
import { Annotation } from '@components/Annotation';
import useChartProps from '@hooks/useChartProps';
import { Axis, Chart } from '@rsc';
import { StoryFn } from '@storybook/react';
import { Bullet } from '@rsc/alpha';
import { BulletProps } from '../../../types';

const bulletData = [
  {
    title: 'New Customer Count',
    ranges: [500],
    measures: [350],
    target: 300,
  },
];

export default {
  title: 'RSC/Bullet',
  component: Bullet,
};

const BulletStory: StoryFn<typeof Bullet> = (args): ReactElement => {
  return (
    <Chart data={bulletData} width={600} height={100} debug>
      <Axis position='left' baseline title="Value`" />
      <Bullet {...args} />
    </Chart>
  );
};

// Default props for the Bullet component
const defaultProps: BulletProps = {
  ranges: bulletData[0].ranges,
  measures: bulletData[0].measures,
  target: bulletData[0].target,
  measureColor: 'steelblue',
  rangeColor: 'lightgray',
  targetColor: 'black',
  orientation: 'horizontal',
  label: bulletData[0].title,
};

export const BulletChart = BulletStory.bind({});
BulletChart.args = {
  ...defaultProps,
};

const Basic = BulletStory.bind({});
Basic.args = {
  ...defaultProps,
};

const Horizontal = BulletStory.bind({});
Horizontal.args = {
  ...defaultProps,
  orientation: 'horizontal',
};

const Vertical = BulletStory.bind({});
Vertical.args = {
  ...defaultProps,
  orientation: 'vertical',
};

const CustomColors = BulletStory.bind({});
CustomColors.args = {
  ...defaultProps,
  measureColor: 'blue',
  rangeColor: 'pink',
  targetColor: 'red',
};

export { Basic, Horizontal, Vertical, CustomColors };

