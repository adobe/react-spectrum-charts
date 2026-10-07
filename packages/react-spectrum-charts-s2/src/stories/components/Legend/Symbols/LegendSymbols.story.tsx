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
import { Legend } from '../../../../components/index.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { RevenueStory, TrafficStory, controls } from '../legendStoryTemplates.js';

export default {
  title: 'React Spectrum Charts 2/Legend/Features/Symbols',
  component: Legend,
};

// A neutral color keeps the period legend from implying a region.
const Color = bindWithProps(RevenueStory);
Color.args = { keys: ['period'], color: { value: 'gray-700' }, lineType: 'period', symbolShape: { value: 'stroke' } };
Object.assign(Color, controls('color'));

const LineType = bindWithProps(RevenueStory);
LineType.args = { keys: ['period'], lineType: 'period', symbolShape: { value: 'stroke' } };
Object.assign(LineType, controls('lineType'));

const LineWidth = bindWithProps(TrafficStory);
LineWidth.args = { lineWidth: { value: 'L' }, symbolShape: { value: 'stroke' } };
Object.assign(LineWidth, controls('lineWidth'));

const Opacity = bindWithProps(TrafficStory);
Opacity.args = { opacity: { value: 0.5 } };
Object.assign(Opacity, controls('opacity'));

const SymbolShape = bindWithProps(TrafficStory);
SymbolShape.args = { symbolShape: { value: 'circle' } };
Object.assign(SymbolShape, controls('symbolShape'));

export { Color, LineType, LineWidth, Opacity, SymbolShape };
