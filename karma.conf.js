'use strict';

module.exports = function(karma) {
	karma.set({
		frameworks: [ 'mocha', 'chai', 'browserify' ],
		files: [
			// CircleCI's Chrome is version 43 at time of writing (no Object.assign support; latest is 47)
			'https://cdn.polyfill.io/v2/polyfill.min.js?callback=ftNextInit&features=default&ua=chrome/43',
			'tests/**/*.js'
		],
		preprocessors: {
			'tests/**/*.js': ['browserify']
		},
		browserify: {
				transform: ['babelify', 'debowerify', 'textrequireify'],
				debug: true
		},
		browsers: ['Chrome']
	});
};
