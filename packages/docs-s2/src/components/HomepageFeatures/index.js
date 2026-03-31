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
import React from 'react';

import clsx from 'clsx';
import PropTypes from 'prop-types';

import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Spectrum 2 Native',
    description: (
      <>
        Built entirely on Spectrum 2 design tokens — colors, typography, spacing, and interactive states all follow the
        latest Adobe design system specification.
      </>
    ),
  },
  {
    title: 'S2-Exclusive Features',
    description: (
      <>
        Access features not available in the base package: line gradients, curve interpolation, inline direct labels,
        and Spectrum 2 reference lines.
      </>
    ),
  },
  {
    title: 'Same Declarative API',
    description: (
      <>
        Compose charts as JSX component trees using the same patterns as{' '}
        <code>@adobe/react-spectrum-charts</code>. Drop-in familiar for existing users.
      </>
    ),
  },
];

function Feature({ title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md padding-top--lg">
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
