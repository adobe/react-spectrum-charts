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

/* eslint-disable @typescript-eslint/no-var-requires */
const base = require('./webpack.profile.config.js');
const path = require('path');

// Variant of webpack.profile.config.js that answers a narrower question: what does
// each fixture cost if the host app already supplies react/react-dom/@react-spectrum/s2
// (so those aren't duplicated), while vega/vega-lite/vega-embed/vega-tooltip and the
// s2 package's own code still get bundled, since nothing else in a typical host already
// carries those. Output goes to dist-shared-react/ so it doesn't clobber the main
// cold-consumer measurement in dist/.
module.exports = {
  ...base,
  output: {
    ...base.output,
    path: path.resolve(__dirname, 'dist-shared-react'),
  },
  externalsType: 'commonjs',
  externals: {
    react: 'react',
    'react-dom': 'react-dom',
    'react-dom/client': 'react-dom/client',
    'react/jsx-runtime': 'react/jsx-runtime',
    '@react-spectrum/s2': '@react-spectrum/s2',
  },
};
