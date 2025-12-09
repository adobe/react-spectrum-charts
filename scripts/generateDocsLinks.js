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
 * @returns {Array<{path: string, name: string, title: string}>}
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
			
			results.push({
				path: relativePath,
				name: item.name,
				title: title,
				category: getCategoryFromPath(relativePath),
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
  --external, -e    Generate external URLs
                    Base URL: ${BASE_URL}
                    (automatically read from docusaurus.config.ts)
  --help, -h        Show this help message

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
	
	// Check for help flag
	if (args.includes('--help') || args.includes('-h')) {
		showHelp();
		return;
	}
	
	// Parse arguments
	let format = 'console';
	let outputFile = null;
	let external = false;
	
	for (const arg of args) {
		if (arg === '--external' || arg === '-e') {
			external = true;
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

if (require.main === module) {
	main();
}

module.exports = { scanDirectory, generateMarkdown, generateJSON, generateConsole, BASE_URL };

