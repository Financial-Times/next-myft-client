'use strict';

const puppeteer = require('puppeteer');

// Use Chrome headless
process.env.CHROME_BIN = puppeteer.executablePath();

module.exports = function (karma) {
	karma.set({
		frameworks: [ 'mocha', 'chai', 'browserify', 'webpack' ],
		files: [
			'test/browser/**/*.js'
		],
		webpack: {
			'mode': 'development'
		},
		preprocessors: {
			'test/browser/**/*.js': ['webpack']
		},
		browserify: {
			transform: [['babelify', { presets: ['@babel/preset-es2015'] }], 'textrequireify'],
			debug: true
		},
		browsers: ['Chrome']
	});
};
