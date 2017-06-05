'use strict';

import chai from 'chai';
const expect = chai.expect;
require('isomorphic-fetch');

const MyFtApi = require('../src/myft-api');
const myFtApi = new MyFtApi({
	apiRoot: 'https://test-api-route.com/',
	headers: {
		'X-API-KEY': 'adasd'
	}
});

const sinon = require('sinon');


function mockFetch (response, status) {
	return new Promise(function (resolve) {
		resolve({
			ok: true,
			status: status || 200,
			json: function () {
				return Promise.resolve(response);
			}
		});
	});
}


describe('url personalising', function () {

	it('should be possible to personalise a url', function () {

		const testUuid = '00000000-0000-0000-0000-000000000000';

		expect(myFtApi.personaliseUrl('/myft', testUuid)).to.equal(`/myft/${testUuid}`);
		expect(myFtApi.personaliseUrl(`/myft/${testUuid}`, testUuid)).to.equal(`/myft/${testUuid}`);
	});
});


describe('identifying personalised URLs', function () {
	it('should identify between personalised urls and not personalised urls', function () {
		expect(myFtApi.isPersonalisedUrl('/myft/00000000-0000-0000-0000-000000000000')).to.be.true;
		expect(myFtApi.isPersonalisedUrl('/myft/following/')).to.be.false;
	});
});

describe('identifying immutable URLs', function () {
	it('should identify between immutable urls and mutable urls', function () {
		expect(myFtApi.isImmutableUrl('/myft/00000000-0000-0000-0000-000000000000')).to.be.true;
		expect(myFtApi.isImmutableUrl('/myft/following/')).to.be.false;
	});
});

describe('getting a relationship', function () {
	let fetchStub;
	beforeEach(function () {
		fetchStub = sinon.stub(window, 'fetch');
		fetchStub.returns(mockFetch([]));
	});

	afterEach(function () {
		window.fetch.restore();
	});


	it('should request the API', function (done) {
		myFtApi.getAllRelationship('user', 'userId', 'followed', 'concept').then(function () {
			expect(fetchStub.calledWith('https://test-api-route.com/user/userId/followed/concept')).to.be.true;
			done();
		})
		.catch(done);

	});

	it('should accept pagination parameters', function (done) {
		myFtApi.getAllRelationship('user', 'userId', 'followed', 'concept', {
			page: 2,
			limit: 10
		}).then(function () {
			expect(fetchStub.calledWith('https://test-api-route.com/user/userId/followed/concept?page=2&limit=10')).to.be.true;
			done();
		}).catch(done);

	});
});
