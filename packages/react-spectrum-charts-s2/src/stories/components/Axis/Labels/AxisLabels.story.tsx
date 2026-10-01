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
import { Axis } from '../../../../components';
import { bindWithProps } from '../../../../test-utils';
import {
  BrowserBarStory,
  CampaignBarStory,
  GranularityStory,
  HorizontalCampaignBarStory,
  LabelFormatStory,
  RevenueStory,
  SessionsStory,
  TimeAxisStory,
  WideBrowserBarStory,
  controls,
} from '../axisStoryTemplates';

export default {
  title: 'React Spectrum Charts 2/Axis/Features/Labels',
  component: Axis,
  argTypes: {
    granularity: {
      control: 'select',
      options: ['second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'],
    },
    labelAlign: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    labelFontWeight: { control: 'inline-radio', options: ['normal', 'bold', 'lighter'] },
    labelFormat: { control: 'inline-radio', options: ['linear', 'percentage', 'duration', 'time'] },
    labelOrientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    numberFormat: {
      control: 'text',
      description:
        "Preset ('currency', 'shortCurrency', 'shortNumber', 'standardNumber') or a d3 format string (e.g. '$,.2f', '.3s').",
    },
  },
};

const MONTH = (month: number) => new Date(2025, month, 1).getTime();

const LabelFormat = bindWithProps(LabelFormatStory);
LabelFormat.args = { position: 'bottom', baseline: true, labelFormat: 'percentage' };
Object.assign(LabelFormat, controls('labelFormat'), { storyName: 'Label Format (X Axis)' });

const NumberFormat = bindWithProps(RevenueStory);
NumberFormat.args = { position: 'left', grid: true, title: 'Revenue', numberFormat: 'shortCurrency' };
Object.assign(NumberFormat, controls('numberFormat'));

const Granularity = bindWithProps(GranularityStory);
Granularity.args = { position: 'bottom', baseline: true, ticks: true, labelFormat: 'time', granularity: 'week' };
Object.assign(Granularity, controls('granularity'));

const Labels = bindWithProps(TimeAxisStory);
Labels.args = {
  position: 'bottom',
  baseline: true,
  ticks: true,
  labels: [
    { value: MONTH(0), label: 'Q1 FY25', align: 'start' },
    { value: MONTH(3), label: 'Q2 FY25', align: 'start' },
    { value: MONTH(6), label: 'Q3 FY25', align: 'start' },
    { value: MONTH(9), label: 'Q4 FY25', align: 'start' },
  ],
};
Object.assign(Labels, controls('labels'));

// Grid lines stay, but the Y axis value labels are hidden to focus on the trend.
const HideDefaultLabels = bindWithProps(SessionsStory);
HideDefaultLabels.args = { position: 'left', grid: true, title: 'Sessions', hideDefaultLabels: true };
Object.assign(HideDefaultLabels, controls('hideDefaultLabels'), { storyName: 'Hide Default Labels (Y Axis)' });

const SubLabels = bindWithProps(WideBrowserBarStory);
SubLabels.args = {
  position: 'bottom',
  baseline: true,
  title: 'Browser',
  subLabels: [
    { value: 'Chrome', subLabel: '48% share' },
    { value: 'Safari', subLabel: '19% share' },
    { value: 'Edge', subLabel: '16% share' },
  ],
};
Object.assign(SubLabels, controls('subLabels'));

// Few, wide bars make the label shift between start, center and end easy to see.
const LabelAlign = bindWithProps(WideBrowserBarStory);
LabelAlign.args = { position: 'bottom', baseline: true, title: 'Browser', labelAlign: 'start' };
Object.assign(LabelAlign, controls('labelAlign'));

const LabelFontWeight = bindWithProps(BrowserBarStory);
LabelFontWeight.args = { position: 'bottom', baseline: true, title: 'Browser', labelFontWeight: 'bold' };
Object.assign(LabelFontWeight, controls('labelFontWeight'));

const LabelOrientation = bindWithProps(CampaignBarStory);
LabelOrientation.args = { position: 'bottom', baseline: true, labelOrientation: 'vertical' };
Object.assign(LabelOrientation, controls('labelOrientation'));

const LabelLimit = bindWithProps(HorizontalCampaignBarStory);
LabelLimit.args = { position: 'left', title: 'Campaign', labelLimit: 120 };
Object.assign(LabelLimit, controls('labelLimit'));

// truncateLabels only applies to category (band) axes with labels parallel to the axis, i.e. bar charts.
const TruncateLabels = bindWithProps(CampaignBarStory);
TruncateLabels.args = { position: 'bottom', baseline: true, title: 'Campaign', truncateLabels: true };
Object.assign(TruncateLabels, controls('truncateLabels'));

export {
  LabelFormat,
  NumberFormat,
  Granularity,
  Labels,
  HideDefaultLabels,
  SubLabels,
  LabelAlign,
  LabelFontWeight,
  LabelOrientation,
  LabelLimit,
  TruncateLabels,
};
