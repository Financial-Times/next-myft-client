/*global describe, it, expect, beforeEach, afterEach*/
/*jshint expr:true*/
'use strict';

const isPersonalisedUrl = require('../../src/lib/is-personalised-url');


describe('identifying personalised URLs', function () {
	it('should identify between personalised urls and not personalised urls', function () {

		expect(isPersonalisedUrl('/myft/3f041222-22b9-4098-b4a6-7967e48fe4f7')).to.be.true;
		expect(isPersonalisedUrl('/myft/my-news/3f041222-22b9-4098-b4a6-7967e48fe4f7')).to.be.true;

		expect(isPersonalisedUrl('/myft/product-tour')).to.be.false;
		expect(isPersonalisedUrl('/myft/my-news/')).to.be.false;
		expect(isPersonalisedUrl('/myft/portfolio/')).to.be.false;
		// ...

	})
});
