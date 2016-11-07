'use strict';

/*global Buffer*/
const request = require('request');

const lib = {
	sanitizeData: require('./lib/sanitize-data'),
	personaliseUrl: require('./lib/personalise-url'),
	isPersonalisedUrl: require('./lib/is-personalised-url'),
	isImmutableUrl: require('./lib/is-immutable-url'),
	isValidUuid: require('./lib/is-valid-uuid')
};

class MyFtApi {
	constructor (opts) {
		if (!opts.apiRoot) {
			throw 'Myft API  must be constructed with an api root';
		}
		this.apiRoot = opts.apiRoot;
		this.headers = Object.assign({
			'Content-Type': 'application/json',
		}, opts.headers);
	}

	fetchJson (method, endpoint, data, opts) {
		opts = opts || {};

		const options = Object.assign({
			url: this.apiRoot + endpoint,
			method,
			headers: this.headers,
		}, opts);


		if(/undefined/.test(endpoint)) {
			return Promise.reject('Request should not contain undefined.');
		}

		//Sanitize data
		data = lib.sanitizeData(data);

		if (method !== 'GET') {

			// fiddle content length header to appease Fastly
			if(process && process.env.NODE_ENV === 'production') {

				// Fastly requires that empty requests have an empty object for a body and local API requires that
				// they don't
				options.body = JSON.stringify(data || {});

				this.headers['Content-Length'] = Buffer.byteLength(options.body);

			} else {
				options.body = data ? JSON.stringify(data) : null;
			}
		} else {

			if(process && process.env.NODE_ENV === 'production') {
				this.headers['Content-Length'] = 0;
			}

			options.qs = data || {};
		}

		return new Promise((resolve, reject) => {
			request(options, (err, response, body) => {
				if (err) {
					return reject(err);
				} else if (response.statusCode === 404) {
					return reject(new Error('No user data exists'))
				} else {
					try {
						const json = JSON.parse(body);
						return resolve(json);
					} catch (e) {
						return reject(e);
					}
				}
			});
		})
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
