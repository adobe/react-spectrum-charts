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

import { Chart } from '../../Chart.js';
import { Axis, ChartInspect, Legend, Title } from '../../components/index.js';
import useChartProps from '../../hooks/useChartProps.js';
import { Histogram } from '../../lab/index.js';
import {
  customerAgeBands,
  customerAgeData,
  deliveryData,
  examScoreData,
  homeSaleData,
  orderData,
  residentAgeData,
  responseTimeData,
  salaryData,
  sessionData,
} from '../../storyShared/Histogram/data.js';
import { bindWithProps } from '../../test-utils/index.js';
import { HistogramProps } from '../../types/index.js';

export default {
  title: 'React Spectrum Charts 2/Lab/Histogram/Examples',
  tags: ['lab'],
  component: Histogram,
};

const formatPercent = (value: unknown): string => `${Math.round(Number(value) * 100)}%`;
const formatThousands = (value: unknown): string => `${Math.round(Number(value) / 1000)}k`;
const formatDollars = (value: unknown): string => `$${Number(value).toLocaleString('en-US')}`;
const plural = (count: unknown, noun: string): string => `${count} ${noun}${Number(count) === 1 ? '' : 's'}`;

const latencyContent = (datum: Datum) => (
  <div>
    <div>{String(datum.region)}</div>
    <div>
      {datum.binStart}–{datum.binEnd} ms: {datum.count} requests
    </div>
  </div>
);

const ageContent = (datum: Datum) => (
  <div>
    Ages {datum.binStart}–{Number(datum.binEnd) - 1}: {formatPercent(datum.percent)} of customers
  </div>
);

const salaryContent = (datum: Datum) => (
  <div>
    <div>{String(datum.department)}</div>
    <div>
      {formatThousands(datum.binStart)}–{formatThousands(datum.binEnd)}: {plural(datum.count, 'employee')}
    </div>
  </div>
);

const orderContent = (datum: Datum) => (
  <div>
    <div>
      {formatDollars(datum.binStart)}–{formatDollars(datum.binEnd)} orders
    </div>
    <div>
      {plural(datum.sum, 'unit')} across {plural(datum.count, 'order')}
    </div>
  </div>
);

const deliveryContent = (datum: Datum) => (
  <div>
    Within {datum.binEnd} days: {formatPercent(datum.cumulativePercent)} of orders
  </div>
);

const examContent = (datum: Datum) => (
  <div>
    Scores {datum.binStart}–{Number(datum.binEnd) - 1}: {plural(datum.count, 'student')}
  </div>
);

const residentContent = (datum: Datum) => (
  <div>
    <div>{String(datum.sex)}</div>
    <div>
      Ages {datum.binStart}–{Number(datum.binEnd) - 1}: {plural(datum.count, 'resident')}
    </div>
  </div>
);

const sessionContent = (datum: Datum) => (
  <div>
    <div>
      {datum.binStart}–{datum.binEnd} minutes, {datum.yBinStart}–{Number(datum.yBinEnd) - 1} pages
    </div>
    <div>{plural(datum.count, 'session')}</div>
  </div>
);

const homeContent = (datum: Datum) => (
  <div>
    <div>
      {Number(datum.binStart).toLocaleString('en-US')}–{Number(datum.binEnd).toLocaleString('en-US')} sq ft
    </div>
    <div>
      ${formatThousands(datum.yBinStart)}–${formatThousands(datum.yBinEnd)}: {plural(datum.count, 'sale')}
    </div>
  </div>
);

const ApiLatencyStory: StoryFn<HistogramProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: responseTimeData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="API response time by region" />
      <Axis position="bottom" baseline ticks title="Response time (ms)" />
      <Axis position="left" grid title="Requests" />
      <Histogram {...args}>
        <ChartInspect>{latencyContent}</ChartInspect>
      </Histogram>
      <Legend position="bottom" />
    </Chart>
  );
};

const CustomerAgesStory: StoryFn<HistogramProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: customerAgeData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Customers by age band" />
      <Axis position="bottom" baseline ticks title="Age" />
      <Axis position="left" grid labelFormat="percentage" title="Share of customers" />
      <Histogram {...args}>
        <ChartInspect>{ageContent}</ChartInspect>
      </Histogram>
    </Chart>
  );
};

const SalariesStory: StoryFn<HistogramProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: salaryData, width: 720, height: 420 });
  return (
    <Chart {...chartProps}>
      <Title text="Base salary by department" />
      <Axis position="bottom" baseline ticks numberFormat="shortCurrency" title="Annual base salary" />
      <Axis position="left" grid title="Employees" />
      <Histogram {...args}>
        <ChartInspect>{salaryContent}</ChartInspect>
      </Histogram>
      <Legend position="bottom" />
    </Chart>
  );
};

const OrderUnitsStory: StoryFn<HistogramProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: orderData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Units sold by order value" />
      <Axis position="bottom" baseline ticks numberFormat="$,.0f" title="Order value" />
      <Axis position="left" grid title="Units sold" />
      <Histogram {...args}>
        <ChartInspect>{orderContent}</ChartInspect>
      </Histogram>
    </Chart>
  );
};

const DeliveryTimeStory: StoryFn<HistogramProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: deliveryData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Share of orders delivered by day" />
      <Axis position="bottom" baseline ticks title="Days from order to delivery" />
      <Axis position="left" grid title="Orders delivered" />
      <Histogram {...args}>
        <ChartInspect>{deliveryContent}</ChartInspect>
      </Histogram>
    </Chart>
  );
};

