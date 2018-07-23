const fetchres = require('fetchres');
const BlackHoleStream = require('black-hole-stream');

const lib = {
	sanitizeData: require('./lib/sanitize-data'),
	personaliseUrl: require('./lib/personalise-url'),
	isPersonalisedUrl: require('./lib/is-personalised-url'),
	isImmutableUrl: require('./lib/is-immutable-url'),
	isValidUuid: require('./lib/is-valid-uuid')
};

const defaultHeaders = {
	'Content-Type': 'application/json',
};

const envHeaders = {};
if (process.env.BYPASS_MYFT_MAINTENANCE_MODE) {
	envHeaders['ft-bypass-myft-maintenance-mode'] = 'true';
}

class MyFtApi {
	constructor (opts) {
		if (!opts.apiRoot) {
			throw 'The myFT client must be constructed with an api root. Ensure that your app has a MYFT_API_URL env var configured.';
		}
		this.apiRoot = opts.apiRoot;

		this.headers = Object.assign({},
			defaultHeaders,
			envHeaders,
			opts.headers
		);
	}

	fetchJson (method, endpoint, data, opts) {
		opts = opts || {};

		let queryString = '';
		let options = Object.assign({
			method,
			credentials: 'include'
		},
		opts,
		{
			headers: this.headers
		});

		if (/undefined/.test(endpoint)) {
			return Promise.reject('Request must not contain undefined. Invalid path: ' + endpoint);
		}

		//Sanitize data
		data = lib.sanitizeData(data);

		if (method !== 'GET') {

			// fiddle content length header to appease Fastly
			if (process.env.NODE_ENV === 'production') {

				// Fastly requires that empty requests have an empty object for a body and local API requires that
				// they don't
				options.body = JSON.stringify(data || {});

				this.headers['Content-Length'] = Buffer.byteLength(options.body);

			} else {
				options.body = data ? JSON.stringify(data) : null;
			}
		} else {

			if (process.env.NODE_ENV === 'production') {
				this.headers['Content-Length'] = 0;
			}

			Object.keys(data || {}).forEach(function (key) {
				if (queryString.length) {
					queryString += `&${key}=${data[key]}`;
				} else {
					queryString += `?${key}=${data[key]}`;
				}
			});
		}

		return fetch(this.apiRoot + endpoint + queryString, options)
			.then(res => {
				if (res.status === 404) {
					res.body.pipe(new BlackHoleStream());
					throw new Error('No user data exists');
				}
				return res;
			})
			.then(fetchres.json);
	}

	addActor (actor, data, opts) {
		return this.fetchJson('POST', actor, data, opts);
	}

	getActor (actor, id, opts) {
		return this.fetchJson('GET', `${actor}/${id}`, null, opts);
	}

	updateActor (actor, id, data, opts) {
		return this.fetchJson('PUT', `${actor}/${id}`, data, opts);
	}

	removeActor (actor, id, opts) {
		return this.fetchJson('DELETE', `${actor}/${id}`, null, opts);
	}

	getAllRelationship (actor, id, relationship, type, params, opts) {
		return this.fetchJson('GET', `${actor}/${id}/${relationship}/${type}`, params, opts);
	}

	getRelationship (actor, id, relationship, type, subject, params, opts) {
		return this.fetchJson('GET', `${actor}/${id}/${relationship}/${type}/${subject}`, params, opts);
	}

	addRelationship (actor, id, relationship, type, data, opts) {
		return this.fetchJson('POST', `${actor}/${id}/${relationship}/${type}`, data, opts);
	}

	updateRelationship (actor, id, relationship, type, subject, data, opts) {
		return this.fetchJson('PUT', `${actor}/${id}/${relationship}/${type}/${subject}`, data, opts);
	}

	removeRelationship (actor, id, relationship, type, subject, opts) {
		return this.fetchJson('DELETE', `${actor}/${id}/${relationship}/${type}/${subject}`, null, opts);
	}

	purgeActor (actor, id, opts) {
		return this.fetchJson('POST', `purge/${actor}/${id}`, null, opts);
	}

	purgeRelationship (actor, id, relationship, opts) {
		return this.fetchJson('POST', `purge/${actor}/${id}/${relationship}`, null, opts);
	}

	getConceptsFromReadingHistory (userUuid, limit) {
		const headers = Object.assign(this.headers,
			{
				'ft-user-uuid': userUuid
			});

		return this.fetchJson('GET', `next/user/${userUuid}/history/topics?limit=${limit}`, null, {headers});
	}

	getArticlesFromReadingHistory (userUuid, daysBack = -7, opts = {timeout: 3000}) {
		const headers = Object.assign(this.headers,
			{
				'ft-user-uuid': userUuid
			});

		return this.fetchJson('GET', `next/user/${userUuid}/history/articles?limit=${daysBack}`, null, Object.assign(opts, { headers }));
	}

	personaliseUrl (url, uuid) {
		return lib.personaliseUrl(url, uuid);
	}

	isPersonalisedUrl (url) {
		return lib.isPersonalisedUrl(url);
	}

	isImmutableUrl (url) {
		return lib.isImmutableUrl(url);
	}

	isValidUuid (str) {
		return lib.isValidUuid(str);
	}
}

module.exports = MyFtApi;
