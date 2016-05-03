/*global describe, it, expect, beforeEach, afterEach*/
/*jshint expr:true*/
'use strict';

const personaliseUrl = require('../../src/lib/personalise-url');

describe('url personalising', function () {
	it('should be possible to personalise a url', function () {

		const userId = 'f0bb6f11-c034-4792-a1c0-3647825363a0';
		const listId = 'e077a74b-693f-4744-b055-d239f548f356';
		const articleId = '08be4dcc-885f-11e5-90de-f44762bf9896';

		expect(personaliseUrl(`/myft`, userId)).to.equal(`/myft/${userId}`);
		expect(personaliseUrl(`/myft/`, userId)).to.equal(`/myft/${userId}`);
		expect(personaliseUrl(`/myft/following`, userId)).to.equal(`/myft/following/${userId}`);
		expect(personaliseUrl(`/myft/following/`, userId)).to.equal(`/myft/following/${userId}`);
		expect(personaliseUrl(`/myft/following.json`, userId)).to.equal(`/myft/following/${userId}.json`);
		expect(personaliseUrl(`/myft/following?query=string`, userId)).to.equal(`/myft/following/${userId}?query=string`);
		expect(personaliseUrl(`/myft/saved-articles`, userId)).to.equal(`/myft/saved-articles/${userId}`);
		expect(personaliseUrl(`/myft/saved-articles/`, userId)).to.equal(`/myft/saved-articles/${userId}`);
		expect(personaliseUrl(`/myft/explore`, userId)).to.equal(`/myft/explore/${userId}`);
		expect(personaliseUrl(`/myft/explore/`, userId)).to.equal(`/myft/explore/${userId}`);
		expect(personaliseUrl(`/myft/alerts`, userId)).to.equal(`/myft/alerts/${userId}`);
		expect(personaliseUrl(`/myft/alerts/`, userId)).to.equal(`/myft/alerts/${userId}`);

		// immutable URLs
		expect(personaliseUrl(`/myft/${userId}`, userId)).to.equal(`/myft/${userId}`);
		expect(personaliseUrl(`/myft/following/${userId}`, userId)).to.equal(`/myft/following/${userId}`);
		expect(personaliseUrl(`/myft/saved-articles/${userId}`, userId)).to.equal(`/myft/saved-articles/${userId}`);
		expect(personaliseUrl(`/myft/explore/${userId}`, userId)).to.equal(`/myft/explore/${userId}`);
		expect(personaliseUrl(`/myft/alerts/${userId}`, userId)).to.equal(`/myft/alerts/${userId}`);
		expect(personaliseUrl(`/myft/product-tour`, userId)).to.equal(`/myft/product-tour`);
		expect(personaliseUrl(`/myft/api/skdjfhksjd`, userId)).to.equal(`/myft/api/skdjfhksjd`);

		// legacy+immutable URLs
		expect(personaliseUrl(`/myft/my-news`, userId)).to.equal(`/myft/my-news`);
		expect(personaliseUrl(`/myft/my-topics`, userId)).to.equal(`/myft/my-topics`);
		expect(personaliseUrl(`/myft/preferences`, userId)).to.equal(`/myft/preferences`);

		// a url with a non-user uuid in the query string
		expect(personaliseUrl(`/myft/saved-articles?fragment=true&contentId=${articleId}`, userId)).to.equal(`/myft/saved-articles/${userId}?fragment=true&contentId=${articleId}`);

		// a list URL (lists are public and contain no user ID)
		expect(personaliseUrl(`/myft/list/${listId}`, userId)).to.equal(`/myft/list/${listId}`);

	});

	it('should not be possible to personalise a with an invalid userId', function () {

	})
});
