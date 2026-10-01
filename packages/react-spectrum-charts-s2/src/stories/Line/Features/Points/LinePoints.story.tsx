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
import { Line } from '../../../../components';
import { bindWithProps } from '../../../../test-utils';
import { setControls } from '../../lineStoryUtils';
import { VisitsStory, visitsProps } from '../lineStoryTemplates';

export default {
  title: 'React Spectrum Charts 2/Line/Features/Points',
  component: Line,
};

const StaticPoint = bindWithProps(VisitsStory);
StaticPoint.args = { ...visitsProps, staticPoint: 'hasEvent' };
setControls(StaticPoint, ['staticPoint']);

const PointSize = bindWithProps(VisitsStory);
PointSize.args = { ...visitsProps, staticPoint: 'hasEvent', pointSize: 144 };
setControls(PointSize, ['pointSize']);

export { StaticPoint, PointSize };
