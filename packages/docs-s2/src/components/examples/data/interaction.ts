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

// Sample datasets for the ChartInspect and ChartPopover page; playground code prints these by name.

export const interactionVisitorsData = [
  { id: 'Desktop-Jan', month: 'Jan', device: 'Desktop', visitors: 4200 },
  { id: 'Desktop-Feb', month: 'Feb', device: 'Desktop', visitors: 4800 },
  { id: 'Desktop-Mar', month: 'Mar', device: 'Desktop', visitors: 4500 },
  { id: 'Desktop-Apr', month: 'Apr', device: 'Desktop', visitors: 5300 },
  { id: 'Desktop-May', month: 'May', device: 'Desktop', visitors: 5900 },
  { id: 'Desktop-Jun', month: 'Jun', device: 'Desktop', visitors: 6400 },
  { id: 'Mobile-Jan', month: 'Jan', device: 'Mobile', visitors: 2600 },
  { id: 'Mobile-Feb', month: 'Feb', device: 'Mobile', visitors: 3100 },
  { id: 'Mobile-Mar', month: 'Mar', device: 'Mobile', visitors: 3900 },
  { id: 'Mobile-Apr', month: 'Apr', device: 'Mobile', visitors: 3700 },
  { id: 'Mobile-May', month: 'May', device: 'Mobile', visitors: 4600 },
  { id: 'Mobile-Jun', month: 'Jun', device: 'Mobile', visitors: 5200 },
];

export const interactionDownloadsData = [
  { id: 'Chrome-Windows', browser: 'Chrome', os: 'Windows', downloads: 5000 },
  { id: 'Chrome-Mac', browser: 'Chrome', os: 'Mac', downloads: 3000 },
  { id: 'Chrome-Linux', browser: 'Chrome', os: 'Linux', downloads: 1200 },
  { id: 'Firefox-Windows', browser: 'Firefox', os: 'Windows', downloads: 2700 },
  { id: 'Firefox-Mac', browser: 'Firefox', os: 'Mac', downloads: 1500 },
  { id: 'Firefox-Linux', browser: 'Firefox', os: 'Linux', downloads: 1800 },
  { id: 'Safari-Windows', browser: 'Safari', os: 'Windows', downloads: 300 },
  { id: 'Safari-Mac', browser: 'Safari', os: 'Mac', downloads: 4200 },
  { id: 'Safari-Linux', browser: 'Safari', os: 'Linux', downloads: 150 },
  { id: 'Edge-Windows', browser: 'Edge', os: 'Windows', downloads: 2400 },
  { id: 'Edge-Mac', browser: 'Edge', os: 'Mac', downloads: 600 },
  { id: 'Edge-Linux', browser: 'Edge', os: 'Linux', downloads: 200 },
];

// Same rows with a flag that turns off the inspect for estimated values.
export const interactionEstimatesData = interactionDownloadsData.map((datum) => ({
  ...datum,
  isEstimate: datum.os === 'Linux',
}));
