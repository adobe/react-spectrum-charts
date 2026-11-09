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
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

const readStoredValue = <T>(key: string, initialValue: T, isValid: (value: unknown) => boolean): T => {
  try {
    const stored = globalThis.localStorage?.getItem(key);
    if (stored === null || stored === undefined) return initialValue;
    const parsed: unknown = JSON.parse(stored);
    return isValid(parsed) ? (parsed as T) : initialValue;
  } catch {
    return initialValue;
  }
};

/**
 * useState that survives page reloads by mirroring the value to localStorage.
 * @param key localStorage key
 * @param initialValue value used when nothing valid is stored
 * @param isValid rejects stored values that no longer apply
 * @returns [value, setValue]
 */
export const usePersistedState = <T>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => boolean = (value) => typeof value === typeof initialValue
): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => readStoredValue(key, initialValue, isValid));
  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(key, JSON.stringify(value));
    } catch {
      // storage can be unavailable (private mode, quota); persistence is best-effort
    }
  }, [key, value]);
  return [value, setValue];
};
