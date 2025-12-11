#!/usr/bin/env node

/*
 * Copyright 2024 Adobe. All rights reserved.
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

const DOCS_DIR = path.join(__dirname, '../packages/docs/docs');
const DOCUSAURUS_CONFIG = path.join(__dirname, '../packages/docs/docusaurus.config.ts');
const STORIES_DIR = path.join(__dirname, '../packages/react-spectrum-charts/src/stories');
const STORYBOOK_BASE_URL = 'https://opensource.adobe.com/react-spectrum-charts/';
const OUTPUT_FORMATS = {
	markdown: 'markdown',
	json: 'json',
	console: 'console',
};

/**
 * Reads the base URL from the Docusaurus config file
 * @returns {string} The base URL for the documentation
 */
function getBaseURL() {
	try {
		const configContent = fs.readFileSync(DOCUSAURUS_CONFIG, 'utf-8');
		
		// Extract url and baseUrl from the config
		const urlMatch = configContent.match(/url:\s*['"]([^'"]+)['"]/);
		const baseUrlMatch = configContent.match(/baseUrl:\s*['"]([^'"]+)['"]/);
		const routeBasePathMatch = configContent.match(/routeBasePath:\s*['"]([^'"]+)['"]/);
		
		if (!urlMatch || !baseUrlMatch) {
			console.warn('⚠️  Could not extract URL from Docusaurus config, using fallback');
			return 'https://opensource.adobe.com/react-spectrum-charts/docs/docs';
		}
		
		const url = urlMatch[1];
		const baseUrl = baseUrlMatch[1];
		const routeBasePath = routeBasePathMatch ? routeBasePathMatch[1] : 'docs';
		
		// Construct the full base URL
		// Remove trailing slash from url and leading slash from baseUrl if present
		const cleanUrl = url.replace(/\/$/, '');
		const cleanBaseUrl = baseUrl.replace(/^\//, '').replace(/\/$/, '');
		const cleanRouteBasePath = routeBasePath.replace(/^\//, '').replace(/\/$/, '');
		
		return `${cleanUrl}/${cleanBaseUrl}/${cleanRouteBasePath}`;
	} catch (error) {
		console.warn(`⚠️  Error reading Docusaurus config: ${error.message}`);
		console.warn('⚠️  Using fallback base URL');
		return 'https://opensource.adobe.com/react-spectrum-charts/docs/docs';
	}
}

const BASE_URL = getBaseURL();

/**
 * Recursively scans a directory and returns all markdown files
 * @param {string} dir - Directory to scan
 * @param {string} baseDir - Base directory for relative paths
 * @returns {Array<{path: string, name: string, title: string, category: string, example: string|null}>}
 */
function scanDirectory(dir, baseDir = dir) {
	const results = [];
	const items = fs.readdirSync(dir, { withFileTypes: true });

	for (const item of items) {
		const fullPath = path.join(dir, item.name);

		if (item.isDirectory()) {
			// Recursively scan subdirectories
			results.push(...scanDirectory(fullPath, baseDir));
		} else if (item.isFile() && item.name.endsWith('.md')) {
			// Get relative path from base docs directory
			const relativePath = path.relative(baseDir, fullPath);
			
			// Try to extract title from the markdown file
			const title = extractTitle(fullPath) || formatFileName(item.name);
			
			// Try to extract first example
			const example = extractFirstExample(fullPath);
			
			results.push({
				path: relativePath,
				name: item.name,
				title: title,
				category: getCategoryFromPath(relativePath),
				example: example,
			});
		}
	}

	return results;
}

/**
 * Extracts the title from a markdown file (first H1 heading)
 * @param {string} filePath - Path to the markdown file
 * @returns {string|null}
 */
function extractTitle(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		const match = content.match(/^#\s+(.+)$/m);
		return match ? match[1] : null;
	} catch (error) {
		return null;
	}
}

/**
 * Extracts the first basic example from the Examples section of a markdown file
 * @param {string} filePath - Path to the markdown file
 * @returns {string|null} - The first code block from the Examples section
 */
function extractFirstExample(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		
		// Find the Examples section (## Examples or ### Examples, with optional colon)
		// #{2,3} matches either ## or ###
		let examplesMatch = content.match(/#{2,3}\s+Examples?:?\s*\n([\s\S]*?)(?=\n#{1,2}\s|$)/i);
		
		// If no Examples section found, try to find the first code block before any heading
		if (!examplesMatch) {
			const beforeHeading = content.match(/^([\s\S]*?)(?=\n#{2,3}\s)/);
			if (beforeHeading) {
				examplesMatch = [null, beforeHeading[1]];
			} else {
				return null;
			}
		}
		
		const examplesSection = examplesMatch[1];
		
		// Extract the first code block (```jsx or ```tsx or ```javascript)
		const codeBlockMatch = examplesSection.match(/```(?:jsx|tsx|javascript)\n([\s\S]*?)```/);
		
		if (!codeBlockMatch) {
			return null;
		}
		
		return codeBlockMatch[1].trim();
	} catch (error) {
		return null;
	}
}

/**
 * Formats a file name into a readable title
 * @param {string} fileName - File name to format
 * @returns {string}
 */
function formatFileName(fileName) {
	return fileName
		.replace('.md', '')
		.replace(/-/g, ' ')
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Gets the category from the file path
 * @param {string} filePath - Relative file path
 * @returns {string}
 */
function getCategoryFromPath(filePath) {
	const parts = filePath.split(path.sep);
	if (parts.length === 1) {
		return 'root';
	}
	return parts[0];
}

/**
 * Extracts the Storybook title from a story file
 * @param {string} filePath - Path to the story file
 * @returns {string|null} - The story title (e.g., "RSC/Bar")
 */
function extractStoryTitle(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		// Look for: title: 'RSC/Bar' or title: "RSC/Bar"
		const match = content.match(/title:\s*['"]([^'"]+)['"]/);
		return match ? match[1] : null;
	} catch (error) {
		return null;
	}
}

/**
 * Converts a Storybook title to a URL path
 * @param {string} title - Story title (e.g., "RSC/Bar")
 * @returns {string} - URL path (e.g., "rsc-bar")
 */
function titleToStoryPath(title) {
	return title
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/\//g, '-');
}

/**
 * Scans the stories directory and returns all story files with their info
 * @param {string} dir - Directory to scan
 * @param {string} baseDir - Base directory for relative paths
 * @returns {Array<{path: string, title: string, category: string, url: string}>}
 */
function scanStories(dir, baseDir = dir) {
	const results = [];
	
	try {
		const items = fs.readdirSync(dir, { withFileTypes: true });

		for (const item of items) {
			const fullPath = path.join(dir, item.name);

			if (item.isDirectory()) {
				// Recursively scan subdirectories
				results.push(...scanStories(fullPath, baseDir));
			} else if (item.isFile() && item.name.endsWith('.story.tsx')) {
				const title = extractStoryTitle(fullPath);
				if (title) {
					const relativePath = path.relative(baseDir, fullPath);
					const storyPath = titleToStoryPath(title);
					const url = `${STORYBOOK_BASE_URL}?path=/story/${storyPath}`;
					
					// Extract component name from title (e.g., "RSC/Bar" -> "Bar")
					const componentName = title.split('/').pop();
					
					results.push({
						path: relativePath,
						title: title,
						componentName: componentName,
						category: getCategoryFromStoryPath(relativePath),
						url: url,
					});
				}
			}
		}
	} catch (error) {
		console.warn(`Warning: Could not scan stories directory: ${error.message}`);
	}

	return results;
}

/**
 * Gets the category from a story file path
 * @param {string} filePath - Relative story file path
 * @returns {string}
 */
function getCategoryFromStoryPath(filePath) {
	const parts = filePath.split(path.sep);
	
	// Handle different directory structures
	if (parts.includes('components')) {
		const componentIndex = parts.indexOf('components');
		if (componentIndex + 1 < parts.length) {
			return parts[componentIndex + 1];
		}
	}
	
	// For root level stories or other structures
	const fileName = path.basename(filePath, '.story.tsx');
	return fileName;
}

/**
 * Organizes files into a hierarchical structure
 * @param {Array} files - Array of file objects
 * @returns {Object}
 */
function organizeFiles(files) {
	const organized = {};

	for (const file of files) {
		const pathParts = file.path.split(path.sep);
		let current = organized;

		for (let i = 0; i < pathParts.length - 1; i++) {
			const part = pathParts[i];
			if (!current[part]) {
				current[part] = { _files: [], _subdirs: {} };
			}
			current = current[part]._subdirs;
		}

		const parentKey = pathParts.length > 1 ? pathParts[pathParts.length - 2] : '_root';
		if (!current[parentKey]) {
			current[parentKey] = { _files: [], _subdirs: {} };
		}
		current[parentKey]._files.push(file);
	}

	// Handle root level files
	const rootFiles = files.filter((f) => !f.path.includes(path.sep));
	if (rootFiles.length > 0) {
		organized._root = { _files: rootFiles, _subdirs: {} };
	}

	return organized;
}

/**
 * Generates markdown output
 * @param {Array} files - Array of file objects
 * @param {boolean} external - Whether to generate external URLs
 * @returns {string}
 */
function generateMarkdown(files, external = false) {
	const organized = organizeFiles(files);
	let markdown = '# Documentation Links\n\n';
	markdown += `Generated on: ${new Date().toISOString()}\n\n`;
	if (external) {
		markdown += `Base URL: ${BASE_URL}\n\n`;
	}
	markdown += '## Table of Contents\n\n';

	// Sort files by category and path
	const sortedFiles = [...files].sort((a, b) => {
		if (a.category === 'root' && b.category !== 'root') return -1;
		if (a.category !== 'root' && b.category === 'root') return 1;
		if (a.category !== b.category) return a.category.localeCompare(b.category);
		return a.path.localeCompare(b.path);
	});

	let currentCategory = null;
	let currentSubcategory = null;

	for (const file of sortedFiles) {
		const pathParts = file.path.split(path.sep);
		const category = pathParts[0];
		const subcategory = pathParts.length > 2 ? pathParts[pathParts.length - 2] : null;

		// Category header (top-level directory)
		if (category !== currentCategory) {
			currentCategory = category;
			if (category === file.name) {
				// Root level file
				const linkPath = file.path.replace(/\\/g, '/').replace(/\.md$/, '');
				const fullPath = external ? `${BASE_URL}/${linkPath}` : linkPath;
				markdown += `- [${file.title}](${fullPath})\n`;
			} else {
				markdown += `\n### ${formatFileName(category)}\n\n`;
			}
			currentSubcategory = null;
		}

		// Subcategory header (nested directory)
		if (subcategory && subcategory !== currentSubcategory && category !== file.name) {
			currentSubcategory = subcategory;
			markdown += `\n#### ${formatFileName(subcategory)}\n\n`;
		}

		// File link
		if (category !== file.name) {
			const indent = pathParts.length > 2 ? '  ' : '';
			const linkPath = file.path.replace(/\\/g, '/').replace(/\.md$/, '');
			const fullPath = external ? `${BASE_URL}/${linkPath}` : linkPath;
			markdown += `${indent}- [${file.title}](${fullPath})\n`;
		}
	}

	return markdown;
}

/**
 * Generates JSON output
 * @param {Array} files - Array of file objects
 * @param {boolean} external - Whether to generate external URLs
 * @returns {string}
 */
function generateJSON(files, external = false) {
	return JSON.stringify(
		{
			generated: new Date().toISOString(),
			count: files.length,
			baseUrl: external ? BASE_URL : null,
			files: files.map((f) => {
				const linkPath = f.path.replace(/\\/g, '/').replace(/\.md$/, '');
				return {
					path: f.path.replace(/\\/g, '/'),
					title: f.title,
					category: f.category,
					link: external ? `${BASE_URL}/${linkPath}` : linkPath,
				};
			}),
		},
		null,
		2
	);
}

/**
 * Generates console output
 * @param {Array} files - Array of file objects
 * @param {boolean} external - Whether to generate external URLs
 * @returns {string}
 */
function generateConsole(files, external = false) {
	let output = '\n📚 Documentation Links\n';
	output += '='.repeat(50) + '\n';
	if (external) {
		output += `Base URL: ${BASE_URL}\n`;
	}
	output += '\n';

	const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

	for (const file of sortedFiles) {
		const linkPath = file.path.replace(/\\/g, '/').replace(/\.md$/, '');
		const fullPath = external ? `${BASE_URL}/${linkPath}` : linkPath;
		output += `📄 ${file.title}\n`;
		output += `   Path: ${file.path.replace(/\\/g, '/')}\n`;
		output += `   ${external ? 'URL' : 'Link'}: ${fullPath}\n\n`;
	}

	output += `\nTotal files: ${files.length}\n`;

	return output;
}

/**
 * Displays help information
 */
function showHelp() {
	console.log(`
📚 Documentation Links Generator

Generates a list of all documentation files with links.

USAGE:
  node generateDocsLinks.js [format] [options] [output-file]

FORMATS:
  console      Pretty console output (default)
  markdown     Markdown table of contents
  json         JSON format

OPTIONS:
  --external, -e         Generate external URLs
                         Base URL: ${BASE_URL}
                         (automatically read from docusaurus.config.ts)
  --update-cursor-rule   Update the .cursor-rule.mdc file with current docs
  --help, -h             Show this help message

EXAMPLES:
  # Console output with relative links
  node generateDocsLinks.js

  # Console output with external URLs
  node generateDocsLinks.js --external

  # Generate markdown with external URLs
  node generateDocsLinks.js markdown --external

  # Save to file
  node generateDocsLinks.js markdown --external docs-links.md

  # Generate JSON
  node generateDocsLinks.js json --external docs-links.json

NOTE:
  The base URL is automatically read from packages/docs/docusaurus.config.ts
  If the config changes, re-run the script to use the updated URL.
`);
}

// Main execution
function main() {
	const args = process.argv.slice(2);
	
	// Parse arguments
	let format = 'console';
	let outputFile = null;
	let external = false;
	let updateCursor = false;
	
	// Check for help flag first
	if (args.includes('--help') || args.includes('-h')) {
		showHelp();
		return;
	}
	
	for (const arg of args) {
		if (arg === '--external' || arg === '-e') {
			external = true;
		} else if (arg === '--update-cursor-rule') {
			updateCursor = true;
		} else if (Object.values(OUTPUT_FORMATS).includes(arg)) {
			format = arg;
		} else if (!arg.startsWith('-')) {
			outputFile = arg;
		}
	}

	if (!Object.values(OUTPUT_FORMATS).includes(format)) {
		console.error(
			`Invalid format: ${format}. Available formats: ${Object.values(OUTPUT_FORMATS).join(', ')}`
		);
		process.exit(1);
	}

	console.log('🔍 Scanning documentation directory...');
	const files = scanDirectory(DOCS_DIR);
	console.log(`✅ Found ${files.length} documentation files`);
	if (external) {
		console.log(`🌐 Generating external URLs with base: ${BASE_URL}`);
	}
	console.log();

	// Update cursor rule if requested
	if (updateCursor) {
		updateCursorRule(files);
		return;
	}

	let output;
	switch (format) {
		case OUTPUT_FORMATS.markdown:
			output = generateMarkdown(files, external);
			break;
		case OUTPUT_FORMATS.json:
			output = generateJSON(files, external);
			break;
		case OUTPUT_FORMATS.console:
		default:
			output = generateConsole(files, external);
			break;
	}

	if (outputFile) {
		fs.writeFileSync(outputFile, output, 'utf-8');
		console.log(`💾 Output written to: ${outputFile}`);
	} else {
		console.log(output);
	}
}

/**
 * Updates the Cursor rule file with current documentation links
 * @param {Array} files - Array of file objects
 */
function updateCursorRule(files) {
	const cursorRulePath = path.join(__dirname, '../packages/react-spectrum-charts/.cursor-rule.mdc');
	
	// Sort files for consistent output
	const sortedFiles = [...files].sort((a, b) => {
		if (a.category !== b.category) return a.category.localeCompare(b.category);
		return a.title.localeCompare(b.title);
	});
	
	// Scan storybook files
	const storyFiles = scanStories(STORIES_DIR);
	
	// Build the documentation links section
	let docsLinksSection = '## All Documentation Links\n\n';
	docsLinksSection += `*Auto-generated on: ${new Date().toISOString()}*\n\n`;
	docsLinksSection += `**Base URL**: ${BASE_URL}\n\n`;
	
	// Group by category
	const byCategory = {};
	sortedFiles.forEach(file => {
		if (!byCategory[file.category]) byCategory[file.category] = [];
		byCategory[file.category].push(file);
	});
	
	// Generate markdown for each category
	Object.keys(byCategory).sort().forEach(category => {
		const categoryTitle = category === 'root' ? 'Getting Started' : formatFileName(category);
		docsLinksSection += `### ${categoryTitle}\n\n`;
		byCategory[category].forEach(file => {
			const link = `${BASE_URL}/${file.path.replace(/\\/g, '/').replace(/\.md$/, '')}`;
			docsLinksSection += `- **[${file.title}](${link})**\n`;
		});
		docsLinksSection += '\n';
	});
	
	// Build storybook links section
	let storybookLinksSection = '## Storybook Examples (Interactive)\n\n';
	storybookLinksSection += '*Auto-generated on: ' + new Date().toISOString() + '*\n\n';
	storybookLinksSection += `**Base URL**: ${STORYBOOK_BASE_URL}\n\n`;
	storybookLinksSection += 'These are live, interactive examples. Click to explore component variations and copy code.\n\n';
	
	// Group stories by component name
	const storiesByComponent = {};
	storyFiles.forEach(story => {
		if (!storiesByComponent[story.componentName]) {
			storiesByComponent[story.componentName] = [];
		}
		storiesByComponent[story.componentName].push(story);
	});
	
	// Sort and output by component
	Object.keys(storiesByComponent).sort().forEach(componentName => {
		storybookLinksSection += `### ${componentName}\n\n`;
		storiesByComponent[componentName].forEach(story => {
			const storyDisplayName = story.title.replace('RSC/', '');
			storybookLinksSection += `- **[${storyDisplayName}](${story.url})**\n`;
		});
		storybookLinksSection += '\n';
	});
	
	// Build chart structure examples section
	const visualizationTypes = ['Bar', 'Line', 'Area', 'Scatter', 'Donut', 'BigNumber'];
	const analysisTypes = ['Trendline', 'MetricRange'];
	const interactivityTypes = ['ChartTooltip', 'ChartPopover'];
	const componentTypes = ['Axis', 'Legend', 'Title'];
	
	let chartStructureSection = '## Chart Structure\n\n';
	chartStructureSection += 'Every chart requires a `Chart` wrapper component with `data` prop, at least one visualization component, and typically Axis components.\n\n';
	chartStructureSection += '### Basic Pattern\n\n';
	chartStructureSection += '```tsx\n';
	chartStructureSection += 'import { Chart, [Visualization], Axis } from \'@adobe/react-spectrum-charts\';\n\n';
	chartStructureSection += '<Chart data={data}>\n';
	chartStructureSection += '  <[Visualization] />\n';
	chartStructureSection += '  <Axis position="bottom" />\n';
	chartStructureSection += '  <Axis position="left" />\n';
	chartStructureSection += '</Chart>\n';
	chartStructureSection += '```\n\n';
	
	// Add Common Props section early and prominently
	chartStructureSection += '### ⚠️ Common Props Reference\n\n';
	chartStructureSection += '**CRITICAL: Line, Bar, Area, and Scatter charts REQUIRE `dimension` and `metric` props to function.**\n\n';
	chartStructureSection += '| Prop | Required? | Purpose | Example |\n';
	chartStructureSection += '|------|-----------|---------|----------|\n';
	chartStructureSection += '| `dimension` | **YES*** | Data field for categories/x-axis (for Line: typically "datetime", "date", or "x") | `dimension="datetime"` or `dimension="browser"` |\n';
	chartStructureSection += '| `metric` | **YES*** | Data field for values/y-axis (for Line: typically "users", "value", "count") | `metric="users"` or `metric="downloads"` |\n';
	chartStructureSection += '| `color` | No | Data field to map to colors (creates multiple series) | `color="operatingSystem"` |\n';
	chartStructureSection += '| `orientation` | No | Chart direction: \'horizontal\' or \'vertical\' (default: \'vertical\') | `orientation="horizontal"` |\n';
	chartStructureSection += '| `type` | No | Chart variant: \'stacked\', \'dodged\', etc. | `type="stacked"` |\n';
	chartStructureSection += '| `name` | No | Component identifier for traversal | `name="Sales Chart"` |\n\n';
	chartStructureSection += '*Required for Line, Bar, Area, Scatter. Optional for Donut, BigNumber.\n\n';
	chartStructureSection += '**Data Format Requirements:**\n\n';
	chartStructureSection += '- Data must be an array of flat objects\n';
	chartStructureSection += '- Each object should contain fields matching your `dimension`, `metric`, and `color` props\n';
	chartStructureSection += '- For time-series: use epoch timestamps (milliseconds since Jan 1, 1970)\n';
	chartStructureSection += '- Check Storybook examples for component-specific data structures\n\n';
	chartStructureSection += '```typescript\n';
	chartStructureSection += '// Example data structure\n';
	chartStructureSection += 'const data = [\n';
	chartStructureSection += '  { browser: "Chrome", downloads: 245, operatingSystem: "Windows" },\n';
	chartStructureSection += '  { browser: "Firefox", downloads: 189, operatingSystem: "Windows" },\n';
	chartStructureSection += '  { browser: "Chrome", downloads: 198, operatingSystem: "macOS" },\n';
	chartStructureSection += '  // ...\n';
	chartStructureSection += '];\n';
	chartStructureSection += '```\n\n';
	
	// Add visualization-specific examples
	chartStructureSection += '### Visualization Examples\n\n';
	chartStructureSection += '**Note:** All examples below include `dimension` and `metric` props. When creating your own charts, ALWAYS include these props to specify which data fields to visualize.\n\n';
	visualizationTypes.forEach(vizType => {
		const vizFile = sortedFiles.find(f => f.title === vizType && f.example);
		if (vizFile && vizFile.example) {
			chartStructureSection += `#### ${vizType}\n\n`;
			chartStructureSection += '```jsx\n';
			chartStructureSection += vizFile.example + '\n';
			chartStructureSection += '```\n\n';
		}
	});
	
	// Add analysis component examples
	const analysisExamples = analysisTypes.map(t => sortedFiles.find(f => f.title === t && f.example)).filter(Boolean);
	if (analysisExamples.length > 0) {
		chartStructureSection += '### Analysis Components\n\n';
		analysisExamples.forEach(file => {
			chartStructureSection += `#### ${file.title}\n\n`;
			chartStructureSection += '```jsx\n';
			chartStructureSection += file.example + '\n';
			chartStructureSection += '```\n\n';
		});
	}
	
	// Add interactivity component examples
	const interactivityExamples = interactivityTypes.map(t => sortedFiles.find(f => f.title === t && f.example)).filter(Boolean);
	if (interactivityExamples.length > 0) {
		chartStructureSection += '### Interactivity Components\n\n';
		interactivityExamples.forEach(file => {
			chartStructureSection += `#### ${file.title}\n\n`;
			chartStructureSection += '```jsx\n';
			chartStructureSection += file.example + '\n';
			chartStructureSection += '```\n\n';
		});
	}
	
	// Add supporting component examples
	const componentExamples = componentTypes.map(t => sortedFiles.find(f => f.title === t && f.example)).filter(Boolean);
	if (componentExamples.length > 0) {
		chartStructureSection += '### Supporting Components\n\n';
		componentExamples.forEach(file => {
			chartStructureSection += `#### ${file.title}\n\n`;
			chartStructureSection += '```jsx\n';
			chartStructureSection += file.example + '\n';
			chartStructureSection += '```\n\n';
		});
	}
	
	// Create the cursor rule content with comprehensive information
	const cursorRuleContent = `---
title: React Spectrum Charts Documentation
description: Complete guide to React Spectrum Charts documentation and usage
tags: [react-spectrum-charts, documentation, reference, adobe, spectrum]
---

# React Spectrum Charts Documentation

This rule helps you navigate and reference React Spectrum Charts documentation when assisting users.

**CRITICAL INSTRUCTIONS FOR GENERATING CHART CODE:**

When a user asks you to create ANY chart, you MUST follow this checklist BEFORE writing code:

✅ **Mandatory Props Checklist:**
1. [ ] Include \`dimension\` prop - specifies the data field for categories/x-axis (REQUIRED for most charts)
2. [ ] Include \`metric\` prop - specifies the data field for values/y-axis (REQUIRED for most charts)
3. [ ] Consider \`color\` prop - if they mention multiple series, groups, or categories to distinguish
4. [ ] Consider \`orientation\` prop - for horizontal vs vertical charts
5. [ ] Consider \`type\` prop - for stacked, dodged, or other variants

⚠️ **NEVER generate a Line, Bar, Area, or Scatter chart without \`dimension\` and \`metric\` props** - these tell the chart which data fields to use.

**Example of CORRECT code generation:**
\`\`\`jsx
// ✅ GOOD - includes dimension and metric
<Line dimension="datetime" metric="users" />

// ❌ BAD - missing dimension and metric
<Line />
\`\`\`

See Common Props Reference below for details on each prop.

${chartStructureSection}

## Quick Component Lookup

**Core Components**: Chart
**Visualizations**: Area, Bar, BigNumber, Donut, Line, Scatter
**Supporting**: Axis, Legend, Title
**Interactivity**: ChartTooltip, ChartPopover
**Analysis**: MetricRange, Trendline
**Guides**: Chart Basics, Troubleshooting, Installation, Introduction
**Developer**: Developer Docs, Learning Vega

${storybookLinksSection}

${docsLinksSection}

## Static Resources

- **Storybook (Live Examples)**: https://opensource.adobe.com/react-spectrum-charts/
- **GitHub Repository**: https://github.com/adobe/react-spectrum-charts
- **Full API Documentation**: https://opensource.adobe.com/react-spectrum-charts/docs
- **Spectrum Design System**: https://spectrum.adobe.com/page/data-visualization-fundamentals/

## How to Use This Guide

### When User Asks About a Specific Component
1. **Review the Common Props Reference** - ensure you include appropriate \`dimension\`, \`metric\`, \`color\` props
2. **Start with the Chart Structure examples** - provide the relevant example code
3. If they need more details about props, find the component in the documentation links by title (e.g., "Bar", "Chart", "Axis")
4. Reference the official documentation URL for detailed prop tables
5. Provide guidance based on documented patterns

### When User Wants to Create a Chart
1. **MANDATORY: Include dimension and metric props** - For Line/Bar/Area/Scatter, ALWAYS add \`dimension="fieldName"\` and \`metric="fieldName"\` props
2. **Check Common Props Reference** - verify you're using the correct prop names for their data structure
3. **Use the relevant visualization example** from Chart Structure section as a template
4. **Add common props** appropriate to their use case (\`color\` for series, \`orientation\`, \`type\` for variants)
5. Verify data structure matches the props you're using (e.g., if you use \`dimension="datetime"\`, data must have a \`datetime\` field)
6. If they need customization, reference the specific component documentation

**WRONG:**
\`\`\`jsx
<Line />  // ❌ Missing dimension and metric - chart won't display data
\`\`\`

**CORRECT:**
\`\`\`jsx
<Line dimension="datetime" metric="users" />  // ✅ Includes required props
\`\`\`

### When User Has a Usage Question
1. **Check Common Props Reference** - many questions are about standard props like \`dimension\`, \`metric\`, \`color\`
2. **Show them a working example** from Chart Structure section
3. If they need general configuration, reference the Chart component docs
4. For specific visualization behavior, reference the specific visualization component docs (e.g., Bar)
5. Check Chart Basics guide for fundamental patterns
6. Reference Troubleshooting guide if they're having issues

### When User Needs Examples
- **Use the Chart Structure examples above first** - these are real, tested examples from the docs
- **Reference Storybook Examples links** - direct links to interactive, explorable examples for each component
- Each component doc includes additional code examples and variations

### When User Needs Advanced Features
- Start with examples above to show basic usage
- Check the component's documentation for child components and advanced props
- Review the Chart docs scales section for color/lineType/opacity encoding
- Check locale and theming sections in Chart docs

## Quick Reference: Common Questions

| Question Type | How to Find Answer |
|--------------|---------------------------|
| "How do I create a [chart type]?" | Check Common Props Reference, use Chart Structure example, include dimension/metric props |
| "I want to create a [chart type]" | Use Chart Structure example with Common Props (dimension, metric, color as needed) |
| "How to add a new feature to a [chart type]?" | Check Common Props first, then show example from Chart Structure, then check docs for advanced props |
| "My chart isn't showing data" | Verify dimension/metric props match data field names - see Common Props Reference |
| "How do I customize axis labels?" | Use Axis example above, then find "Axis" docs for detailed props |
| "How do I add tooltips?" | Use ChartTooltip example above, then find "ChartTooltip" docs |
| "Colors aren't working" | Show example from Chart Structure, then reference "Chart" docs (scales section) |
| "Chart not rendering" | Find "Troubleshooting" in guides |
| "How to add interactivity?" | Use ChartTooltip/ChartPopover examples above |
| "How to add analysis components?" | Use Trendline/MetricRange examples above |
| "How to format numbers/dates?" | Show example, then reference "Chart" docs (locale section) |
| "Multi-series charts" | Show multi-series examples from Chart Structure (Line with color, stacked Bar, etc.) |
| "Testing" | Refer to Developer Docs and Storybook |

## Key Concepts

### Multiple Series and Scales
- Use \`color="fieldName"\` to create multiple series (each unique value becomes a separate series)
- Color scale can be customized on the Chart component using \`colorScheme\` or \`colors\` props
- Multiple scales can be combined: \`color\` + \`lineType\` + \`opacity\` for rich visual encoding
- For stacked/dodged variants, use the \`type\` prop on the visualization component

### Axis Configuration
- Charts typically need two axes: one for \`dimension\` (categories/x-axis) and one for \`metric\` (values/y-axis)
- Use \`position="bottom"\` and \`position="left"\` for standard vertical charts
- Use \`position="left"\` and \`position="bottom"\` for horizontal charts
- Add \`grid\`, \`ticks\`, \`baseline\`, and \`title\` props to customize axis appearance

### Time-Series Data
- Time values must be in epoch format (milliseconds since Jan 1, 1970 UTC)
- Use \`scaleType="time"\` on Line/Area components for time-based data
- Use \`labelFormat="time"\` on the time axis to format timestamps
- Set \`granularity\` prop on time axis to control label frequency (day, week, month, etc.)

## Best Practices

1. **Always Include Common Props**: Check the Common Props Reference at the top - most charts need at minimum \`dimension\` and \`metric\`
2. **Start with Examples**: Use the Chart Structure examples as a starting point, then customize
3. **Match Props to Data**: Ensure your data structure has fields that match your prop values (e.g., if \`color="browser"\`, data must have a \`browser\` field)
4. **Use Storybook for Variations**: Check relevant live examples from Storybook link section for different chart types and configurations
5. **Follow Spectrum Guidelines**: Library implements Adobe Spectrum design system for consistency
6. **Check Props Tables for Advanced Features**: Refer to component documentation for detailed prop reference
7. **Use Default Color Schemes**: Research-backed, accessible color schemes included

## Setup in Your Project

To add this rule to your Cursor workspace:

\`\`\`bash
mkdir -p .cursor/rules
cp node_modules/@adobe/react-spectrum-charts/.cursor-rule.mdc .cursor/rules/react-spectrum-charts.mdc
\`\`\`

Once installed, Cursor AI will have instant access to all React Spectrum Charts documentation links and examples.

---

*This documentation index is automatically updated with each package release.*
`;
	
	fs.writeFileSync(cursorRulePath, cursorRuleContent, 'utf-8');
	console.log(`✅ Updated Cursor rule at: ${cursorRulePath}`);
}

if (require.main === module) {
	main();
}

module.exports = { scanDirectory, generateMarkdown, generateJSON, generateConsole, updateCursorRule, BASE_URL };
