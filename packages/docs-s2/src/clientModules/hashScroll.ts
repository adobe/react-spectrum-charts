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
import type { ClientModule } from '@docusaurus/types';

const SETTLE_MS = 2000;
const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const;

let stopPinning: (() => void) | undefined;

/**
 * Keeps the hash target in view while browser-only examples above it finish rendering.
 * @param hash
 */
const pinHashTarget = (hash: string) => {
  stopPinning?.();
  const id = decodeURIComponent(hash.slice(1));
  if (!id) return;

  const align = () => document.getElementById(id)?.scrollIntoView({ block: 'start' });
  const stop = () => stopPinning?.();
  const observer = new ResizeObserver(align);
  observer.observe(document.body);
  const timeout = window.setTimeout(stop, SETTLE_MS);

  stopPinning = () => {
    observer.disconnect();
    window.clearTimeout(timeout);
    USER_SCROLL_EVENTS.forEach((type) => window.removeEventListener(type, stop));
    stopPinning = undefined;
  };
  USER_SCROLL_EVENTS.forEach((type) => window.addEventListener(type, stop, { passive: true }));
  align();
};

const hashScroll: ClientModule = {
  onRouteDidUpdate({ location }) {
    if (location.hash) pinHashTarget(location.hash);
  },
};

export default hashScroll;
