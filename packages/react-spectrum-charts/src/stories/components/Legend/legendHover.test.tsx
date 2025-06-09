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
import React from 'react';

import { findChart, getAllLegendEntries, hoverNthElement, render, unhoverNthElement } from '../../../test-utils';
import { ControlledHover } from './legendHover.story';

test('Mousing over a legend item should trigger callback function.', async () => {
  const onMouseOver = jest.fn();
  const onMouseOut = jest.fn();
  render(<ControlledHover {...ControlledHover.args} onMouseOver={onMouseOver} onMouseOut={onMouseOut} />);
  const chart = await findChart();

  const entries = getAllLegendEntries(chart);
  await hoverNthElement(entries, 0);
  await unhoverNthElement(entries, 0);

  expect(onMouseOver).toHaveBeenCalledTimes(1);
  expect(onMouseOver).toHaveBeenCalledWith('Windows');
  expect(onMouseOut).toHaveBeenCalledTimes(1);
  expect(onMouseOut).toHaveBeenCalledWith('Windows');
});
