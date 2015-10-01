/*global describe, it, expect, beforeEach, afterEach*/
/*jshint expr:true*/
'use strict';

const personaliseUrl = require('../../src/lib/personalise-url');

describe('url personalising', function () {
	it('should be possible to personalise a url', function () {

		const testUuid = 'abcd';

		Promise.all([
			personaliseUrl('/myft', testUuid),
			personaliseUrl('/myft/', testUuid),
			personaliseUrl('/myft/my-news', testUuid),
			personaliseUrl('/myft/my-news/', testUuid),
			personaliseUrl('/myft/my-news?query=string', testUuid),
			personaliseUrl('/myft/preferences', testUuid),
			personaliseUrl('/myft/portfolio', testUuid),
			personaliseUrl('/myft/portfolio/', testUuid),

			// immutable URLs
			personaliseUrl('/myft/3f041222-22b9-4098-b4a6-7967e48fe4f7', testUuid),
			personaliseUrl('/myft/my-news/3f041222-22b9-4098-b4a6-7967e48fe4f7', testUuid),
			personaliseUrl('/myft/product-tour', testUuid),
			personaliseUrl('/myft/api/skdjfhksjd', testUuid)

		]).then(function (results) {
			expect(results.shift()).to.equal('/myft/abcd');
			expect(results.shift()).to.equal('/myft/abcd');
			expect(results.shift()).to.equal('/myft/my-news/abcd');
			expect(results.shift()).to.equal('/myft/my-news/abcd');
			expect(results.shift()).to.equal('/myft/my-news/abcd?query=string');
			expect(results.shift()).to.equal('/myft/preferences/abcd');
			expect(results.shift()).to.equal('/myft/portfolio/abcd');
			expect(results.shift()).to.equal('/myft/portfolio/abcd');

			// immutable URLs
			expect(results.shift()).to.equal('/myft/3f041222-22b9-4098-b4a6-7967e48fe4f7');
			expect(results.shift()).to.equal('/myft/my-news/3f041222-22b9-4098-b4a6-7967e48fe4f7');
			expect(results.shift()).to.equal('/myft/product-tour');
			expect(results.shift()).to.equal('/myft/api/skdjfhksjd');
		});

	});
});
