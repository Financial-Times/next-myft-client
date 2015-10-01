'use strict';

const isPersonalisedUrl = require('./is-personalised-url');

module.exports = function (url) {
	return /^\/(__)?myft\/api\//.test(url) ||
		/^\/(__)?myft\/product-tour/.test(url) ||
		isPersonalisedUrl(url);
};
