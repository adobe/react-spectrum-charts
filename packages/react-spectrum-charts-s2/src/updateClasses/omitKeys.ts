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
/**
 * Copies a table without the given keys.
 * @param table - table to copy
 * @param keys - keys to leave out, e.g. options a component sets from its children or callbacks
 * @returns table without the keys
 */
export const omitKeys = <T extends object, K extends keyof T>(table: T, keys: readonly K[]): Omit<T, K> =>
  Object.fromEntries(Object.entries(table).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>;
