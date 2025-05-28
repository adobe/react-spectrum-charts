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
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <div className="container">
          <div className="row">
            <div className="col col--4">
              <div className="text--center padding-horiz--md">
                <h3>Easy to Use</h3>
                <p>
                  React Spectrum Charts was designed from the ground up to be easily installed and
                  used to get your visualization up and running quickly.
                </p>
              </div>
            </div>
            <div className="col col--4">
              <div className="text--center padding-horiz--md">
                <h3>Spectrum Design System</h3>
                <p>
                  Built on Adobe&apos;s Spectrum design system, ensuring your charts are beautiful,
                  accessible, and consistent with Adobe&apos;s design language.
                </p>
              </div>
            </div>
            <div className="col col--4">
              <div className="text--center padding-horiz--md">
                <h3>Powered by React</h3>
                <p>
                  Extend or customize chart components using React. React Spectrum Charts can be
                  extended while reusing the existing components.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
} 