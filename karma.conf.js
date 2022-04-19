'use strict';

const puppeteer = require('puppeteer');

// Use Chrome headless
process.env.CHROME_BIN = puppeteer.executablePath();

module.exports = function (karma) {
	karma.set({
		frameworks: [ 'mocha', 'chai', 'browserify' ],
		files: [
			'test/browser/**/*.js'
		],
		preprocessors: {
			'test/browser/**/*.js': ['browserify']
		},
		browserify: {
			transform: [['babelify', {presets: ['env']}], 'debowerify', 'textrequireify'],
			debug: true
		},
		browsers: ['Chrome']
	});
};
