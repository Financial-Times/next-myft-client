require('isomorphic-fetch');
const { expect } = require('chai');
const fetchMock = require('fetch-mock');
fetchMock.config.overwriteRoutes = true;

const apiRoot = 'https://test-api-route.com/';

describe('myFT node API', () => {

	let MyFtApi = require('../../src/myft-api');
	let myFtApi = new MyFtApi({ apiRoot });

	const userId = '00000000-0000-0000-0000-000000000001';
	const defaultHeaders = { 'Content-Type': 'application/json' };

	beforeEach(() => {
		fetchMock.get('*', []);
	})

	afterEach(function () {
		fetchMock.reset();
	});

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

	describe('fetchJson', function () {
		it('should pass correct opts to the API calls', () => {
			const method = 'GET';
			const timeout = 1406;
			return myFtApi.fetchJson(method, 'endpoint', null, { timeout }).then(() => {
				expect(fetchMock.lastOptions('*')).to.deep.equal({
					method,
					'credentials': 'include',
					timeout,
					headers: { ...defaultHeaders }
				});
			});
		});

		it('should reject when endpoint includes undefined', (done) => {
			const endpoint = `endpoint/undefined/${userId}`;
			myFtApi.fetchJson('GET', endpoint)
				.catch(err => {
					expect(err).to.deep.equal(new Error('Request must not contain undefined. Invalid path: ' + endpoint));
					done();
				});
		});

		it('should pass data as query params when method is GET', () => {
			const endpoint = 'endpoint';
			const paramOne = 'paramOneValue';
			const paramTwo = 'paramTwoValue';
			return myFtApi.fetchJson('GET', 'endpoint', { paramOne, paramTwo} ).then(() => {
				expect(fetchMock.lastUrl('*')).to.equal(`https://test-api-route.com/${endpoint}?paramOne=${paramOne}&paramTwo=${paramTwo}`);
			});
		});

		it('should not pass data as query params when method is not GET', () => {
			fetchMock.put('*', []);
			const endpoint = 'endpoint';
			const paramOne = 'paramOneValue';
			const paramTwo = 'paramTwoValue';
			return myFtApi.fetchJson('PUT', 'endpoint', { paramOne, paramTwo} ).then(() => {
				expect(fetchMock.lastUrl('*')).to.equal(`https://test-api-route.com/${endpoint}`);
			});
		});

		it('should throw errors when api returns 404', async () => {
			const endpoint = `endpoint/${userId}`;
			fetchMock.restore();
			const readable = new fetchMock.stream.Readable();
			readable.push('response string');
			readable.push(null);

			fetchMock.mock('https://test-api-route.com/endpoint/00000000-0000-0000-0000-000000000001', { status: 404, body: readable, sendAsJson: false });
			try {
				await myFtApi.fetchJson('GET', endpoint)
				throw new Error(`Expected error didn't throw!`)
			} catch (err) {
				expect(err).to.deep.equal(new Error('No user data exists'));
			}
		});
	});

	describe('Headers', () => {

		const optsHeaders = { 'x-opts-header': 'x-opts-header-value' };
		const functionOptsHeaders = {
			'x-function-opts-header': 'x-function-opts-header-value'
		};

		it('should have correct default headers', () => {
			myFtApi = new MyFtApi({ apiRoot });
			expect(myFtApi.headers).to.deep.equal(defaultHeaders);
		});

		it('should set headers when it is provided', () => {
			myFtApi = new MyFtApi({
				apiRoot,
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
					apiRoot,
					headers: optsHeaders
				});
				return myFtApi.fetchJson('GET', 'endpoint', null, { headers: functionOptsHeaders }).then(() => {
					expect(fetchMock.lastOptions('*').headers).to.deep.equal({
						...defaultHeaders,
						...optsHeaders,
						...functionOptsHeaders
					});
				});
			});

			describe('when NODE_ENV is production', () => {

				const originalNodeEnv = process.env.NODE_ENV;

				beforeEach(function () {
					process.env.NODE_ENV = 'production';

					delete require.cache[require.resolve('../../src/myft-api')];
					MyFtApi = require('../../src/myft-api');
				});

				afterEach(function () {
					process.env.NODE_ENV = originalNodeEnv;
				});


				it('should set Content-Length header with data length when method is not GET', () => {
					fetchMock.put('*', []);
					myFtApi = new MyFtApi({
						apiRoot,
						headers: optsHeaders
					});

					const data = { 'a': 'b' };
					const contentLength = Buffer.byteLength(JSON.stringify(data));

					return myFtApi.fetchJson('PUT', 'endpoint', data).then(() => {
						expect(fetchMock.lastOptions('*').headers).to.deep.equal({
							...defaultHeaders,
							...optsHeaders,
							'Content-Length': contentLength
						});
					});
				});

				it('should set Content-Length header with 0 when method is GET', () => {
					myFtApi = new MyFtApi({
						apiRoot,
						headers: optsHeaders
					});

					return myFtApi.fetchJson('GET', 'endpoint').then(() => {
						expect(fetchMock.lastOptions('*').headers).to.deep.equal({
							...defaultHeaders,
							...optsHeaders,
							'Content-Length': 0
						});
					});
				});

			});
		});

		describe('getConceptsFromReadingHistory', function () {
			it('should pass function opts header to the API calls', () => {
				myFtApi = new MyFtApi({
					apiRoot,
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
					apiRoot,
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
					apiRoot,
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

			let originalBypassMaintenanceMode = process.env.BYPASS_MYFT_MAINTENANCE_MODE;
			const bypassMyftMaintenanceHeader = { 'ft-bypass-myft-maintenance-mode': 'true' };

			beforeEach(function () {
				process.env.BYPASS_MYFT_MAINTENANCE_MODE = true;

				delete require.cache[require.resolve('../../src/myft-api')];
				MyFtApi = require('../../src/myft-api');
			});

			afterEach(function () {
				process.env.BYPASS_MYFT_MAINTENANCE_MODE = originalBypassMaintenanceMode;
			});


			it('should set headers when it is provided', () => {
				myFtApi = new MyFtApi({
					apiRoot,
					headers: optsHeaders
				});
				expect(myFtApi.headers).to.deep.equal({
					...defaultHeaders,
					...optsHeaders,
					...bypassMyftMaintenanceHeader
				});
			});

			it('should pass a flag to bypass maintenance mode', () => {
				myFtApi = new MyFtApi({ apiRoot });

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
