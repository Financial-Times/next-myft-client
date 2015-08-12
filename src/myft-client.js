'use strict';

var session = require('next-session-client');

var verbConfig = {
	used: {
		category: 'activities',
		subjectPrefix: 'Feature:'
	},
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

		return session.uuid().then(function (data) {

			this.userId = 'User:guid-' + data.uuid;

			this.headers = {
				'Content-Type': 'application/json',
				'X-FT-Session-Token': session.cookie()
			};

			if (opts.follow) {
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

MyFtClient.prototype.get = function (verb, subject) {
	return new Promise(function(resolve, reject) {
		var items = this.loaded && this.loaded[verb] && this.loaded[verb].Items && this.loaded[verb].Items.filter(function(topic) {
			return topic.Self.indexOf(subject) > -1;
		});

		if (this.loaded && this.loaded[verb]) {
			resolve(items);
		} else {
			document.body.addEventListener('myft.' + verb + '.load', function() {
				var items = this.loaded[verb] && this.loaded[verb].Items && this.loaded[verb].Items.filter(function(topic) {
					return topic.Self.indexOf(subject) > -1;
				});
				resolve(items);
			}.bind(this));
		}
	}.bind(this));
};

MyFtClient.prototype.has = function (verb, subject) {
	return this.get(verb, subject).then(function(items) {
		return items.length > 0;
	});
};

MyFtClient.prototype.personaliseUrl = function (url) {
	return session.uuid()
		.then(function (obj) {
			var uuid = obj.uuid;
			if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(url)) {
				return url;
			}

			return url.replace(/myft(\/(?:my-news|saved-articles|my-topics))?\/?/, function ($0, $1) {
				return 'myft' + ($1 || '') + '/' + uuid;
			});
		});
};

module.exports = MyFtClient;
