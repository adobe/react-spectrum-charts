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

// Sample datasets for the concept guides; playground code prints these by name.

// Quarterly sessions by traffic source, six sources.
export const guideSourceSessionsData = [
  { quarter: 'Q1', source: 'Search', sessions: 4200 },
  { quarter: 'Q1', source: 'Direct', sessions: 3100 },
  { quarter: 'Q1', source: 'Social', sessions: 2400 },
  { quarter: 'Q1', source: 'Email', sessions: 1500 },
  { quarter: 'Q1', source: 'Referral', sessions: 1100 },
  { quarter: 'Q1', source: 'Paid', sessions: 800 },
  { quarter: 'Q2', source: 'Search', sessions: 4600 },
  { quarter: 'Q2', source: 'Direct', sessions: 3300 },
  { quarter: 'Q2', source: 'Social', sessions: 2900 },
  { quarter: 'Q2', source: 'Email', sessions: 1400 },
  { quarter: 'Q2', source: 'Referral', sessions: 1200 },
  { quarter: 'Q2', source: 'Paid', sessions: 1000 },
  { quarter: 'Q3', source: 'Search', sessions: 4900 },
  { quarter: 'Q3', source: 'Direct', sessions: 3200 },
  { quarter: 'Q3', source: 'Social', sessions: 3400 },
  { quarter: 'Q3', source: 'Email', sessions: 1600 },
  { quarter: 'Q3', source: 'Referral', sessions: 1300 },
  { quarter: 'Q3', source: 'Paid', sessions: 1200 },
  { quarter: 'Q4', source: 'Search', sessions: 5300 },
  { quarter: 'Q4', source: 'Direct', sessions: 3600 },
  { quarter: 'Q4', source: 'Social', sessions: 3800 },
  { quarter: 'Q4', source: 'Email', sessions: 2100 },
  { quarter: 'Q4', source: 'Referral', sessions: 1400 },
  { quarter: 'Q4', source: 'Paid', sessions: 1500 },
];

// Monthly revenue for the first half of 2025, with local-time ISO dates.
export const guideMonthlyRevenueData = [
  { datetime: '2025-01-01T00:00:00', revenue: 1184500.5 },
  { datetime: '2025-02-01T00:00:00', revenue: 1092300.25 },
  { datetime: '2025-03-01T00:00:00', revenue: 1257800.75 },
  { datetime: '2025-04-01T00:00:00', revenue: 1310200 },
  { datetime: '2025-05-01T00:00:00', revenue: 1388900.5 },
  { datetime: '2025-06-01T00:00:00', revenue: 1452100.25 },
];
