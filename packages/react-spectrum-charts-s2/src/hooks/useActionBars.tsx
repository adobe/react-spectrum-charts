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
import { createElement, useMemo } from 'react';

import { ChartActionBar } from '../components/ChartActionBar';
import { ChartActionBarElement, ChartActionBarProps, ChartChildElement } from '../types';
import { getAllElements } from '../utils';

type MappedActionBar = { name: string; element: ChartActionBarElement; parent?: string };

const ChartContainer = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};
ChartContainer.displayName = 'ChartContainer';

export type ActionBarDetail = {
  chartActionBarProps: ChartActionBarProps;
  key: string;
  name: string;
  parent?: string;
};

export default function useActionBars(children: ChartChildElement[]): ActionBarDetail[] {
  const actionBarElements = useMemo(
    () =>
      getAllElements(
        createElement(ChartContainer, undefined, children),
        ChartActionBar,
        [],
        undefined,
        'Chart'
      ) as MappedActionBar[],
    [children]
  );

  return useMemo(
    () =>
      actionBarElements
        .filter((actionBar) => actionBar.element.props.children)
        .map((actionBar, index) => ({
          chartActionBarProps: actionBar.element.props,
          key: `${actionBar.name}ActionBar${index}`,
          name: actionBar.name,
          parent: actionBar.parent,
        })),
    [actionBarElements]
  );
}
