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
import React, { ReactNode } from 'react';

import props from '@docgen/props.json';

import styles from './PropsTable.module.css';

export interface PropDoc {
  name: string;
  type: string;
  defaultValue: string | null;
  required: boolean;
  description: string;
}

export const docs = props as Record<string, { description: string; props: PropDoc[] }>;

export const renderInlineCode = (text: string): ReactNode[] =>
  text
    .split(/(`[^`]+`)/g)
    .map((part, i) => (part.startsWith('`') && part.endsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part));

const formatDefault = (defaultValue: string | null) => {
  if (defaultValue === null) return '–';
  const isLiteral = /^(true|false|null|-?[\d.]+|\[.*\]|\{.*\})$/.test(defaultValue);
  return <code>{isLiteral ? defaultValue : `'${defaultValue}'`}</code>;
};

export interface PropsTableProps {
  /** Component display name, e.g. `Donut`. */
  component: string;
  /** Props to leave out, e.g. internal ones. */
  exclude?: string[];
}

/**
 * Props table generated from the S2 component's TypeScript types.
 * @param props
 * @returns table element
 */
export const PropsTable = ({ component, exclude = [] }: PropsTableProps) => {
  const doc = docs[component];
  if (!doc) throw new Error(`PropsTable: no docgen data for "${component}"`);
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>
          {doc.props
            .filter((prop) => !exclude.includes(prop.name))
            .map((prop) => (
              <tr key={prop.name}>
                <td>
                  <code className={styles.name}>{prop.name}</code>
                  {prop.required && <span className={styles.required}>required</span>}
                  {prop.description && <div className={styles.description}>{renderInlineCode(prop.description)}</div>}
                </td>
                <td>
                  <code className={styles.type}>{prop.type}</code>
                </td>
                <td>{formatDefault(prop.defaultValue)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
