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
import { defineConfig, devices } from '@playwright/test';

const port = process.env.STORYBOOK_PORT ?? '6011';

export default defineConfig({
  testDir: './browser',
  outputDir: '../../test-results/browser',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}-{projectName}-{platform}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { outputFolder: '../../playwright-report', open: 'never' }]],
  expect: { toHaveScreenshot: { animations: 'disabled', maxDiffPixels: 20 } },
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 600, height: 500 } } }],
  webServer: {
    command: `yarn cross-env NODE_OPTIONS=--openssl-legacy-provider storybook dev -p ${port} --config-dir .storybook-s2-dev --ci --no-open --exact-port`,
    cwd: '../..',
    url: `http://localhost:${port}/iframe.html`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
