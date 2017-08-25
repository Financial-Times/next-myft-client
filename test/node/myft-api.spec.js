require('isomorphic-fetch');
const { expect } = require('chai');
const fetchMock = require('fetch-mock');

fetchMock.get('*', []);

describe('myFT node API', () => {

	describe('in prod environment', () => {

		let MyFtApi;
		let myFtApi;

		let previousNodeEnv;

		beforeEach(function () {
			previousNodeEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'production';

			delete require.cache[require.resolve('../../src/myft-api')];
			MyFtApi = require('../../src/myft-api');
			myFtApi = new MyFtApi({
				apiRoot: 'https://test-api-route.com/',
				headers: {
					'X-API-KEY': 'adasd'
				}
			});
		});

		afterEach(function () {
			fetchMock.reset();
			process.env.NODE_ENV = previousNodeEnv;
		});

		it('should NOT pass a flag to bypass maintenance mode', () => {
			return myFtApi.getAllRelationship('user', 'userId', 'followed', 'concept').then(() => {
				expect(fetchMock.lastOptions('*').headers['ft-bypass-maintenance-mode-for-get']).to.not.be.true;
			});
		});

	});

	describe('in non-prod environment', () => {

		const MyFtApi = require('../../src/myft-api');
		const myFtApi = new MyFtApi({
			apiRoot: 'https://test-api-route.com/',
			headers: {
				'X-API-KEY': 'adasd'
			}
		});

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

			it('should request the API', () => {
				return myFtApi.getAllRelationship('user', 'userId', 'followed', 'concept').then(() => {
					expect(fetchMock.lastUrl('*')).to.equal('https://test-api-route.com/user/userId/followed/concept');
				});
			});

			it('should accept pagination parameters', () => {
				return myFtApi.getAllRelationship('user', 'userId', 'followed', 'concept', {
					page: 2,
					limit: 10
				}).then(() => {
					expect(fetchMock.lastUrl('*')).to.equal('https://test-api-route.com/user/userId/followed/concept?page=2&limit=10');
				});
			});

			it('should pass a flag to bypass maintenance mode (as we\'re not in prod)', () => {
				return myFtApi.getAllRelationship('user', 'userId', 'followed', 'concept').then(() => {
					expect(fetchMock.lastOptions('*').headers['ft-bypass-maintenance-mode-for-get']).to.be.true;
				});
			});
		});
	});
});
