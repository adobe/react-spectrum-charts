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
import { UpdateClassification } from '../types/index.js';

/** The change is ignored. */
export const NOOP: UpdateClassification = { update: 'noop', replay: false };
/** Signal values update on the live view. */
export const SIGNAL: UpdateClassification = { update: 'signal', replay: false };
/** Table rows update on the live view. */
export const DATA: UpdateClassification = { update: 'data', replay: false };
/** The live view resizes. */
export const SIZE: UpdateClassification = { update: 'size', replay: false };
/** A new view replaces the old one without replaying draw-in. */
export const REBUILD: UpdateClassification = { update: 'rebuild', replay: false };
/** A new view replaces the old one and draw-in replays, because it's a different chart. */
export const REPLAY: UpdateClassification = { update: 'rebuild', replay: true };
