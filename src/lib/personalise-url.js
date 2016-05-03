'use strict';

const isImmutableUrl = require('./is-immutable-url');
const isValidUuid = require('./is-valid-uuid');

module.exports = function (url, userId) {
	if (isImmutableUrl(url)) {
		return url;
	}

	if(!userId || !userId.length || !isValidUuid(userId)) {
		throw new Error('Invalid user uuid: ' + userId);
	}

	return url.replace(/myft(?:\/([a-zA-z\-]*))?(\/.[^$\/])?\/?/, function ($0, $1, $2) {
		return 'myft/' + ($1 ? $1 + '/' : '') + userId + ($2 || '');
	});
};
