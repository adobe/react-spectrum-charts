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
import { View } from 'vega';

import {
  NavigationActions,
  NavigationSession,
  NavigationSessionOptions,
  mountNavigationSession,
} from './navigationSession.js';

/** Everything a session needs except the container, chart id and view, which the controller owns. */
export type NavigationInputs = Omit<NavigationSessionOptions, 'container' | 'chartId' | 'view'>;

/** Keeps one navigation session mounted for a chart's current view and navigation inputs. */
export interface NavigationController {
  /** Sets the navigation inputs; `undefined` removes the navigation */
  update: (inputs: NavigationInputs | undefined) => void;
  /** Sets the view the navigation drives */
  setView: (view: View | undefined) => void;
  /** Removes the navigation */
  destroy: () => void;
}

const ACTION_KEYS: (keyof NavigationActions)[] = [
  'selectedData',
  'selectedDataBounds',
  'selectedDataName',
  'keyboardPopoverComponentName',
  'onNodeClick',
  'hasChartPopover',
];

/**
 * Gets the actions from the navigation inputs.
 * @param inputs
 * @returns NavigationActions
 */
const getActions = (inputs: NavigationInputs): NavigationActions =>
  Object.fromEntries(ACTION_KEYS.map((key) => [key, inputs[key]])) as NavigationActions;

/** Each data array's serialized form, so an unchanged array isn't serialized again on every update. */
const dataKeys = new WeakMap<object, string>();

/**
 * Serializes the data, reusing the result for the same array.
 * @param data
 * @returns string
 */
const getDataKey = (data: NavigationInputs['data']): string => {
  let key = dataKeys.get(data);
  if (key === undefined) {
    key = JSON.stringify(data);
    dataKeys.set(data, key);
  }
  return key;
};

/**
 * Gets a key that changes only when the navigation structure would change.
 * @param inputs
 * @returns string
 */
export const getStructureKey = (inputs: NavigationInputs): string =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(inputs)
        .filter(([key]) => !ACTION_KEYS.includes(key as keyof NavigationActions))
        .map(([key, value]) => [key, key === 'data' ? getDataKey(inputs.data) : value])
    )
  );

/**
 * Creates a controller that mounts keyboard navigation into a container.
 * The session is remounted when the view or the navigation structure changes, which resets focus.
 * @param container
 * @param chartId
 * @returns NavigationController
 */
export const createNavigationController = (container: HTMLElement, chartId: string): NavigationController => {
  let inputs: NavigationInputs | undefined;
  let structureKey: string | undefined;
  let view: View | undefined;
  let session: NavigationSession | undefined;
  let generation = 0;
  let restoreFocus = false;

  const mount = (mountGeneration: number) => {
    if (mountGeneration !== generation || !inputs) return;
    session = mountNavigationSession({ ...inputs, container, chartId, view });
    if (restoreFocus) session?.focusEntry();
    restoreFocus = false;
  };

  const remount = () => {
    generation += 1;
    if (session) {
      restoreFocus ||= container.contains(document.activeElement);
      session.destroy();
      session = undefined;
    }
    if (!inputs || inputs.data.length === 0) return;
    const mountGeneration = generation;
    if (!view) {
      mount(mountGeneration);
      return;
    }
    // Waits for any pending view update so the session reads the updated scene.
    view.runAsync().then(
      () => mount(mountGeneration),
      () => undefined
    );
  };

  return {
    update: (next) => {
      const nextKey = next && getStructureKey(next);
      inputs = next;
      if (nextKey === structureKey) {
        if (next) session?.setActions(getActions(next));
        return;
      }
      structureKey = nextKey;
      remount();
    },
    setView: (next) => {
      if (next === view) return;
      view = next;
      remount();
    },
    destroy: () => {
      inputs = undefined;
      structureKey = undefined;
      view = undefined;
      generation += 1;
      session?.destroy();
      session = undefined;
    },
  };
};
