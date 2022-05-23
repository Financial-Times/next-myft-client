'use strict';

module.exports = function (karma) {
	karma.set({
		frameworks: ['mocha', 'chai', 'browserify'],
		files: [
			// CircleCI's Chrome is version 43 at time of writing (no Object.assign support; latest is 47)
			'https://cdn.polyfill.io/v2/polyfill.min.js?callback=ftNextInit&features=default&ua=chrome/43',
			'test/browser/**/*.js'
		],
		preprocessors: {
			'test/browser/**/*.js': ['browserify']
		},
		browserify: {
			transform: [['babelify', { presets: ['@babel/preset-es2015'] }], 'debowerify', 'textrequireify'],
			debug: true
		},
		browsers: ['Chrome']
	});
};
