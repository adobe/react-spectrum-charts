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
import { NodeObject, Structure } from 'data-navigator';

/** Every node rendered in keyboard mode needs an aria-label — shared by every chart type's structure builder. */
export const applyDefaultLabels = (structure: Structure, labelFor: (node: NodeObject) => string): void => {
  for (const node of Object.values(structure.nodes)) {
    if (!node.semantics?.label) {
      node.semantics = { ...node.semantics, label: labelFor(node) };
    }
  }
};
