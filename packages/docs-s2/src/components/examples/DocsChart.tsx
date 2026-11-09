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
import React, { ComponentProps } from 'react';

import { useColorMode } from '@docusaurus/theme-common';

import { Chart } from '@spectrum-charts/react-spectrum-charts-s2';

type ChartProps = ComponentProps<typeof Chart>;

/**
 * Chart that follows the docs site's light/dark mode unless colorScheme is set.
 * @param props
 * @returns Chart element
 */
export const DocsChart = (props: ChartProps) => {
  const { colorMode } = useColorMode();
  return <Chart colorScheme={colorMode} {...props} />;
};
DocsChart.displayName = 'Chart';
