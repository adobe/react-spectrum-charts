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
import { act, renderHook } from '@testing-library/react';

import usePrefersReducedMotion from './usePrefersReducedMotion.js';

describe('usePrefersReducedMotion', () => {
  test('returns false when matchMedia is unavailable', () => {
    const matchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: undefined });

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: matchMedia });
  });

  test('updates when the reduced motion preference changes', () => {
    let matches = false;
    let changeListener: (() => void) | undefined;
    const removeEventListener = jest.fn();

    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((_event, listener) => {
        changeListener = listener;
      }),
      removeEventListener,
      dispatchEvent: jest.fn(),
    }));

    const { result, unmount } = renderHook(() => usePrefersReducedMotion());

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      changeListener?.();
    });

    expect(result.current).toBe(true);

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
