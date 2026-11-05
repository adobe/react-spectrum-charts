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
import { ScenegraphEvent, View } from 'vega';

import type { ActionItem } from './markClickUtils.js';

export type ViewEventType = 'click' | 'contextmenu' | 'mouseover' | 'mouseout';

type ViewEventHandler = (event: ScenegraphEvent, item: ActionItem) => void;

const handlersByView = new WeakMap<View, Map<ViewEventType, ViewEventHandler[]>>();

/**
 * Adds a view event listener that keyboard navigation can also run for a scene item.
 * @param view
 * @param type
 * @param handler
 */
export const addViewEventListener = (view: View, type: ViewEventType, handler: ViewEventHandler): void => {
  view.addEventListener(type, handler as Parameters<View['addEventListener']>[1]);
  const handlers = handlersByView.get(view) ?? new Map<ViewEventType, ViewEventHandler[]>();
  handlers.set(type, [...(handlers.get(type) ?? []), handler]);
  handlersByView.set(view, handlers);
};

/**
 * Runs a view's listeners for a scene item as if the pointer had triggered the event on it.
 * @param view
 * @param type
 * @param item
 * @param event defaults to a `MouseEvent` of the same type
 */
export const dispatchViewEvent = (
  view: View | undefined,
  type: ViewEventType,
  item: unknown,
  event: MouseEvent = new MouseEvent(type, { bubbles: true, cancelable: true })
): void => {
  if (!view) return;
  for (const handler of handlersByView.get(view)?.get(type) ?? []) {
    handler(event as unknown as ScenegraphEvent, item as ActionItem);
  }
};
