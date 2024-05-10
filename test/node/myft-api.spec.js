require('isomorphic-fetch');
const { expect } = require('chai');
const fetchMock = require('fetch-mock');

fetchMock.get('*', []);

describe('myFT node API', () => {

	let MyFtApi = require('../../src/myft-api');
	let myFtApi = new MyFtApi({ apiRoot: 'https://test-api-route.com/' });
	const userId = '00000000-0000-0000-0000-000000000001';

	describe('Library functions', () => {
		describe('url personalising', function () {
			it('should be possible to personalise a url', function () {
				expect(myFtApi.personaliseUrl('/myft', userId)).to.equal(`/myft/${userId}`);
				expect(myFtApi.personaliseUrl(`/myft/${userId}`, userId)).to.equal(`/myft/${userId}`);
			});
		});

		describe('identifying personalised URLs', function () {
			it('should identify between personalised urls and not personalised urls', function () {
				expect(myFtApi.isPersonalisedUrl(`/myft/${userId}`)).to.be.true;
				expect(myFtApi.isPersonalisedUrl('/myft/following/')).to.be.false;
			});
		});

		describe('identifying immutable URLs', function () {
			it('should identify between immutable urls and mutable urls', function () {
				expect(myFtApi.isImmutableUrl(`/myft/${userId}`)).to.be.true;
				expect(myFtApi.isImmutableUrl('/myft/following/')).to.be.false;
			});
		});
	});

	describe('getAllRelationship', function () {
		it('should request the API', () => {
			return myFtApi.getAllRelationship('user', userId, 'followed', 'concept').then(() => {
				expect(fetchMock.lastUrl('*')).to.equal(`https://test-api-route.com/user/${userId}/followed/concept`);
			});
		});

		it('should accept pagination parameters', () => {
			return myFtApi.getAllRelationship('user', userId, 'followed', 'concept', {
				page: 2,
				limit: 10
			}).then(() => {
				expect(fetchMock.lastUrl('*')).to.equal(`https://test-api-route.com/user/${userId}/followed/concept?page=2&limit=10`);
			});
		});
	});

	describe('Headers', () => {

		const defaultHeaders = { 'Content-Type': 'application/json' };
		const optsHeaders = { 'x-opts-header': 'x-opts-header-value' };
		const functionOptsHeaders = {
			'x-function-opts-header': 'x-function-opts-header-value'
		};

		it('should have correct default headers', () => {
			myFtApi = new MyFtApi({ apiRoot: 'https://test-api-route.com/' });
			expect(myFtApi.headers).to.deep.equal(defaultHeaders);
		});

		it('should set headers when it is provided', () => {
			myFtApi = new MyFtApi({
				apiRoot: 'https://test-api-route.com/',
				headers: optsHeaders
			});
			expect(myFtApi.headers).to.deep.equal({
				...defaultHeaders,
				...optsHeaders
			});
		});

		it('should not pass a flag to bypass maintenance mode', () => {
			return myFtApi.getAllRelationship('user', userId, 'followed', 'concept').then(() => {
				expect(fetchMock.lastOptions('*').headers['ft-bypass-myft-maintenance-mode']).to.not.be.true;
			});
		});

		describe('fetchJson', function () {
			it('should pass function opts header to the API calls', () => {
				myFtApi = new MyFtApi({
					apiRoot: 'https://test-api-route.com/',
					headers: optsHeaders
				});
				return myFtApi.fetchJson('GET', 'endpont', null, { headers: functionOptsHeaders }).then(() => {
					expect(fetchMock.lastOptions('*').headers).to.deep.equal({
						...defaultHeaders,
						...optsHeaders,
						...functionOptsHeaders
					});
				});
			});
		});

		describe('getConceptsFromReadingHistory', function () {
			it('should pass function opts header to the API calls', () => {
				myFtApi = new MyFtApi({
					apiRoot: 'https://test-api-route.com/',
					headers: optsHeaders
				});
				return myFtApi.getConceptsFromReadingHistory(userId, 10, {}, functionOptsHeaders).then(() => {
					expect(fetchMock.lastOptions('*').headers).to.deep.equal({
						...defaultHeaders,
						...optsHeaders,
						...functionOptsHeaders,
						'ft-user-uuid': userId
					});
				});
			});
		});

		describe('getArticlesFromReadingHistory', function () {
			it('should pass function opts header to the API calls', () => {
				myFtApi = new MyFtApi({
					apiRoot: 'https://test-api-route.com/',
					headers: optsHeaders
				});
				return myFtApi.getArticlesFromReadingHistory(userId, -7, {}, functionOptsHeaders).then(() => {
					expect(fetchMock.lastOptions('*').headers).to.deep.equal({
						...defaultHeaders,
						...optsHeaders,
						...functionOptsHeaders,
						'ft-user-uuid': userId
					});
				});
			});
		});

		describe('getUserLastSeenTimestamp', function () {
			it('should pass function opts header to the API calls', () => {
				myFtApi = new MyFtApi({
					apiRoot: 'https://test-api-route.com/',
					headers: optsHeaders
				});
				return myFtApi.getUserLastSeenTimestamp(userId, { headers: functionOptsHeaders }).then(() => {
					expect(fetchMock.lastOptions('*').headers).to.deep.equal({
						...defaultHeaders,
						...optsHeaders,
						...functionOptsHeaders,
						'ft-user-uuid': userId
					});
				});
			});
		});

		describe('when BYPASS_MYFT_MAINTENANCE_MODE flag is set', () => {

			let previousBypassMaintenanceMode;
			const bypassMyftMaintenanceHeader = { 'ft-bypass-myft-maintenance-mode': 'true' };

			beforeEach(function () {
				previousBypassMaintenanceMode = process.env.BYPASS_MYFT_MAINTENANCE_MODE;
				process.env.BYPASS_MYFT_MAINTENANCE_MODE = true;

				delete require.cache[require.resolve('../../src/myft-api')];
				MyFtApi = require('../../src/myft-api');
			});

			afterEach(function () {
				fetchMock.reset();
				process.env.BYPASS_MYFT_MAINTENANCE_MODE = previousBypassMaintenanceMode;
			});


			it('should set headers when it is provided', () => {
				myFtApi = new MyFtApi({
					apiRoot: 'https://test-api-route.com/',
					headers: optsHeaders
				});
				expect(myFtApi.headers).to.deep.equal({
					...defaultHeaders,
					...optsHeaders,
					...bypassMyftMaintenanceHeader
				});
			});

			it('should pass a flag to bypass maintenance mode', () => {
				myFtApi = new MyFtApi({ apiRoot: 'https://test-api-route.com/' });

				return myFtApi.getAllRelationship('user', userId, 'followed', 'concept').then(() => {
					expect(fetchMock.lastOptions('*').headers).to.deep.equal({
						...defaultHeaders,
						...bypassMyftMaintenanceHeader
					});
				});
			});

		});
	});
});
