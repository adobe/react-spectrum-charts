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
type ConfigurableStory = {
  parameters?: { controls: { include: string[] } };
  argTypes?: Record<string, { control: string; options?: string[] }>;
};

/** Limits a story's controls panel to the given props. */
export const setControls = (story: object, include: string[]) => {
  (story as ConfigurableStory).parameters = { controls: { include } };
};

/** Sets a story's argTypes (e.g. to constrain a control's options). */
export const setArgTypes = (story: object, argTypes: ConfigurableStory['argTypes']) => {
  (story as ConfigurableStory).argTypes = argTypes;
};
