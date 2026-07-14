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
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { findAllMarksByGroupName } from './customQueries';

export const findChart = async () => {
  return screen.findByRole('graphics-document');
};

export const hoverNthElement = async (elements: HTMLElement[], index: number) => {
  await userEvent.hover(elements[index]);
};

export const unhoverNthElement = async (elements: HTMLElement[], index: number) => {
  await userEvent.unhover(elements[index]);
};

export const clickNthElement = async (elements: HTMLElement[], index: number) => {
  await userEvent.click(elements[index]);
};

export const getChartContainer = (chart: HTMLElement): HTMLElement | null => {
  return chart.closest('.rsc-container') as HTMLElement | null;
};

export const getPopoverTriggerButtons = (chart: HTMLElement): HTMLButtonElement[] => {
  const container = getChartContainer(chart);
  if (!container) return [];
  return [...container.querySelectorAll<HTMLButtonElement>('[id$="-popover-button"]')];
};

export const rightClickNthElement = async (elements: HTMLElement[], index: number) => {
  const user = userEvent.setup();
  await user.pointer([{ target: elements[index], keys: '[MouseRight]' }]);
};

export const allElementsHaveAttributeValue = (elements: HTMLElement[], attribute: string, value: number | string) =>
  elements.every((element) => element.getAttribute(attribute) === value.toString());

/**
 * Finds marks by group name, then polls `assertion` against them via `waitFor` until it passes.
 * Use this instead of pairing `findAllMarksByGroupName` + `waitFor` by hand — needed for any mark
 * attribute that settles asynchronously (e.g. the hover-animation system's timer-driven opacity/
 * stroke-width ramps), where the DOM doesn't reflect the final value on the same tick as the event.
 */
export const waitForMarksByGroupName = async (
  chart: HTMLElement,
  groupName: string,
  assertion: (marks: HTMLElement[]) => void,
  tagName?: string
): Promise<HTMLElement[]> => {
  const marks = await findAllMarksByGroupName(chart, groupName, tagName);
  await waitFor(() => assertion(marks));
  return marks;
};
