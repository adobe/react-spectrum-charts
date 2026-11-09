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
// Server-only stand-in for S2 packages: every export is a component that renders nothing.
const cache = {};
module.exports = new Proxy(
  {},
  {
    get(_target, name) {
      if (typeof name !== 'string' || name === '__esModule' || name === 'then') return undefined;
      if (!cache[name]) {
        const Stub = () => null;
        Stub.displayName = name;
        cache[name] = Stub;
      }
      return cache[name];
    },
  }
);
