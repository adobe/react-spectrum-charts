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
 * Mocks the global Image constructor so that image loading completes immediately in jsdom.
 * 
 * In jsdom, Image.onload/onerror callbacks never fire because jsdom doesn't actually load images.
 * This causes Vega's ResourceLoader to hang waiting for images to load, which blocks view._running
 * from resolving. When view._running is stuck, any signal updates triggered by DOM events (via
 * view.runAsync) deadlock, making hover-based opacity tests impossible.
 * 
 * This mock fires onload immediately when src is set, allowing Vega's async image loading to complete.
 */
const OriginalImage = globalThis.Image;

globalThis.Image = class extends OriginalImage {
  constructor(width, height) {
    super(width, height);
    
    // Override src setter to fire onload immediately
    Object.defineProperty(this, 'src', {
      set(value) {
        // Store the src value
        this.setAttribute?.('src', value);
        // Fire onload on next microtick to simulate async loading
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      },
      get() {
        return this.getAttribute?.('src') || '';
      },
    });
  }
};
