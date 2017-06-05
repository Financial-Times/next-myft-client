'use strict';

import chai from 'chai';
const expect = chai.expect;
const personaliseUrl = require('../../src/lib/personalise-url');

describe('url personalising', function () {
	it('should be possible to personalise a url', function () {

		const userId = '00000000-0000-0000-0000-000000000000';
		const listId = '00000000-0000-0000-0000-000000000001';
		const articleId = '00000000-0000-0000-0000-000000000002';

		expect(personaliseUrl('/myft', userId)).to.equal(`/myft/${userId}`);
		expect(personaliseUrl('/myft/', userId)).to.equal(`/myft/${userId}`);
		expect(personaliseUrl('/myft/following', userId)).to.equal(`/myft/following/${userId}`);
		expect(personaliseUrl('/myft/following/', userId)).to.equal(`/myft/following/${userId}`);
		expect(personaliseUrl('/myft/following.json', userId)).to.equal(`/myft/following/${userId}.json`);
		expect(personaliseUrl('/myft/following?query=string', userId)).to.equal(`/myft/following/${userId}?query=string`);
		expect(personaliseUrl('/myft/saved-articles', userId)).to.equal(`/myft/saved-articles/${userId}`);
		expect(personaliseUrl('/myft/saved-articles/', userId)).to.equal(`/myft/saved-articles/${userId}`);
		expect(personaliseUrl('/myft/explore', userId)).to.equal(`/myft/explore/${userId}`);
		expect(personaliseUrl('/myft/explore/', userId)).to.equal(`/myft/explore/${userId}`);
		expect(personaliseUrl('/myft/alerts', userId)).to.equal(`/myft/alerts/${userId}`);
		expect(personaliseUrl('/myft/alerts/', userId)).to.equal(`/myft/alerts/${userId}`);

		// immutable URLs
		expect(personaliseUrl(`/myft/${userId}`, userId)).to.equal(`/myft/${userId}`);
		expect(personaliseUrl(`/myft/following/${userId}`, userId)).to.equal(`/myft/following/${userId}`);
		expect(personaliseUrl(`/myft/saved-articles/${userId}`, userId)).to.equal(`/myft/saved-articles/${userId}`);
		expect(personaliseUrl(`/myft/explore/${userId}`, userId)).to.equal(`/myft/explore/${userId}`);
		expect(personaliseUrl(`/myft/alerts/${userId}`, userId)).to.equal(`/myft/alerts/${userId}`);
		expect(personaliseUrl('/myft/api/skdjfhksjd', userId)).to.equal('/myft/api/skdjfhksjd');

		// legacy+immutable URLs
		expect(personaliseUrl('/myft/my-news', userId)).to.equal('/myft/my-news');
		expect(personaliseUrl('/myft/my-topics', userId)).to.equal('/myft/my-topics');
		expect(personaliseUrl('/myft/preferences', userId)).to.equal('/myft/preferences');
		expect(personaliseUrl('/myft/product-tour', userId)).to.equal('/myft/product-tour');
		expect(personaliseUrl('/__myft/product-tour', userId)).to.equal('/__myft/product-tour');

		// a url with a non-user uuid in the query string
		expect(personaliseUrl(`/myft/saved-articles?fragment=true&contentId=${articleId}`, userId)).to.equal(`/myft/saved-articles/${userId}?fragment=true&contentId=${articleId}`);

		// a list URL (lists are public and contain no user ID)
		expect(personaliseUrl(`/myft/list/${listId}`, userId)).to.equal(`/myft/list/${listId}`);

	});

	it('should not be possible to personalise a with an invalid userId', function () {

		const invalidUserId = '-';

		expect(() => personaliseUrl('/myft', invalidUserId)).to.throw('Invalid user uuid: ' + invalidUserId);
	})

	it('should return the given if passed an undefined userId', function () {

		const undefinedUserId = undefined;

		expect(personaliseUrl('/myft', undefinedUserId)).to.equal('/myft');
	})
});
