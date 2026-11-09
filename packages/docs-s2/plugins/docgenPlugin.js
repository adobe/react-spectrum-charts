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
const fs = require('fs');
const path = require('path');
const docgen = require('react-docgen-typescript');

const s2Root = path.resolve(__dirname, '../../react-spectrum-charts-s2');
const componentDirs = ['src/components', 'src/lab/components'].map((dir) => path.join(s2Root, dir));

const listComponentFiles = (dir) =>
  fs
    .readdirSync(dir, { recursive: true })
    .filter((file) => /^[A-Z]\w*\.tsx$/.test(path.basename(file)))
    .map((file) => path.join(dir, file));

const formatChildren = (raw) => raw.replace(/^Children<(.*)>( \| undefined)?$/, '$1').replace(/(\w+)Element\b/g, '$1');

const shortenUnion = (text) => {
  if (text.length <= 80) return text;
  const members = text.replace(/ \| \.\.\. \d+ more \.\.\.$/, '').split(' | ');
  return `${members.slice(0, 4).join(' | ')} | …`;
};

const formatType = ({ name, type }) => {
  if (name === 'children') return formatChildren(type.name);
  if (type.name === 'enum' && Array.isArray(type.value)) {
    if (type.value.length > 6 && type.raw) return type.raw;
    return type.value.map((option) => option.value).join(' | ');
  }
  return shortenUnion(type.raw && type.raw.length < 80 ? type.raw : type.name);
};

const DEFAULT_SENTENCE = /\s*Defaults to `([^`]+)`(?:\.|$)/;

/** Moves a "Defaults to `x`." sentence out of a prop description so the table can show it in its own column. */
const splitDefault = (description) => {
  const match = description.match(DEFAULT_SENTENCE);
  if (!match) return { description, defaultValue: null };
  return { description: description.replace(DEFAULT_SENTENCE, '').trim(), defaultValue: match[1] };
};

/** Parses S2 component props from TypeScript so docs tables stay in sync with the source. */
const parseComponents = () => {
  const parser = docgen.withCustomConfig(path.join(s2Root, 'tsconfig.json'), {
    shouldExtractLiteralValuesFromEnum: true,
    shouldRemoveUndefinedFromOptional: true,
    savePropValueAsString: true,
    skipChildrenPropWithoutDoc: false,
    propFilter: (prop) => !prop.parent?.fileName.includes('node_modules'),
  });
  const files = [path.join(s2Root, 'src/Chart.tsx')].concat(
    componentDirs.filter((dir) => fs.existsSync(dir)).flatMap(listComponentFiles)
  );
  const components = {};
  for (const doc of parser.parse(files)) {
    if (!Object.keys(doc.props).length || components[doc.displayName]) continue;
    components[doc.displayName] = {
      description: doc.description,
      props: Object.values(doc.props)
        .filter((prop) => !prop.description.startsWith('Internal:'))
        .map((prop) => {
          const { description, defaultValue } = splitDefault(prop.description);
          return {
            name: prop.name,
            type: formatType(prop),
            defaultValue: prop.defaultValue?.value ?? defaultValue,
            required: prop.required,
            description: description || (prop.name === 'children' ? 'Supported child components.' : ''),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }
  return components;
};

module.exports = function docgenPlugin(context) {
  const outFile = path.join(context.generatedFilesDir, 'docgen', 'props.json');
  return {
    name: 's2-docgen',
    getPathsToWatch: () =>
      componentDirs.map((dir) => path.join(dir, '**/*.tsx')).concat(path.join(s2Root, 'src/types/**/*.ts')),
    async loadContent() {
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, JSON.stringify(parseComponents()));
    },
    configureWebpack: () => ({ resolve: { alias: { '@docgen/props.json': outFile } } }),
  };
};
