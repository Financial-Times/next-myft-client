'use strict';

import chai from 'chai';
const expect = chai.expect;
require('isomorphic-fetch');
const sinon = require('sinon');

const requestStub = sinon.stub();
const MyFtApi = require('../src/myft-api');
const myFtApi = new MyFtApi({
	apiRoot: 'https://test-api-route.com/',
	headers: {
		'X-API-KEY': 'adasd'
	}
}, { request: requestStub });

describe('url personalising', function () {

	it('should be possible to personalise a url', function () {

		const testUuid = '3f041222-22b9-4098-b4a6-7967e48fe4f7';

		expect(myFtApi.personaliseUrl('/myft', testUuid)).to.equal(`/myft/${testUuid}`);
		expect(myFtApi.personaliseUrl(`/myft/${testUuid}`, testUuid)).to.equal(`/myft/${testUuid}`);
	});
});


describe('identifying personalised URLs', function () {
	it('should identify between personalised urls and not personalised urls', function () {
		expect(myFtApi.isPersonalisedUrl('/myft/3f041222-22b9-4098-b4a6-7967e48fe4f7')).to.be.true;
		expect(myFtApi.isPersonalisedUrl('/myft/following/')).to.be.false;
	});
});

describe('identifying immutable URLs', function () {
	it('should identify between immutable urls and mutable urls', function () {
		expect(myFtApi.isImmutableUrl('/myft/3f041222-22b9-4098-b4a6-7967e48fe4f7')).to.be.true;
		expect(myFtApi.isImmutableUrl('/myft/following/')).to.be.false;
	});
});

describe.only('getting a relationship', function () {
	before(function () {
		requestStub.yields(null, { statusCode: 200 }, '{}');
	});

	it('should request the API', function (done) {
		myFtApi.getAllRelationship('user', 'userId', 'followed', 'concept').then(function () {
			expect(requestStub.lastCall.args[0].url).to.equal('https://test-api-route.com/user/userId/followed/concept');
			done();
		})
		.catch(done);

	});

	it('should accept pagination parameters', function (done) {
		myFtApi.getAllRelationship('user', 'userId', 'followed', 'concept', {
			page: 2,
			limit: 10
		}).then(function () {
			expect(requestStub.lastCall.args[0].qs).to.eql({page: 2, limit: 10});
			done();
		}).catch(done);
	});
});
