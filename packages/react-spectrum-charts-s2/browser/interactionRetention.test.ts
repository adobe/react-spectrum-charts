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
import { Browser, Page, expect, test } from '@playwright/test';

type Point = { x: number; y: number };
type StoryArgs = Record<string, string | number>;

const STORY_ID = 'react-spectrum-charts-2-line-coverage-interaction-retention--default';
/** The view count must hold this long before the chart counts as settled. */
const SETTLE_MS = 300;

// one change of each update class in the RFC's state retention table, split by whether selection is kept
const KEEPING_UPDATES: [string, StoryArgs][] = [['a signal update', { highlightedSeries: 'b' }]];
const CLEARING_UPDATES: [string, StoryArgs][] = [
  ['a data update', { valueScale: 2 }],
  // a rebuild that keeps the layout, so the pointer stays over the same point
  ['a rebuild', { lineType: 'dashed' }],
];

const openStory = async (page: Page, renderer: 'svg' | 'canvas') => {
  await page.goto(`/iframe.html?id=${STORY_ID}&viewMode=story&args=renderer:${renderer}`);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByTestId('retention-status')).toHaveAttribute('data-views', '1');
};

/** Measures pointer targets on the SVG chart; the canvas chart has the same layout. */
const measureTargets = async (browser: Browser) => {
  const page = await browser.newPage();
  await openStory(page, 'svg');
  const legend = await page.locator('g.role-legend-entry g.role-scope > g > path.background').first().boundingBox();
  // Voronoi cells are convex, so the mean of their vertices is inside the cell.
  const voronoiCellA = await page
    .locator('g.line0_voronoi > path')
    .nth(1)
    .evaluate((path: SVGPathElement) => {
      const coords = (path.getAttribute('d') ?? '').match(/-?[\d.]+(?:e-?\d+)?/g)?.map(Number) ?? [];
      let x = 0;
      let y = 0;
      for (let i = 0; i < coords.length; i += 2) {
        x += coords[i];
        y += coords[i + 1];
      }
      const point = new DOMPoint((2 * x) / coords.length, (2 * y) / coords.length).matrixTransform(
        path.getScreenCTM() ?? undefined
      );
      return { x: point.x, y: point.y };
    });
  await page.close();
  if (!legend) throw new Error('Legend entry a has no layout box');
  return { legendEntryA: { x: legend.x + legend.width / 2, y: legend.y + legend.height / 2 }, voronoiCellA };
};

const settle = async (page: Page) => {
  const status = page.getByTestId('retention-status');
  let views = await status.getAttribute('data-views');
  let since = Date.now();
  while (Date.now() - since < SETTLE_MS) {
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const next = await status.getAttribute('data-views');
    if (next !== views) {
      views = next;
      since = Date.now();
    }
  }
};

/** Presses and releases the mouse where it is, so the browser sends no pointer movement. */
const clickInPlace = async (page: Page) => {
  await page.mouse.down();
  await page.mouse.up();
  await settle(page);
};

/** Changes story args through Storybook's channel, which re-renders without reloading the page. */
const updateArgs = async (page: Page, updatedArgs: StoryArgs) => {
  await page.evaluate(
    ([storyId, args]) =>
      (
        window as unknown as { __STORYBOOK_ADDONS_CHANNEL__: { emit: (event: string, data: unknown) => void } }
      ).__STORYBOOK_ADDONS_CHANNEL__.emit('updateStoryArgs', { storyId, updatedArgs: args }),
    [STORY_ID, updatedArgs] as const
  );
  await expect
    .poll(async () => JSON.parse((await page.getByTestId('retention-status').getAttribute('data-args')) ?? '{}'))
    .toMatchObject(updatedArgs);
  await settle(page);
};

let targets: { legendEntryA: Point; voronoiCellA: Point };

test.beforeAll(async ({ browser }) => {
  targets = await measureTargets(browser);
});

for (const renderer of ['svg', 'canvas'] as const) {
  test.describe(`${renderer} renderer`, () => {
    // Vega's canvas handler sends clicks to the item under the last pointer move, which a rebuilt view forgets.
    const failsOnCanvas = () => test.fail(renderer === 'canvas', 'a rebuilt canvas view drops the hovered item');

    test.beforeEach(async ({ page }) => {
      await openStory(page, renderer);
    });

    const hideSeriesA = async (page: Page) => {
      await page.mouse.move(targets.legendEntryA.x, targets.legendEntryA.y);
      await clickInPlace(page);
      await expect(page.getByTestId('retention-status')).toHaveAttribute('data-hidden-series', 'a');
    };

    const openPopoverOnSeriesA = async (page: Page) => {
      await page.mouse.move(targets.voronoiCellA.x, targets.voronoiCellA.y);
      await clickInPlace(page);
      await expect(page.getByTestId('rsc-popover')).toHaveText('Popover a');
    };

    test('legend click hides the series', async ({ page }) => {
      await hideSeriesA(page);
      await expect(page).toHaveScreenshot();
    });

    test('second legend click without moving shows the series', async ({ page }) => {
      failsOnCanvas();
      await hideSeriesA(page);

      await clickInPlace(page);

      await expect(page.getByTestId('retention-status')).toHaveAttribute('data-hidden-series', '');
      await expect(page).toHaveScreenshot();
    });

    for (const [update, args] of KEEPING_UPDATES) {
      test(`popover stays open after ${update}`, async ({ page }) => {
        await openPopoverOnSeriesA(page);

        await updateArgs(page, args);

        await expect(page.getByTestId('rsc-popover')).toHaveText('Popover a');
        await expect(page).toHaveScreenshot();
      });

      // The second click dismisses the popover, so the third is the one that has to reach the chart.
      test(`popover reopens on the same point after ${update} without moving`, async ({ page }) => {
        failsOnCanvas();
        await openPopoverOnSeriesA(page);
        await updateArgs(page, args);

        await clickInPlace(page);
        await expect(page.getByTestId('rsc-popover')).toHaveCount(0);
        await clickInPlace(page);

        await expect(page.getByTestId('rsc-popover')).toHaveText('Popover a');
        await expect(page).toHaveScreenshot();
      });
    }

    for (const [update, args] of CLEARING_UPDATES) {
      test(`popover closes after ${update}`, async ({ page }) => {
        test.fail(true, 'data updates and rebuilds keep the selection');
        await openPopoverOnSeriesA(page);

        await updateArgs(page, args);

        await expect(page.getByTestId('rsc-popover')).toHaveCount(0);
        await expect(page).toHaveScreenshot();
      });

      test(`popover reopens on the same point after ${update} without moving`, async ({ page }) => {
        test.fail(true, 'data updates and rebuilds keep the selection');
        failsOnCanvas();
        await openPopoverOnSeriesA(page);
        await updateArgs(page, args);

        await clickInPlace(page);

        await expect(page.getByTestId('rsc-popover')).toHaveText('Popover a');
        await expect(page).toHaveScreenshot();
      });
    }
  });
}
