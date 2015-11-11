/*global describe, it, expect, beforeEach, afterEach*/
/*jshint expr:true*/
'use strict';

var personaliseUrl = require('../../src/lib/personalise-url');

describe('url personalising', function () {
	it('should be possible to personalise a url', function (done) {

		var testUuid = 'abcd';

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
			personaliseUrl('/myft/api/skdjfhksjd', testUuid),

			// a url with a non-user uuid in the query string
			personaliseUrl('/myft/article-saved?fragment=true&contentId=6c9c03b0-7bf9-11e5-98fb-5a6d4728f74e', testUuid),

			// a list URL (lists are public and contain no user ID)
			personaliseUrl('/myft/list/0e6f700d-d1c7-4667-9ec3-268a4572d3dc', testUuid)


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

			// a url with a non-user uuid in the query string
			expect(results.shift()).to.equal('/myft/article-saved/abcd?fragment=true&contentId=6c9c03b0-7bf9-11e5-98fb-5a6d4728f74e');

			// a list URL (lists are public and contain no user ID)
			expect(results.shift()).to.equal('/myft/list/0e6f700d-d1c7-4667-9ec3-268a4572d3dc');

			done();

		}).catch(done);

	});
});
