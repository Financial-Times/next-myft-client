'use strict';

const isImmutableUrl = require('./is-immutable-url');

module.exports = function (url, uuid) {
	if (isImmutableUrl(url)) {
		return url;
	}

	if(!uuid || !uuid.length) {
		throw new Error('invalid user uuid: ' + uuid);
	}

	return url.replace(/myft(?:\/([a-zA-z\-]*))?(\/.[^$\/])?\/?/, function ($0, $1, $2) {
		return 'myft/' + ($1 ? $1 + '/' : '') + uuid + ($2 || '');
	});
};
