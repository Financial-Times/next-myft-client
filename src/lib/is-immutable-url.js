'use strict';

const isPersonalisedUrl = require('./is-personalised-url');
const isLegacyUrl = require('./is-legacy-url');

module.exports = url => /^\/(__)?myft\/api\//.test(url) ||
	/^\/(__)?myft\/list/.test(url) ||
	isLegacyUrl(url) ||
	isPersonalisedUrl(url);
