/*global Buffer*/
'use strict';
const fetchres = require('fetchres');

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

		let queryString = '';
		let options = Object.assign({
			method,
			headers: this.headers,
			credentials: 'include'
		}, opts);


		if(/undefined/.test(endpoint)) {
			return Promise.reject('Request should contain undefined.');
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
				this.headers['Content-Length'] = '';
			}

			Object.keys(data || {}).forEach(function(key) {
				if(queryString.length) {
					queryString += `&${key}=${data[key]}`;
				} else {
					queryString += `?${key}=${data[key]}`;
				}
			});
		}

		return fetch(this.apiRoot + endpoint + queryString, options)
			.then(res => {
				if (res.status === 404) {
					throw new Error('No user data exists');
				}
				return res;
			})
			.then(fetchres.json);
	}

	addActor (actor, data) {
		return this.fetchJson('POST', actor, data);
	}

	getActor (actor, id) {
		return this.fetchJson('GET', `${actor}/${id}`);
	}

	updateActor(actor, id, data) {
		return this.fetchJson('PUT', `${actor}/${id}`, data);
	}

	removeActor(actor, id) {
		return this.fetchJson('DELETE', `${actor}/${id}`);
	}

	getAllRelationship (actor, id, relationship, type, params) {
		return this.fetchJson('GET', `${actor}/${id}/${relationship}/${type}`,params);
	}

	getRelationship (actor, id, relationship, type, subject, params) {
		return this.fetchJson('GET', `${actor}/${id}/${relationship}/${type}/${subject}`, params);
	}

	addRelationship (actor, id, relationship, type, data) {
		return this.fetchJson('POST', `${actor}/${id}/${relationship}/${type}`, data);
	}

	updateRelationship (actor, id, relationship, type, subject, data) {
		return this.fetchJson('PUT', `${actor}/${id}/${relationship}/${type}/${subject}`, data);
	}

	removeRelationship (actor, id, relationship, type, subject) {
		return this.fetchJson('DELETE', `${actor}/${id}/${relationship}/${type}/${subject}`);
	}

	purgeActor(actor, id) {
		return this.fetchJson('POST', `purge/${actor}/${id}`);
	}

	purgeRelationship(actor, id, relationship) {
		return this.fetchJson('POST', `purge/${actor}/${id}/${relationship}`);
	}

	personaliseUrl(url, uuid) {
		return lib.personaliseUrl(url, uuid);
	}

	isPersonalisedUrl(url) {
		return lib.isPersonalisedUrl(url);
	}

	isImmutableUrl(url) {
		return lib.isImmutableUrl(url);
	}

	isValidUuid(str) {
		return lib.isValidUuid(str);
	}
}

module.exports = MyFtApi;
