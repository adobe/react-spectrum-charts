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
import { Spec } from 'vega';

/**
 * Creates a function that returns the previously seen spec object when a new spec serializes identically.
 * @returns dedupe function
 */
export const createSpecDeduper = (): ((spec: Spec) => Spec) => {
  let previous: { spec: Spec; json: string } | undefined;
  return (spec) => {
    const json = JSON.stringify(spec);
    if (previous?.json === json) return previous.spec;
    previous = { spec, json };
    return spec;
  };
};
