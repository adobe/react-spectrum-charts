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
const cheerio = require('cheerio');
const TurndownService = require('turndown');
const { gfm } = require('turndown-plugin-gfm');

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
turndown.use(gfm);
// Table cells must stay on one line in GFM.
turndown.addRule('tableCellBlocks', {
  filter: (node) => node.nodeName === 'DIV' && node.parentNode?.nodeName === 'TD',
  replacement: (content) => ` — ${content.trim()}`,
});

/**
 * Converts a built doc page to Markdown; playgrounds become their default code and a list of their controls.
 * @param html
 * @param problems collects content the export lost, so the build can fail on it
 * @returns markdown string
 */
const htmlToMarkdown = (html, problems = []) => {
  const $ = cheerio.load(html);
  const article = $('.theme-doc-markdown').first();
  article.find('.hash-link, button, nav, [data-web-only]').remove();
  article.find('a[aria-label$=" stage"]').each((_, badge) => {
    const stage = $(badge)
      .attr('aria-label')
      .replace(/ stage$/, '');
    $(badge).replaceWith(`<p><strong>Stage:</strong> ${stage}</p>`);
  });
  article.find('.theme-code-block').each((_, block) => {
    const language = ($(block).attr('class') ?? '').match(/language-(\w+)/)?.[1] ?? '';
    const lines = $(block)
      .find('.token-line')
      .map((__, line) => $(line).text())
      .get();
    const pre = $('<pre></pre>');
    pre.append($('<code></code>').addClass(`language-${language}`).text(lines.join('\n')));
    $(block).replaceWith(pre);
  });
  article.find('.theme-admonition').each((_, admonition) => {
    const title = $(admonition).find('[class*="admonitionHeading"]').text().trim();
    const content = $(admonition).find('[class*="admonitionContent"]').html() ?? '';
    const label = title.charAt(0).toUpperCase() + title.slice(1);
    $(admonition).replaceWith(`<blockquote><p><strong>${label}:</strong></p>${content}</blockquote>`);
  });
  article.find('td code').each((_, code) => {
    $(code).text($(code).text().replaceAll('|', '\\|'));
  });
  article.find('[class*="playground_"]').each((_, playground) => {
    const code = $(playground)
      .find('pre')
      .filter((__, pre) => $(pre).closest('[data-markdown-only]').length === 0)
      .first();
    if (code.length === 0) problems.push('an example has no code block');
    $(playground).replaceWith([code, ...$(playground).find('[data-markdown-only]')]);
  });
  article.find('.tabs-container').each((_, tabs) => {
    const labels = $(tabs)
      .find('[role="tab"]')
      .map((__, tab) => $(tab).text().trim())
      .get();
    const panels = $(tabs)
      .find('[role="tabpanel"]')
      .map((index, panel) => `<p><strong>${labels[index]}:</strong></p>${$(panel).html()}`)
      .get();
    $(tabs).replaceWith(panels.join(''));
  });
  article.find('[data-markdown-only]').each((_, element) => {
    $(element).replaceWith($(element).html());
  });
  return `${turndown.turndown(article.html() ?? '').trim()}\n`;
};

/**
 * Finds headings with nothing under them before the next heading of the same or higher level.
 * @param markdown
 * @returns problem descriptions
 */
const findEmptySections = (markdown) => {
  const headings = [...markdown.matchAll(/^(#{2,6}) (.+)$/gm)];
  return headings
    .filter((heading, index) => {
      const next = headings.slice(index + 1).find((other) => other[1].length <= heading[1].length);
      const body = markdown.slice(heading.index + heading[0].length, next?.index ?? markdown.length);
      return body.trim() === '';
    })
    .map((heading) => `"${heading[2]}" has no content`);
};

/** Flattens a docs sidebar into doc ids in display order. */
const flattenSidebar = (items) =>
  items.flatMap((item) => {
    if (item.type === 'doc') return [item.id];
    if (item.type === 'category')
      return [...(item.link?.type === 'doc' ? [item.link.id] : []), ...flattenSidebar(item.items)];
    return [];
  });

/** Emits a Markdown copy of every doc page plus llms.txt and llms-full.txt for AI tools. */
/** Strips frontmatter and import lines from MDX source. */
const mdxToMarkdown = (source) =>
  source
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/^import .*\n/gm, '')
    .trimStart();

/**
 * Dev-server middleware that serves a page's MDX source at its `.md` URL, since `.md` files are
 * only generated at build time.
 */
const getDevMarkdownMiddleware = (context) => (request, response, next) => {
  const docsBase = `${context.siteConfig.baseUrl}docs/`;
  const url = request.path ?? request.url.split('?')[0];
  if (!url.startsWith(docsBase) || !url.endsWith('.md')) return next();
  const file = path.join(context.siteDir, 'docs', `${url.slice(docsBase.length, -3)}.mdx`);
  if (!fs.existsSync(file)) return next();
  response.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  return response.end(mdxToMarkdown(fs.readFileSync(file, 'utf8')));
};

module.exports = function llmsPlugin(context) {
  return {
    name: 's2-llms',
    configureWebpack(_config, isServer) {
      if (isServer || process.env.NODE_ENV !== 'development') return {};
      let evalSourceMap;
      try {
        evalSourceMap = require('@docusaurus/core/lib/commands/utils/legacy/evalSourceMapMiddleware').default;
      } catch {
        evalSourceMap = undefined;
      }
      return {
        devServer: {
          setupMiddlewares: (middlewares, devServer) => {
            middlewares.unshift(getDevMarkdownMiddleware(context));
            if (evalSourceMap) middlewares.unshift(evalSourceMap(devServer));
            return middlewares;
          },
        },
      };
    },
    async postBuild({ outDir, plugins }) {
      const { siteConfig } = context;
      const docsPlugin = plugins.find((plugin) => plugin.name === 'docusaurus-plugin-content-docs');
      const version = docsPlugin.content.loadedVersions[0];
      const docsById = new Map(version.docs.map((doc) => [doc.id, doc]));
      const orderedIds = Object.values(version.sidebars).flatMap(flattenSidebar);
      const ids = [...new Set([...orderedIds, ...docsById.keys()])];
      const siteUrl = `${siteConfig.url}${siteConfig.baseUrl}`;

      const exportProblems = [];
      const pages = ids.map((id) => {
        const doc = docsById.get(id);
        const route = doc.permalink.slice(siteConfig.baseUrl.length);
        const html = fs.readFileSync(path.join(outDir, route, 'index.html'), 'utf8');
        const problems = [];
        const markdown = htmlToMarkdown(html, problems);
        problems.push(...findEmptySections(markdown));
        if (problems.length) exportProblems.push(`${doc.source}: ${problems.join('; ')}`);
        fs.writeFileSync(path.join(outDir, `${route}.md`), markdown);
        return { doc, url: `${siteUrl}${route}.md`, markdown };
      });
      if (exportProblems.length) {
        throw new Error(
          `Markdown export is missing content. Client-only content needs a markdown prop on ClientOnly:\n${exportProblems.join(
            '\n'
          )}`
        );
      }

      const index = [
        `# ${siteConfig.title}`,
        '',
        `> ${siteConfig.tagline}`,
        '',
        '## Docs',
        '',
        ...pages.map(({ doc, url }) => `- [${doc.title}](${url})${doc.description ? `: ${doc.description}` : ''}`),
        '',
      ].join('\n');
      fs.writeFileSync(path.join(outDir, 'llms.txt'), index);
      fs.writeFileSync(path.join(outDir, 'llms-full.txt'), pages.map(({ markdown }) => markdown).join('\n---\n\n'));
    },
  };
};
