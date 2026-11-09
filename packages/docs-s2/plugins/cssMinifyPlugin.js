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

/** Keeps @keyframes that S2 components reference from inline styles, like the ProgressCircle spinner. */
module.exports = function cssMinifyPlugin() {
  return {
    name: 'css-minify',
    configureWebpack(config, isServer) {
      if (isServer) return {};
      for (const minimizer of config.optimization?.minimizer ?? []) {
        const options = minimizer?.options?.minimizer?.options;
        if (!Array.isArray(options)) continue;
        for (const option of options) {
          if (typeof option?.preset === 'string' && option.preset.includes('cssnano-preset')) {
            option.preset = [option.preset, { discardUnused: false, reduceIdents: false }];
          }
        }
      }
      return {};
    },
  };
};
