/* global console, fetch */
'use strict';

var Notifications = require('./notifications-client');
var session = require('next-session-client');

var verbConfig = {
	followed: {
		category: 'activities',
		subjectPrefix: 'Topic:'
	},
	forlater: {
		category: 'activities',
		subjectPrefix: 'Article:'
	},
	preferred: {
		category: 'activities',
		subjectPrefix: 'Preference:'
	},
	articleFromFollow: {
		category: 'events',
		subjectPrefix: 'Article:'
	}
};

var MyFtClient = function (opts) {
	if (!opts || !opts.apiRoot) {
		throw 'User prefs must be constructed with an api root';
	}
	this.apiRoot = opts.apiRoot;
	this.loaded = {};
};

MyFtClient.prototype.init = function (opts) {
	opts = opts || {};
	if (!this.initialised) {

		// must be created here as its methods are documented in the public api
		this.notifications = new Notifications(this);

		return session.uuid().then(function (data) {

			if (!data) {
				console.warn('No valid user found');
				throw 'No valid user found';
			}
			this.userId = 'User:guid-' + data.uuid;

			this.headers = {
				'Content-Type': 'application/json',
				'X-FT-Session-Token': session.cookie()
			};

			if (opts.follow) {

				document.body.addEventListener('myft.followed.load', function listener (e) {
					document.body.removeEventListener('myft.followed.load', listener);
					if(e.detail.Count && e.detail.Count > 0) {
						this.notifications.start();
					}
				}.bind(this));

				this.load('followed');
			}

			if (opts.saveForLater) {
				this.load('forlater');
			}

			this.load('preferred');

			this.initialised = true;

		}.bind(this));
	} else {
		return Promise.resolve();
	}
};


MyFtClient.prototype.emit = function(name, data) {
	document.body.dispatchEvent(new CustomEvent('myft.' + name, {
		detail: data,
		bubbles: true
	}));
};

MyFtClient.prototype.fetch = function (method, endpoint, meta) {

	var options = {
		method: method,
		headers: this.headers,
		credentials: 'include'
	};

	if (method !== 'GET') {
		options.body = (meta) ? JSON.stringify(meta) : '';
	}

	return fetch(this.apiRoot + endpoint, options)
		.then(function(response) {
			if (response.status >= 400 && response.status < 600) {
				throw 'Network error loading user prefs for ' + endpoint;
			} else {
				return response.json();
			}
		}.bind(this));

};

MyFtClient.prototype.load = function (verb) {
	this.fetch('GET', verbConfig[verb].category + '/' + this.userId + '/' + verb + '/' + verbConfig[verb].subjectPrefix)
		.then(function (results) {
			this.loaded[verb] = results;
			this.emit(verb + '.load', results);
		}.bind(this));
};

MyFtClient.prototype.add = function (verb, subject, meta) {
	this.fetch('PUT', verbConfig[verb].category + '/' + this.userId + '/' + verb + '/' + verbConfig[verb].subjectPrefix + subject, meta)
		.then(function (results) {
			this.emit(verb + '.add', {
				results: results,
				subject: subject,
				meta: meta
			});
		}.bind(this));
};

MyFtClient.prototype.remove = function (verb, subject, meta) {
	this.fetch('DELETE', verbConfig[verb].category + '/' + this.userId + '/' + verb + '/' + verbConfig[verb].subjectPrefix + subject)
		.then(function (result) {
			this.emit(verb + '.remove', {
				subject: subject,
				meta: meta
			});
		}.bind(this));
};

MyFtClient.prototype.has = function (verb, subject) {
	var isLoaded = this.loaded[verb] && this.loaded[verb].Items && this.loaded[verb].Items.some(function(topic) {
		return topic.Self.indexOf(subject) > -1;
	});

	if (isLoaded) {
		return Promise.resolve(true);
	} else {
		return this.fetch('GET', verbConfig[verb].category + '/' + this.userId + '/' + verb + '/' + verbConfig[verb].subjectPrefix + subject)
			.then(function (results) {
				return results.Count > 0;
			}.bind(this));
	}
};

module.exports = MyFtClient;
