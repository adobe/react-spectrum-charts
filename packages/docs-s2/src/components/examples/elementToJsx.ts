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
import { Children, ReactElement, ReactNode, isValidElement } from 'react';

const SOURCE = Symbol('source');
const IMPORTS = Symbol('imports');

/** Module specifier to named imports, or a string for a default import. */
export type SourceImports = Record<string, string[] | string>;

/**
 * Attaches display source to a function so playground code can show it.
 * @param fn
 * @param source JSX shown in place of the function
 * @param imports extra imports the source needs
 * @returns the same function
 */
export const withSource = <T extends (...args: never[]) => unknown>(
  fn: T,
  source: string,
  imports: SourceImports = {}
): T => Object.assign(fn, { [SOURCE]: source, [IMPORTS]: imports });

const getSource = (value: unknown): string | undefined =>
  typeof value === 'function' ? (value as { [SOURCE]?: string })[SOURCE] : undefined;

const getSourceImports = (value: unknown): SourceImports =>
  (typeof value === 'function' && (value as { [IMPORTS]?: SourceImports })[IMPORTS]) || {};

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

const toJs = (value: unknown): string => {
  if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
  if (Array.isArray(value)) return `[${value.map(toJs).join(', ')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([k, v]) => `${IDENTIFIER.test(k) ? k : toJs(k)}: ${toJs(v)}`);
    return entries.length ? `{ ${entries.join(', ')} }` : '{}';
  }
  return String(value);
};

const indentSource = (source: string, indent: string) => source.split('\n').map((line) => `${indent}${line}`);

type ElementType = string | { displayName?: string; name?: string };

const getName = (type: ElementType) => (typeof type === 'string' ? type : type.displayName ?? type.name ?? 'Unknown');

const MAX_LINE_LENGTH = 80;

const isPrimitive = (value: unknown) => ['string', 'number', 'boolean'].includes(typeof value);

const formatProp = (key: string, value: unknown, identifiers: Map<unknown, string>): string | undefined => {
  const source = getSource(value);
  if (source) return `${key}={${source}}`;
  if (value === undefined || typeof value === 'function') return undefined;
  if (identifiers.has(value)) return `${key}={${identifiers.get(value)}}`;
  if (value === true) return key;
  if (typeof value === 'string') return `${key}="${value}"`;
  return `${key}={${toJs(value)}}`;
};

const toLines = (node: ReactNode, identifiers: Map<unknown, string>, indent: string): string[] => {
  if (!isValidElement(node)) return isPrimitive(node) ? [`${indent}${String(node)}`] : [];
  const element = node as ReactElement<Record<string, unknown>>;
  const name = getName(element.type as ElementType);
  const { children, ...props } = element.props;
  const attrs = Object.entries(props)
    .map(([key, value]) => formatProp(key, value, identifiers))
    .filter((attr): attr is string => attr !== undefined);
  const childSource = getSource(children);
  const childLines = childSource
    ? indentSource(`{${childSource}}`, `${indent}  `)
    : Children.toArray(children as ReactNode).flatMap((child) => toLines(child, identifiers, `${indent}  `));
  const close = childLines.length ? '>' : ' />';
  const singleLine = `${indent}<${[name, ...attrs].join(' ')}${close}`;
  const openLines =
    singleLine.length <= MAX_LINE_LENGTH
      ? [singleLine]
      : [`${indent}<${name}`, ...attrs.map((attr) => `${indent}  ${attr}`), `${indent}${close.trim()}`];
  if (!childLines.length) return openLines;
  return [...openLines, ...childLines, `${indent}</${name}>`];
};

/**
 * Serializes a React element tree into JSX source.
 * @param element
 * @param identifiers values (e.g. datasets) to print as variable names instead of literals
 * @returns JSX string
 */
export const elementToJsx = (element: ReactNode, identifiers: Record<string, unknown> = {}): string => {
  const lookup = new Map(Object.entries(identifiers).map(([name, value]) => [value, name]));
  return toLines(element, lookup, '').join('\n');
};

const collectImports = (node: ReactNode, names: Set<string>, extra: SourceImports) => {
  if (!isValidElement(node)) return;
  const element = node as ReactElement<Record<string, unknown>>;
  if (typeof element.type !== 'string') names.add(getName(element.type as ElementType));
  for (const value of Object.values(element.props)) {
    for (const [from, imported] of Object.entries(getSourceImports(value))) {
      const existing = extra[from];
      extra[from] = typeof imported === 'string' ? imported : [...(Array.isArray(existing) ? existing : []), ...imported];
    }
  }
  Children.forEach(element.props.children as ReactNode, (child) => collectImports(child, names, extra));
};

const formatImport = (names: string[], from: string) => {
  const sorted = [...new Set(names)].sort();
  const singleLine = `import { ${sorted.join(', ')} } from '${from}';`;
  if (singleLine.length <= MAX_LINE_LENGTH) return singleLine;
  return `import {\n${sorted.map((name) => `  ${name},`).join('\n')}\n} from '${from}';`;
};

/**
 * Builds import statements for every component in an element tree.
 * @param element
 * @param from main module specifier
 * @param lab lab module specifier and the component names it exports
 * @returns import statements
 */
export const getImportStatement = (
  element: ReactNode,
  from: string,
  lab?: { from: string; names: Set<string> }
): string => {
  const names = new Set<string>();
  const extra: SourceImports = {};
  collectImports(element, names, extra);
  const labNames = [...names].filter((name) => lab?.names.has(name));
  const mainNames = [...names].filter((name) => !lab?.names.has(name));
  const groups: [string, string[] | string][] = [[from, mainNames], ...Object.entries(extra)];
  if (lab && labNames.length) groups.splice(1, 0, [lab.from, labNames]);
  return groups
    .filter(([, imported]) => imported.length)
    .map(([module, imported]) =>
      typeof imported === 'string' ? `import ${imported} from '${module}';` : formatImport(imported, module)
    )
    .join('\n');
};
