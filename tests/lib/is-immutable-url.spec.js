/*global describe, it, expect, beforeEach, afterEach*/
/*jshint expr:true*/
'use strict';

const isImmutableUrl = require('../../src/lib/is-immutable-url');


describe('identifying immutable URLs', function () {
	it('should identify between immutable urls and mutable urls', function () {

		expect(isImmutableUrl('/myft/3f041222-22b9-4098-b4a6-7967e48fe4f7')).to.be.true;
		expect(isImmutableUrl('/myft/my-news/3f041222-22b9-4098-b4a6-7967e48fe4f7')).to.be.true;
		expect(isImmutableUrl('/myft/product-tour')).to.be.true;

		expect(isImmutableUrl('/myft/my-news/')).to.be.false;
		expect(isImmutableUrl('/myft/portfolio/')).to.be.false;
		// ...

	})
});
