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

import React from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Easy to Use',
    description: (
      <>
        React Spectrum Charts was designed from the ground up to be easily installed and
        used to get your visualization up and running quickly.
      </>
    ),
  },
  {
    title: 'Spectrum Design System',
    description: (
      <>
        Built on Adobe&apos;s Spectrum design system, ensuring your charts are beautiful,
        accessible, and consistent with Adobe&apos;s design language.
      </>
    ),
  },
  {
    title: 'Powered by React',
    description: (
      <>
        Extend or customize chart components using React. React Spectrum Charts can be
        extended while reusing the existing components.
      </>
    ),
  },
];

function Feature({title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

Feature.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.node.isRequired,
};

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
} 