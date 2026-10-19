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

// Sample datasets; playground code prints these by name.

export const barChannelData = [
  { channel: 'Search', visits: 12400 },
  { channel: 'Direct', visits: 9800 },
  { channel: 'Social', visits: 7300 },
  { channel: 'Email', visits: 5100 },
  { channel: 'Referral', visits: 3600 },
  { channel: 'Display', visits: 2200 },
];

export const barChannelDeviceData = [
  { id: 'search-desktop', channel: 'Search', device: 'Desktop', visits: 6200, stackOrder: 3 },
  { id: 'search-mobile', channel: 'Search', device: 'Mobile', visits: 4800, stackOrder: 2 },
  { id: 'search-tablet', channel: 'Search', device: 'Tablet', visits: 1400, stackOrder: 1 },
  { id: 'direct-desktop', channel: 'Direct', device: 'Desktop', visits: 5100, stackOrder: 3 },
  { id: 'direct-mobile', channel: 'Direct', device: 'Mobile', visits: 3700, stackOrder: 2 },
  { id: 'direct-tablet', channel: 'Direct', device: 'Tablet', visits: 1000, stackOrder: 1 },
  { id: 'social-desktop', channel: 'Social', device: 'Desktop', visits: 1900, stackOrder: 3 },
  { id: 'social-mobile', channel: 'Social', device: 'Mobile', visits: 4600, stackOrder: 2 },
  { id: 'social-tablet', channel: 'Social', device: 'Tablet', visits: 800, stackOrder: 1 },
  { id: 'email-desktop', channel: 'Email', device: 'Desktop', visits: 2600, stackOrder: 3 },
  { id: 'email-mobile', channel: 'Email', device: 'Mobile', visits: 2000, stackOrder: 2 },
  { id: 'email-tablet', channel: 'Email', device: 'Tablet', visits: 500, stackOrder: 1 },
  { id: 'referral-desktop', channel: 'Referral', device: 'Desktop', visits: 2100, stackOrder: 3 },
  { id: 'referral-mobile', channel: 'Referral', device: 'Mobile', visits: 1200, stackOrder: 2 },
  { id: 'referral-tablet', channel: 'Referral', device: 'Tablet', visits: 300, stackOrder: 1 },
];

export const barChannelVisitorData = [
  { channel: 'Search', device: 'Desktop', visitor: 'New', visits: 3900 },
  { channel: 'Search', device: 'Desktop', visitor: 'Returning', visits: 2300 },
  { channel: 'Search', device: 'Mobile', visitor: 'New', visits: 3100 },
  { channel: 'Search', device: 'Mobile', visitor: 'Returning', visits: 1700 },
  { channel: 'Direct', device: 'Desktop', visitor: 'New', visits: 1600 },
  { channel: 'Direct', device: 'Desktop', visitor: 'Returning', visits: 3500 },
  { channel: 'Direct', device: 'Mobile', visitor: 'New', visits: 1300 },
  { channel: 'Direct', device: 'Mobile', visitor: 'Returning', visits: 2400 },
  { channel: 'Social', device: 'Desktop', visitor: 'New', visits: 1200 },
  { channel: 'Social', device: 'Desktop', visitor: 'Returning', visits: 700 },
  { channel: 'Social', device: 'Mobile', visitor: 'New', visits: 3200 },
  { channel: 'Social', device: 'Mobile', visitor: 'Returning', visits: 1400 },
  { channel: 'Email', device: 'Desktop', visitor: 'New', visits: 600 },
  { channel: 'Email', device: 'Desktop', visitor: 'Returning', visits: 2000 },
  { channel: 'Email', device: 'Mobile', visitor: 'New', visits: 500 },
  { channel: 'Email', device: 'Mobile', visitor: 'Returning', visits: 1500 },
];

export const barSessionsOrdersData = [
  { channel: 'Search', series: 'Sessions', value: 12400 },
  { channel: 'Direct', series: 'Sessions', value: 9800 },
  { channel: 'Social', series: 'Sessions', value: 7300 },
  { channel: 'Email', series: 'Sessions', value: 5100 },
  { channel: 'Referral', series: 'Sessions', value: 3600 },
  { channel: 'Search', series: 'Orders', value: 310 },
  { channel: 'Direct', series: 'Orders', value: 420 },
  { channel: 'Social', series: 'Orders', value: 95 },
  { channel: 'Email', series: 'Orders', value: 260 },
  { channel: 'Referral', series: 'Orders', value: 120 },
];

export const barChangeData = [
  { channel: 'Search', change: 0.12, changeColor: '#0d7a55' },
  { channel: 'Direct', change: 0.05, changeColor: '#0d7a55' },
  { channel: 'Social', change: -0.08, changeColor: '#d7373f' },
  { channel: 'Email', change: 0.03, changeColor: '#0d7a55' },
  { channel: 'Referral', change: -0.11, changeColor: '#d7373f' },
  { channel: 'Display', change: -0.02, changeColor: '#d7373f' },
];

export const barRegionData = [
  { region: 'Americas', channel: 'Search', device: 'Desktop', visits: 3400 },
  { region: 'Americas', channel: 'Search', device: 'Mobile', visits: 2600 },
  { region: 'Americas', channel: 'Direct', device: 'Desktop', visits: 2800 },
  { region: 'Americas', channel: 'Direct', device: 'Mobile', visits: 1900 },
  { region: 'Americas', channel: 'Social', device: 'Desktop', visits: 900 },
  { region: 'Americas', channel: 'Social', device: 'Mobile', visits: 2300 },
  { region: 'EMEA', channel: 'Search', device: 'Desktop', visits: 2500 },
  { region: 'EMEA', channel: 'Search', device: 'Mobile', visits: 1800 },
  { region: 'EMEA', channel: 'Direct', device: 'Desktop', visits: 1700 },
  { region: 'EMEA', channel: 'Direct', device: 'Mobile', visits: 1200 },
  { region: 'EMEA', channel: 'Social', device: 'Desktop', visits: 700 },
  { region: 'EMEA', channel: 'Social', device: 'Mobile', visits: 1600 },
];

export const barGoalData = [
  { channel: 'Search', visits: 12400, status: 'Met goal', statusColor: '#0d7a55' },
  { channel: 'Direct', visits: 9800, status: 'Met goal', statusColor: '#0d7a55' },
  { channel: 'Social', visits: 7300, status: 'Missed goal', statusColor: '#d7373f' },
  { channel: 'Email', visits: 5100, status: 'Met goal', statusColor: '#0d7a55' },
  { channel: 'Referral', visits: 3600, status: 'Missed goal', statusColor: '#d7373f' },
  { channel: 'Display', visits: 2200, status: 'Missed goal', statusColor: '#d7373f' },
];

export const barMonthlyData = [
  { month: '2025-01-01 00:00:00', visits: 11800 },
  { month: '2025-02-01 00:00:00', visits: 12600 },
  { month: '2025-03-01 00:00:00', visits: 14100 },
  { month: '2025-04-01 00:00:00', visits: 13400 },
  { month: '2025-05-01 00:00:00', visits: 15900 },
  { month: '2025-06-01 00:00:00', visits: 17200 },
];

export const barZeroData = [
  { channel: 'Search', visits: 0 },
  { channel: 'Direct', visits: 0 },
  { channel: 'Social', visits: 0 },
  { channel: 'Email', visits: 0 },
];
