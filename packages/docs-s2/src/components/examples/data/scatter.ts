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

export const scatterCampaignData = [
  { id: 1, campaign: 'Brand terms', channel: 'Search', audience: 'Returning', spend: 12, revenue: 58, reach: 40, roi: 4.8 },
  { id: 2, campaign: 'Competitor terms', channel: 'Search', audience: 'New', spend: 18, revenue: 61, reach: 55, roi: 3.4 },
  { id: 3, campaign: 'Product terms', channel: 'Search', audience: 'New', spend: 25, revenue: 96, reach: 72, roi: 3.8 },
  { id: 4, campaign: 'Shopping ads', channel: 'Search', audience: 'Returning', spend: 31, revenue: 118, reach: 90, roi: 3.8 },
  { id: 5, campaign: 'Generic terms', channel: 'Search', audience: 'New', spend: 40, revenue: 132, reach: 120, roi: 3.3 },
  { id: 6, campaign: 'Spring video', channel: 'Social', audience: 'New', spend: 8, revenue: 19, reach: 150, roi: 2.4 },
  { id: 7, campaign: 'Influencer kit', channel: 'Social', audience: 'New', spend: 15, revenue: 41, reach: 210, roi: 2.7 },
  { id: 8, campaign: 'Retargeting', channel: 'Social', audience: 'Returning', spend: 22, revenue: 74, reach: 60, roi: 3.4 },
  { id: 9, campaign: 'Carousel ads', channel: 'Social', audience: 'New', spend: 29, revenue: 70, reach: 180, roi: 2.4 },
  { id: 10, campaign: 'Holiday promo', channel: 'Social', audience: 'Returning', spend: 36, revenue: 103, reach: 95, roi: 2.9 },
  { id: 11, campaign: 'Welcome series', channel: 'Email', audience: 'New', spend: 4, revenue: 22, reach: 30, roi: 5.5 },
  { id: 12, campaign: 'Cart reminder', channel: 'Email', audience: 'Returning', spend: 6, revenue: 35, reach: 25, roi: 5.8 },
  { id: 13, campaign: 'Newsletter', channel: 'Email', audience: 'Returning', spend: 9, revenue: 38, reach: 80, roi: 4.2 },
  { id: 14, campaign: 'Win-back', channel: 'Email', audience: 'Returning', spend: 14, revenue: 47, reach: 45, roi: 3.4 },
  { id: 15, campaign: 'Launch announce', channel: 'Email', audience: 'New', spend: 19, revenue: 66, reach: 110, roi: 3.5 },
];

export const scatterSignupData = [
  { datetime: 1767571200000, signups: 42, platform: 'Web' },
  { datetime: 1767571200000, signups: 30, platform: 'Mobile' },
  { datetime: 1767657600000, signups: 48, platform: 'Web' },
  { datetime: 1767657600000, signups: 34, platform: 'Mobile' },
  { datetime: 1767744000000, signups: 45, platform: 'Web' },
  { datetime: 1767744000000, signups: 31, platform: 'Mobile' },
  { datetime: 1767830400000, signups: 51, platform: 'Web' },
  { datetime: 1767830400000, signups: 37, platform: 'Mobile' },
  { datetime: 1767916800000, signups: 58, platform: 'Web' },
  { datetime: 1767916800000, signups: 40, platform: 'Mobile' },
  { datetime: 1768003200000, signups: 36, platform: 'Web' },
  { datetime: 1768003200000, signups: 44, platform: 'Mobile' },
  { datetime: 1768089600000, signups: 33, platform: 'Web' },
  { datetime: 1768089600000, signups: 47, platform: 'Mobile' },
  { datetime: 1768176000000, signups: 55, platform: 'Web' },
  { datetime: 1768176000000, signups: 39, platform: 'Mobile' },
  { datetime: 1768262400000, signups: 61, platform: 'Web' },
  { datetime: 1768262400000, signups: 43, platform: 'Mobile' },
  { datetime: 1768348800000, signups: 64, platform: 'Web' },
  { datetime: 1768348800000, signups: 46, platform: 'Mobile' },
];

export const scatterTrajectoryData = [
  { product: 'Analytics', month: 'Jan', share: 12, growth: 4 },
  { product: 'Analytics', month: 'Feb', share: 15, growth: 9 },
  { product: 'Analytics', month: 'Mar', share: 19, growth: 12 },
  { product: 'Analytics', month: 'Apr', share: 21, growth: 7 },
  { product: 'Analytics', month: 'May', share: 20, growth: 2 },
  { product: 'Commerce', month: 'Jan', share: 30, growth: 11 },
  { product: 'Commerce', month: 'Feb', share: 28, growth: 6 },
  { product: 'Commerce', month: 'Mar', share: 25, growth: 1 },
  { product: 'Commerce', month: 'Apr', share: 27, growth: 5 },
  { product: 'Commerce', month: 'May', share: 31, growth: 10 },
  { product: 'Design', month: 'Jan', share: 6, growth: 14 },
  { product: 'Design', month: 'Feb', share: 9, growth: 16 },
  { product: 'Design', month: 'Mar', share: 13, growth: 15 },
  { product: 'Design', month: 'Apr', share: 16, growth: 11 },
  { product: 'Design', month: 'May', share: 17, growth: 13 },
];

export const scatterOutlierData = [
  { day: 1, visits: 120, isBotTraffic: false },
  { day: 2, visits: 135, isBotTraffic: false },
  { day: 3, visits: 128, isBotTraffic: false },
  { day: 4, visits: 410, isBotTraffic: true },
  { day: 5, visits: 152, isBotTraffic: false },
  { day: 6, visits: 160, isBotTraffic: false },
  { day: 7, visits: 149, isBotTraffic: false },
  { day: 8, visits: 171, isBotTraffic: false },
  { day: 9, visits: 455, isBotTraffic: true },
  { day: 10, visits: 182, isBotTraffic: false },
  { day: 11, visits: 190, isBotTraffic: false },
  { day: 12, visits: 186, isBotTraffic: false },
];
