/**
 * This file is loaded automatically by Storybook's manager. It will be used to to add a blue banner for the PR-specific Storybook variants.
 */
const urlPattern = /\/react-spectrum-charts\/PR-(\w+)\/$/;
const match = window.location.pathname.match(urlPattern);

if (match) {
	const blueBanner = document.createElement('div');
	blueBanner.style.width = '100%';
	blueBanner.style.backgroundColor = '#066ce7';
	blueBanner.style.textAlign = 'center';
	blueBanner.style.padding = '8px';
	blueBanner.style.color = 'white';

	blueBanner.innerHTML = `This is the Storybook built for <b>PR-${match[1]}</b>, to visit the production version, <a href="https://opensource.adobe.com/react-spectrum-charts/" style="color: white;">click here</a>.`;

	// Add the blue banner to the top of the body
	document.body.insertBefore(blueBanner, document.body.firstChild);
}
