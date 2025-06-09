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
import { ReactElement, useRef, useState } from 'react';

import { action } from '@storybook/addon-actions';
import { StoryFn } from '@storybook/react';

import { ActionButton, Content, Flex } from '@adobe/react-spectrum';
import { ChartHandle } from '@spectrum-charts/vega-spec-builder';

import { Chart } from '../Chart';
import { Axis, Line } from '../components';
import useChartProps from '../hooks/useChartProps';
import { bindWithProps } from '../test-utils';
import './Chart.story.css';
import { data } from './data/data';

export default {
  title: 'RSC/Chart/Handles',
  component: Chart,
};

const HandleStory = ({ variant }: { variant: 'copy' | 'download' | 'getBase64Png' | 'getSvg' }) => {
  const [loading, setLoading] = useState(false);
  const ref = useRef<ChartHandle>(null);
  const props = useChartProps({ data });

  const buttonText: Record<typeof variant, string> = {
    copy: 'Copy to clipboard',
    download: 'Download PNG',
    getBase64Png: 'Get base64 PNG',
    getSvg: 'Get SVG',
  };

  const onPressHandler = () => {
    action(variant)();
    return ref?.current?.[variant]().then(console.log, console.warn);
  };

  return (
    <Content>
      <Chart {...props} ref={ref} loading={loading}>
        <Axis position="bottom" baseline ticks />
        <Axis position="left" grid />
        <Line dimension="x" metric="y" color="series" scaleType="linear" />
      </Chart>
      <Flex direction="row" gap="size-100">
        <ActionButton onPress={onPressHandler} data-testid={variant}>
          {buttonText[variant]}
        </ActionButton>
        <ActionButton onPress={() => setLoading(!loading)}>Toggle loading</ActionButton>
      </Flex>
    </Content>
  );
};

const CopyStory: StoryFn<typeof Chart> = (): ReactElement => {
  return <HandleStory variant="copy" />;
};

const DownloadStory: StoryFn<typeof Chart> = (): ReactElement => {
  return <HandleStory variant="download" />;
};

const PngStory: StoryFn<typeof Chart> = (): ReactElement => {
  return <HandleStory variant="getBase64Png" />;
};

const SvgStory: StoryFn<typeof Chart> = (): ReactElement => {
  return <HandleStory variant="getSvg" />;
};

const Copy = bindWithProps(CopyStory);
const Download = bindWithProps(DownloadStory);
const GetBase64Png = bindWithProps(PngStory);
const GetSvg = bindWithProps(SvgStory);

export { Copy, Download, GetBase64Png, GetSvg };
