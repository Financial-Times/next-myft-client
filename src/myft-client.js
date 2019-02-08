import session from 'next-session-client';
import * as fetchres from 'fetchres';
import personaliseUrl from './lib/personalise-url';

const emptyResponse = {
	total: 0,
	items: [],
	count: 0
};

class MyFtClient {
	constructor ({ apiRoot } = {}) {
		if (!apiRoot) {
			throw 'User prefs must be constructed with an api root';
		}
		this.apiRoot = apiRoot;
		this.loaded = {};
	}

	/**
	* loads user's preferred, enabled and created relationships, as well as requested additional relationships
	* @param additionalRelationships
	* @returns {*}
	*/
	init (additionalRelationships = []) {

		if (this.initialised) {
			return Promise.resolve();
		}
		this.initialised = true;

		const anonymousUser = !(/FTSession=/.test(document.cookie));
		if (anonymousUser) {
			return Promise.reject('No session cookie found');
		}

		this.setPerfMark();
		return session.uuid()
			.then(({ uuid }) => {

				if (!uuid) {
					return Promise.reject('Session service returned undefined.');
				}

				this.userId = uuid;

				this.headers = {
					'Content-Type': 'application/json',
					'X-FT-Session-Token': session.cookie(),
					accept: 'application/json'
				};

				let relationships = new Set([
					{ relationship: 'preferred', type: 'preference' },
					{ relationship: 'enabled', type: 'endpoint' },
					{ relationship: 'created', type: 'list' }
				]);

				additionalRelationships.forEach(rel => {
					if (!relationships.has(rel)) { relationships.add(rel); }
				});

				relationships.forEach(relationship => this.load(relationship));

			})
			.catch(e => {
				// Keeps console clean for anonymous users
				if (e.message === 'No session cookie found') {
					return;
				}
				throw e;
			});
	}

	setPerfMark () {
		const p = window.performance || window.msPerformance || window.webkitPerformance || window.mozPerformance;
		if (!p || !p.mark) return;
		Promise.all([
			new Promise(res => {
				document.addEventListener('myft.user.followed.concept.load', res);
			}),
			new Promise(res => {
				document.addEventListener('myft.user.saved.content.load', res);
			})
		])
			.then(() => p.mark('myftLoaded'));
	}

	emit (name, data) {
		document.body.dispatchEvent(new CustomEvent(`myft.${name}`, {
			detail: data,
			bubbles: true
		}));
	}

	fetchJson (method, endpoint, data) {
		let options = {
			method,
			headers: this.headers,
			credentials: 'include'
		};

		if (/undefined/.test(endpoint)) {
			let msg = 'Request should not contain undefined.';
			document.body.dispatchEvent(new CustomEvent('oErrors.log', {
				bubbles: true,
				detail: { error: new Error(msg) }
			}));
			return Promise.reject(msg);
		}

		if (method !== 'GET') {
			options.body = JSON.stringify(data || {});
		}
		return fetch(this.apiRoot + endpoint, options)
			.then(fetchres.json);

	}

	load (relationship) {
		const key = `${relationship.relationship}.${relationship.type}`;

		this.fetchJson('GET', `${this.userId}/${relationship.relationship}/${relationship.type}`)
			.then(results => {
				if (!results) {
					results = emptyResponse;
				}
				this.loaded[key] = results;
				this.emit(`user.${key}.load`, results);
			})
			.catch(err => {
				if (err.message === 'No user data exists') {
					this.loaded[key] = emptyResponse;
					this.emit(`user.${key}.load`, emptyResponse);
				} else {
					throw err;
				}
			});
	}

	add (actor, actorId, relationship, type, subject, data) {
		actorId = this.getFallbackActorIdIfNecessary(actor, actorId);
		return this.fetchJson('PUT', `${actor}/${actorId}/${relationship}/${type}/${subject}`, data)
			.then(results => {
				const details = { actorId, results, subject, data };
				this.emit(`${actor}.${relationship}.${type}.add`, details);
				return details;
			});
	}

	remove (actor, actorId, relationship, type, subject, data) {
		actorId = this.getFallbackActorIdIfNecessary(actor, actorId);
		return this.fetchJson('DELETE', `${actor}/${actorId}/${relationship}/${type}/${subject}`, data)
			.then(() => {
				const details = { actorId, subject, data };
				this.emit(`${actor}.${relationship}.${type}.remove`, details);
				return details;
			});
	}

	updateRelationship (actor, actorId, relationship, type, subject, data) {
		actorId = this.getFallbackActorIdIfNecessary(actor, actorId);
		return this.fetchJson('PUT', `${actor}/${actorId}/${relationship}/${type}/${subject}`, data)
			.then(results => {
				const details = { actorId, results, subject, data };
				this.emit(`${actor}.${relationship}.${type}.update`, details);
				return details;
			});
	}

	get (relationship, type, subject) {
		return this.getAll(relationship, type)
			.then(items => items.filter(item => this.getUuid(item) === subject));
	}

	getAll (relationship, type) {
		return new Promise((resolve) => {
			if (this.loaded[`${relationship}.${type}`]) {
				resolve(this.getItems(relationship, type));
			} else {
				document.body.addEventListener(`myft.user.${relationship}.${type}.load`, () => {
					resolve(this.getItems(relationship, type));
				});
			}
		});
	}

	has (relationship, type, subject) {
		return this.get(relationship, type, subject)
			.then(items => items.length > 0);
	}

	getUuid (topic) {
		return topic.uuid;
	}

	getItems (relationship, type) {
		return this.loaded[`${relationship}.${type}`].items || [];
	}

	personaliseUrl (url) {
		return session.uuid()
			.then(({ uuid }) => {
				return personaliseUrl(url, uuid);
			});
	}

	//private
	getFallbackActorIdIfNecessary (actor, actorId) {
		if (!actorId) {
			if (actor === 'user') {
				return this.userId;
			} else {
				throw new Error('no actorId specified');
			}
		} else {
			return actorId;
		}
	}

	followPlusDigestEmail (conceptId, conceptData) {
		return this.fetchJson('PUT', `${this.userId}/follow-plus-digest-email/${conceptId}`, conceptData)
			.then(results => {
				const details = {
					actorId: this.userId,
					results,
					subject: conceptId,
					data: conceptData
				};
				this.emit('user.followed.concept.add', details);
				return details;
			});
	}
}

export default MyFtClient;
