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
import { createRef } from 'react';

import { renderHook } from '@testing-library/react';
import { View } from 'vega';

import { ChartHandle } from '@spectrum-charts/vega-spec-builder-s2';

import useChartImperativeHandle from './useChartImperativeHandle.js';

const getHandle = (toImageURL: () => Promise<string>) => {
  const ref = createRef<ChartHandle>();
  const chartView = { current: { toImageURL } as unknown as View };
  renderHook(() => useChartImperativeHandle(ref, { chartView }));
  return ref.current as ChartHandle;
};

describe('useChartImperativeHandle copy()', () => {
  const originalFetch = globalThis.fetch;
  const originalClipboard = navigator.clipboard;
  const originalClipboardItem = globalThis.ClipboardItem;
  const write = jest.fn();

  beforeEach(() => {
    globalThis.fetch = jest.fn().mockResolvedValue({ blob: () => Promise.resolve(new Blob()) });
    Object.defineProperty(navigator, 'clipboard', { value: { write }, configurable: true });
    globalThis.ClipboardItem = jest.fn() as unknown as typeof ClipboardItem;
    write.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true });
    globalThis.ClipboardItem = originalClipboardItem;
  });

  test('should resolve when the image is written to the clipboard', async () => {
    write.mockResolvedValue(undefined);
    await expect(getHandle(() => Promise.resolve('data:url')).copy()).resolves.toBe('Chart copied to clipboard');
    expect(write).toHaveBeenCalledTimes(1);
  });

  test('should reject when the image URL cannot be created', async () => {
    await expect(getHandle(() => Promise.reject(new Error('nope'))).copy()).rejects.toThrow(
      'Error occurred while converting image to URL, copy to clipboard failed'
    );
  });

  test('should reject when writing to the clipboard fails', async () => {
    write.mockRejectedValue(new Error('denied'));
    await expect(getHandle(() => Promise.resolve('data:url')).copy()).rejects.toThrow(
      'Error occurred while writing to clipboard, copy to clipboard failed'
    );
  });
});