const ExamScoresStory: StoryFn<HistogramProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: examScoreData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Final exam scores" />
      <Axis position="bottom" baseline ticks title="Score" />
      <Axis position="left" grid title="Students" tickMinStep={1} />
      <Histogram {...args}>
        <ChartInspect>{examContent}</ChartInspect>
      </Histogram>
    </Chart>
  );
};

const ResidentAgesStory: StoryFn<HistogramProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: residentAgeData, width: 640, height: 520 });
  return (
    <Chart {...chartProps}>
      <Title text="Town population by age" />
      <Axis position="bottom" baseline grid title="Residents" />
      <Axis position="left" ticks title="Age" />
      <Histogram {...args}>
        <ChartInspect>{residentContent}</ChartInspect>
      </Histogram>
      <Legend position="bottom" />
    </Chart>
  );
};

const SessionEngagementStory: StoryFn<HistogramProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: sessionData, width: 680, height: 440 });
  return (
    <Chart {...chartProps}>
      <Title text="Session length and pages viewed" />
      <Axis position="bottom" baseline ticks title="Session length (minutes)" />
      <Axis position="left" ticks title="Pages viewed" />
      <Histogram {...args}>
        <ChartInspect>{sessionContent}</ChartInspect>
      </Histogram>
    </Chart>
  );
};

const HomePricesStory: StoryFn<HistogramProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: homeSaleData, width: 680, height: 440 });
  return (
    <Chart {...chartProps}>
      <Title text="Home sales by size and price" />
      <Axis position="bottom" baseline ticks numberFormat=",.0f" title="Living area (sq ft)" />
      <Axis position="left" ticks numberFormat="shortCurrency" title="Sale price" />
      <Histogram {...args}>
        <ChartInspect>{homeContent}</ChartInspect>
      </Histogram>
    </Chart>
  );
};

const ApiLatency = bindWithProps(ApiLatencyStory);
ApiLatency.args = { metric: 'responseTime', color: 'region', binSize: 50, extent: [0, 1000] };
Object.assign(ApiLatency, { parameters: { controls: { include: [] } } });

const CustomerAges = bindWithProps(CustomerAgesStory);
CustomerAges.args = { metric: 'age', binEdges: customerAgeBands, yValue: 'percent' };
Object.assign(CustomerAges, { parameters: { controls: { include: [] } } });

const Salaries = bindWithProps(SalariesStory);
Salaries.args = {
  metric: 'salary',
  color: 'department',
  layout: 'dodged',
  binSize: 10000,
  binAnchor: 0,
  densityCurve: true,
};
Object.assign(Salaries, {
  parameters: { controls: { include: ['layout'] } },
  argTypes: { layout: { control: 'inline-radio', options: ['dodged', 'overlaid', 'stacked'] } },
});

const OrderUnits = bindWithProps(OrderUnitsStory);
OrderUnits.args = { metric: 'orderValue', weight: 'quantity', binSize: 25, binAnchor: 0 };
Object.assign(OrderUnits, { parameters: { controls: { include: [] } } });

const DeliveryTime = bindWithProps(DeliveryTimeStory);
DeliveryTime.args = {
  metric: 'deliveryDays',
  binSize: 1,
  binAnchor: 0,
  yValue: 'percent',
  cumulative: true,
  densityCurve: true,
  color: { value: 'seafoam-600' },
};
Object.assign(DeliveryTime, { parameters: { controls: { include: [] } } });

const ExamScores = bindWithProps(ExamScoresStory);
ExamScores.args = { metric: 'score', binSize: 10, binAnchor: 0, densityCurve: true, drawInEffect: 'sweep' };
Object.assign(ExamScores, { parameters: { controls: { include: [] } } });

const ResidentAges = bindWithProps(ResidentAgesStory);
ResidentAges.args = {
  metric: 'age',
  orientation: 'horizontal',
  color: 'sex',
  layout: 'dodged',
  binSize: 10,
  binAnchor: 0,
};
Object.assign(ResidentAges, { parameters: { controls: { include: [] } } });

const SessionEngagement = bindWithProps(SessionEngagementStory);
SessionEngagement.args = {
  metric: 'sessionMinutes',
  yMetric: 'pagesViewed',
  binSize: 2,
  yBinSize: 2,
  binAnchor: 0,
  cellColors: 'sequentialViridis9',
  cellLegendTitle: 'Sessions',
};
Object.assign(SessionEngagement, {
  parameters: { controls: { include: ['cellColors'] } },
  argTypes: {
    cellColors: {
      control: 'select',
      options: [
        'sequentialCerulean9',
        'sequentialMagma9',
        'sequentialViridis9',
        'sequentialForest9',
        'sequentialRose9',
      ],
    },
  },
});

const HomePrices = bindWithProps(HomePricesStory);
HomePrices.args = {
  metric: 'squareFeet',
  yMetric: 'price',
  binSize: 250,
  yBinSize: 50000,
  cellColors: 'sequentialMagma9',
  cellLegendTitle: 'Homes sold',
};
Object.assign(HomePrices, { parameters: { controls: { include: [] } } });

export {
  ApiLatency,
  Salaries,
  OrderUnits,
  DeliveryTime,
  ExamScores,
  CustomerAges,
  ResidentAges,
  SessionEngagement,
  HomePrices,
};
