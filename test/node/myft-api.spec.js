require('isomorphic-fetch');
const { expect } = require('chai');
const fetchMock = require('fetch-mock');

const apiRoot = 'https://test-api.com/';
const apiRootMatcher = `begin:${apiRoot}`;

fetchMock
	.get(apiRootMatcher, [])
	.put(apiRootMatcher, [])

describe('myFT node API', () => {

	let MyFtApi = require('../../src/myft-api');
	let myFtApi = new MyFtApi({ apiRoot });

	const userId = '00000000-0000-0000-0000-000000000001';
	const defaultHeaders = { 'Content-Type': 'application/json' };
	const endpoint = `user/${userId}`;

	afterEach(() => {
		fetchMock.reset();
	});

	describe('Library functions', () => {
		describe('url personalising', () => {
			it('should be possible to personalise a url', () => {
				expect(myFtApi.personaliseUrl('/myft', userId)).to.equal(`/myft/${userId}`);
				expect(myFtApi.personaliseUrl(`/myft/${userId}`, userId)).to.equal(`/myft/${userId}`);
			});
		});

		describe('identifying personalised URLs', () => {
			it('should identify between personalised urls and not personalised urls', () => {
				expect(myFtApi.isPersonalisedUrl(`/myft/${userId}`)).to.be.true;
				expect(myFtApi.isPersonalisedUrl('/myft/following/')).to.be.false;
			});
		});

		describe('identifying immutable URLs', () => {
			it('should identify between immutable urls and mutable urls', () => {
				expect(myFtApi.isImmutableUrl(`/myft/${userId}`)).to.be.true;
				expect(myFtApi.isImmutableUrl('/myft/following/')).to.be.false;
			});
		});
	});

	describe('getAllRelationship', async () => {
		it('should request the API', async () => {
			await myFtApi.getAllRelationship('user', userId, 'followed', 'concept');
			expect(fetchMock.called()).to.be.true;
		});

		it('should accept pagination parameters', async () => {
			const page = 2;
			const limit = 10;
			await myFtApi.getAllRelationship('user', userId, 'followed', 'concept', { page, limit });

			expect(fetchMock.lastUrl(apiRootMatcher)).to.equal(
				`${apiRoot}user/${userId}/followed/concept?page=${page}&limit=${limit}`
			);
		});
	});

	describe('fetchJson', () => {
		it('should pass correct opts to the API calls', async () => {
			const method = 'GET';
			const timeout = 1406;
			await myFtApi.fetchJson(method, endpoint, null, { timeout });

			expect(fetchMock.lastOptions(apiRootMatcher)).to.deep.equal({
				method,
				'credentials': 'include',
				timeout,
				headers: { ...defaultHeaders }
			});
		});

		it('should reject when endpoint includes undefined', async () => {
			const invalidEndpoint = 'user/undefined';
			try {
				await myFtApi.fetchJson('GET', invalidEndpoint);
				throw new Error('Expected error did not throw!');
			} catch (err) {
				expect(err).to.deep.equal(new Error('Request must not contain undefined. Invalid path: ' + invalidEndpoint));
			}
		});

		it('should pass data as query params when method is GET', async () => {
			const paramOne = 'paramOneValue';
			const paramTwo = 'paramTwoValue';
			await myFtApi.fetchJson('GET', endpoint, { paramOne, paramTwo });

			expect(fetchMock.lastUrl(apiRootMatcher)).to.equal(
				`${apiRoot}${endpoint}?paramOne=${paramOne}&paramTwo=${paramTwo}`
			);
		});

		it('should not pass data as query params when method is not GET', async () => {
			const paramOne = 'paramOneValue';
			const paramTwo = 'paramTwoValue';
			await myFtApi.fetchJson('PUT', endpoint, { paramOne, paramTwo });

			expect(fetchMock.lastUrl(apiRootMatcher)).to.equal(`${apiRoot}${endpoint}`);
		});

		it('should throw errors when api returns 404', async () => {
			const apiRoot404 = 'https://test-api-404.com/';
			const readable = new fetchMock.stream.Readable();
			readable.push('response string');
			readable.push(null);
			fetchMock.get(`${apiRoot404}${endpoint}`, { status: 404, body: readable, sendAsJson: false });

			try {
				myFtApi = new MyFtApi({ apiRoot: apiRoot404 });
				await myFtApi.fetchJson('GET', endpoint);
				throw new Error('Expected error did not throw!');
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
			myFtApi = new MyFtApi({ apiRoot, headers: optsHeaders });
			expect(myFtApi.headers).to.deep.equal({
				...defaultHeaders,
				...optsHeaders
			});
		});

		it('should not pass a flag to bypass maintenance mode', async () => {
			await myFtApi.getAllRelationship('user', userId, 'followed', 'concept');
			expect(fetchMock.lastOptions(apiRootMatcher).headers['ft-bypass-myft-maintenance-mode']).to.not.be.true;
		});

		describe('fetchJson', () => {
			it('should pass function opts header to the API calls', async () => {
				myFtApi = new MyFtApi({ apiRoot, headers: optsHeaders });
				await myFtApi.fetchJson('GET', endpoint, null, { headers: functionOptsHeaders });

				expect(fetchMock.lastOptions(apiRootMatcher).headers).to.deep.equal({
					...defaultHeaders,
					...optsHeaders,
					...functionOptsHeaders
				});
			});

			describe('when NODE_ENV is production', () => {

				const originalNodeEnv = process.env.NODE_ENV;

				before(() => {
					process.env.NODE_ENV = 'production';

					delete require.cache[require.resolve('../../src/myft-api')];
					MyFtApi = require('../../src/myft-api');
				});

				after(() => {
					process.env.NODE_ENV = originalNodeEnv;
				});


				it('should set Content-Length header with data length when method is not GET', async () => {
					myFtApi = new MyFtApi({ apiRoot, headers: optsHeaders });
					const data = { 'a': 'b' };
					const contentLength = Buffer.byteLength(JSON.stringify(data));
					await myFtApi.fetchJson('PUT', endpoint, data);

					expect(fetchMock.lastOptions(apiRootMatcher).headers).to.deep.equal({
						...defaultHeaders,
						...optsHeaders,
						'Content-Length': contentLength
					});
				});

				it('should set Content-Length header with 0 when method is GET', async () => {
					myFtApi = new MyFtApi({ apiRoot, headers: optsHeaders });
					await myFtApi.fetchJson('GET', endpoint);

					expect(fetchMock.lastOptions(apiRootMatcher).headers).to.deep.equal({
						...defaultHeaders,
						...optsHeaders,
						'Content-Length': 0
					});
				});

			});
		});

		describe('getConceptsFromReadingHistory', () => {
			it('should pass function opts header to the API calls', async () => {
				myFtApi = new MyFtApi({ apiRoot, headers: optsHeaders });
				await myFtApi.getConceptsFromReadingHistory(userId, 10, {}, functionOptsHeaders);

				expect(fetchMock.lastOptions(apiRootMatcher).headers).to.deep.equal({
					...defaultHeaders,
					...optsHeaders,
					...functionOptsHeaders,
					'ft-user-uuid': userId
				});
			});
		});

		describe('getArticlesFromReadingHistory', () =>{
			it('should pass function opts header to the API calls', async () => {
				myFtApi = new MyFtApi({ apiRoot, headers: optsHeaders });
				await myFtApi.getArticlesFromReadingHistory(userId, -7, {}, functionOptsHeaders);

				expect(fetchMock.lastOptions(apiRootMatcher).headers).to.deep.equal({
					...defaultHeaders,
					...optsHeaders,
					...functionOptsHeaders,
					'ft-user-uuid': userId
				});
			});
		});

		describe('getUserLastSeenTimestamp', () => {
			it('should pass function opts header to the API calls', async () => {
				myFtApi = new MyFtApi({ apiRoot, headers: optsHeaders });
				await myFtApi.getUserLastSeenTimestamp(userId, { headers: functionOptsHeaders });

				expect(fetchMock.lastOptions(apiRootMatcher).headers).to.deep.equal({
					...defaultHeaders,
					...optsHeaders,
					...functionOptsHeaders,
					'ft-user-uuid': userId
				});
			});
		});

		describe('when BYPASS_MYFT_MAINTENANCE_MODE flag is set', () => {

			const originalBypassMaintenanceMode = process.env.BYPASS_MYFT_MAINTENANCE_MODE;
			const bypassMyftMaintenanceHeader = { 'ft-bypass-myft-maintenance-mode': 'true' };

			before(() => {
				process.env.BYPASS_MYFT_MAINTENANCE_MODE = true;

				delete require.cache[require.resolve('../../src/myft-api')];
				MyFtApi = require('../../src/myft-api');
			});

			after(() => {
				process.env.BYPASS_MYFT_MAINTENANCE_MODE = originalBypassMaintenanceMode;
			});


			it('should set headers when it is provided', () => {
				myFtApi = new MyFtApi({ apiRoot, headers: optsHeaders });

				expect(myFtApi.headers).to.deep.equal({
					...defaultHeaders,
					...optsHeaders,
					...bypassMyftMaintenanceHeader
				});
			});

			it('should pass a flag to bypass maintenance mode', async () => {
				myFtApi = new MyFtApi({ apiRoot });
				await myFtApi.getAllRelationship('user', userId, 'followed', 'concept', {}, { headers: functionOptsHeaders });

				expect(fetchMock.lastOptions(apiRootMatcher).headers).to.deep.equal({
					...defaultHeaders,
					...functionOptsHeaders,
					...bypassMyftMaintenanceHeader
				});
			});

		});

		describe('when SYSTEM_CODE is provided', () => {

			const systemCode = 'system-a';
			const originSystemHeader = { 'x-origin-system-id': systemCode };

			before(() => {
				process.env.SYSTEM_CODE = systemCode;

				delete require.cache[require.resolve('../../src/myft-api')];
				MyFtApi = require('../../src/myft-api');
			});

			after(() => {
				delete process.env['SYSTEM_CODE'];
			});


			it('should set headers when it is provided', () => {
				myFtApi = new MyFtApi({ apiRoot, headers: optsHeaders });

				expect(myFtApi.headers).to.deep.equal({
					...defaultHeaders,
					...optsHeaders,
					...originSystemHeader
				});
			});

			it('should pass the header to the API request', async () => {
				myFtApi = new MyFtApi({ apiRoot });
				await myFtApi.getAllRelationship('user', userId, 'followed', 'concept', {}, { headers: functionOptsHeaders });

				expect(fetchMock.lastOptions(apiRootMatcher).headers).to.deep.equal({
					...defaultHeaders,
					...functionOptsHeaders,
					...originSystemHeader
				});
			});

			it('should overwrite the header if function option pass x-origin-system-id header', async () => {
				const overwriteHeaders = { 'x-origin-system-id': 'system-b' };
				myFtApi = new MyFtApi({ apiRoot });
				await myFtApi.getAllRelationship('user', userId, 'followed', 'concept', {}, { headers: overwriteHeaders });

				expect(fetchMock.lastOptions(apiRootMatcher).headers).not.to.contains({
					...functionOptsHeaders
				});
				expect(fetchMock.lastOptions(apiRootMatcher).headers).to.deep.equal({
					...defaultHeaders,
					...overwriteHeaders
				});
			});

		});
	});
});
