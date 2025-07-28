/*
 * Copyright 2025 Adobe. All rights reserved.
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
 * Combines a parent name and a child name into a single string
 * @param parentName - The parent name
 * @param childName - The child name
 * @returns The combined name
 */
export const combineNames = (parentName: string | null, childName: string | null): string => {
  const formattedChildName =
    childName && parentName ? childName.charAt(0).toUpperCase() + childName.slice(1) : childName;
  return [parentName, formattedChildName].filter(Boolean).join('');
};

/**
 * Converts a string to camel case
 * @param str - The string to convert
 * @returns The camel case string
 */
export function toCamelCase(str: string) {
  const words = str.match(/[A-Z]{2,}(?=[A-Z][a-z]+\d*|\b)|[A-Z]?[a-z]+\d*|[A-Z]|\d+/g);
  if (words) {
    return words
      .map((word, i) => {
        if (i === 0) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
  }
  return str;
}
