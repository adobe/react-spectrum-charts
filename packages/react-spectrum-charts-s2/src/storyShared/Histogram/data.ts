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

export interface ResponseTimeDatum extends Record<string, unknown> {
  id: number;
  /** Request duration in milliseconds, right-skewed. */
  responseTime: number;
  region: 'US East' | 'EU West' | 'Asia Pacific';
  /** Response payload size in kilobytes, loosely correlated with `responseTime`. */
  payloadKb: number;
}

export interface CustomerAgeDatum extends Record<string, unknown> {
  id: number;
  age: number;
}

/**
 * Creates a seeded pseudo-random generator (mulberry32) returning values in [0, 1).
 * @param seed
 * @returns () => number
 */
export const createRandom = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Draws a standard normal value with the Box-Muller transform.
 * @param random
 * @returns number
 */
export const normal = (random: () => number): number => {
  const u = 1 - random();
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const regions: { region: ResponseTimeDatum['region']; count: number; median: number; spread: number }[] = [
  { region: 'US East', count: 180, median: 170, spread: 0.45 },
  { region: 'EU West', count: 140, median: 230, spread: 0.5 },
  { region: 'Asia Pacific', count: 100, median: 330, spread: 0.55 },
];

const responseTimeRandom = createRandom(2026);

/** 420 API requests across three regions with log-normal response times. */
export const responseTimeData: ResponseTimeDatum[] = regions
  .flatMap(({ region, count, median, spread }) =>
    Array.from({ length: count }, () => {
      const responseTime = Math.round(clamp(median * Math.exp(spread * normal(responseTimeRandom)), 20, 2000));
      const payloadKb = Math.round(clamp(12 + responseTime * 0.1 + normal(responseTimeRandom) * 9, 2, 200));
      return { id: 0, responseTime, region, payloadKb };
    })
  )
  .map((datum, index) => ({ ...datum, id: index }));

const ageGroups = [
  { share: 0.35, mean: 28, sd: 5 },
  { share: 0.4, mean: 42, sd: 8 },
  { share: 0.25, mean: 61, sd: 7 },
];

const ageRandom = createRandom(65);

/** 300 customer ages between 18 and 84. */
export const customerAgeData: CustomerAgeDatum[] = ageGroups
  .flatMap(({ share, mean, sd }) =>
    Array.from({ length: Math.round(share * 300) }, () => Math.round(clamp(mean + sd * normal(ageRandom), 18, 84)))
  )
  .map((age, id) => ({ id, age }));

/** Age bands for `binEdges`; the last edge includes 84-year-olds. */
export const customerAgeBands = [18, 25, 35, 45, 55, 65, 85];

export interface SalaryDatum extends Record<string, unknown> {
  id: number;
  department: 'Engineering' | 'Sales' | 'Support';
  /** Annual base salary in US dollars. */
  salary: number;
}

const departments: { department: SalaryDatum['department']; count: number; mean: number; sd: number }[] = [
  { department: 'Engineering', count: 160, mean: 128000, sd: 21000 },
  { department: 'Sales', count: 130, mean: 88000, sd: 17000 },
  { department: 'Support', count: 110, mean: 62000, sd: 10000 },
];

const salaryRandom = createRandom(401);

/** 400 employee salaries across three departments. */
export const salaryData: SalaryDatum[] = departments
  .flatMap(({ department, count, mean, sd }) =>
    Array.from({ length: count }, () => ({
      id: 0,
      department,
      salary: Math.round(clamp(mean + sd * normal(salaryRandom), 38000, 195000) / 500) * 500,
    }))
  )
  .map((datum, id) => ({ ...datum, id }));

export interface OrderDatum extends Record<string, unknown> {
  id: number;
  /** Order total in US dollars. */
  orderValue: number;
  /** Units in the order; larger orders hold more units. */
  quantity: number;
}

const orderRandom = createRandom(1024);

/** 500 online orders with right-skewed totals and unit counts that grow with the total. */
export const orderData: OrderDatum[] = Array.from({ length: 500 }, (_, id) => {
  const orderValue = Math.round(clamp(52 * Math.exp(0.5 * normal(orderRandom)), 8, 400) * 100) / 100;
  const quantity = Math.max(1, Math.round(orderValue / 22 + normal(orderRandom) * 1.2));
  return { id, orderValue, quantity };
});

export interface DeliveryDatum extends Record<string, unknown> {
  id: number;
  /** Days from order to delivery, to the nearest tenth of a day. */
  deliveryDays: number;
}

const deliveryRandom = createRandom(77);

/** 600 delivery times: most orders arrive in 2 to 4 days, with a long tail of delays. */
export const deliveryData: DeliveryDatum[] = Array.from({ length: 600 }, (_, id) => {
  const days = deliveryRandom() < 0.85 ? 2.8 + normal(deliveryRandom) * 0.9 : 6 + Math.abs(normal(deliveryRandom)) * 3;
  return { id, deliveryDays: Math.round(clamp(days, 0.5, 13.9) * 10) / 10 };
});

export interface ExamScoreDatum extends Record<string, unknown> {
  id: number;
  /** Final exam score out of 100. */
  score: number;
}

const examRandom = createRandom(88);

/** 240 final exam scores, left-skewed with most students between 60 and 90. */
export const examScoreData: ExamScoreDatum[] = Array.from({ length: 240 }, (_, id) => ({
  id,
  score: Math.round(clamp(100 - 26 * Math.exp(0.45 * normal(examRandom)), 22, 99)),
}));

export interface ResidentAgeDatum extends Record<string, unknown> {
  id: number;
  sex: 'Female' | 'Male';
  age: number;
}

const residentRandom = createRandom(2030);

/**
 * Draws a resident age: roughly flat to 60, then thinning out, with women living a little longer.
 * @param sex
 * @returns number
 */
const drawResidentAge = (sex: ResidentAgeDatum['sex']): number => {
  if (residentRandom() < 0.74) return Math.floor(residentRandom() * 60);
  const tail = sex === 'Female' ? 14 : 11;
  return Math.floor(clamp(60 + Math.abs(normal(residentRandom)) * tail, 60, 99));
};

/** 1,000 residents of a town, split by sex. */
export const residentAgeData: ResidentAgeDatum[] = (['Female', 'Male'] as const)
  .flatMap((sex) => Array.from({ length: 500 }, () => ({ id: 0, sex, age: drawResidentAge(sex) })))
  .map((datum, id) => ({ ...datum, id }));

export interface SessionDatum extends Record<string, unknown> {
  id: number;
  /** Session length in minutes. */
  sessionMinutes: number;
  /** Pages viewed in the session; longer sessions view more pages. */
  pagesViewed: number;
}

const sessionRandom = createRandom(314);

/** 800 website sessions with log-normal durations and correlated page views. */
export const sessionData: SessionDatum[] = Array.from({ length: 800 }, (_, id) => {
  const sessionMinutes = Math.round(clamp(5 * Math.exp(0.65 * normal(sessionRandom)), 0.2, 29.9) * 10) / 10;
  const pagesViewed = Math.max(1, Math.round(1 + sessionMinutes * 0.7 + normal(sessionRandom) * 1.6));
  return { id, sessionMinutes, pagesViewed };
});

export interface HomeSaleDatum extends Record<string, unknown> {
  id: number;
  /** Living area in square feet. */
  squareFeet: number;
  /** Sale price in US dollars. */
  price: number;
}

const homeRandom = createRandom(5150);

/** 600 home sales where price rises with living area. */
export const homeSaleData: HomeSaleDatum[] = Array.from({ length: 600 }, (_, id) => {
  const squareFeet = Math.round(clamp(1900 * Math.exp(0.32 * normal(homeRandom)), 700, 4400) / 10) * 10;
  const pricePerFoot = 210 + normal(homeRandom) * 35;
  const price = Math.round(clamp(40000 + squareFeet * pricePerFoot, 120000, 1190000) / 1000) * 1000;
  return { id, squareFeet, price };
});
