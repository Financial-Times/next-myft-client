/*global describe, it, expect, beforeEach, afterEach*/
'use strict';
require('isomorphic-fetch');

const sinon = require('sinon');
const session = require('next-session-client');
const MyFtClient = require('../src/myft-client');
const fixtures = {
	follow: require('./fixtures/follow.json'),
	nofollow: require('./fixtures/nofollow.json'),
	saved: require('./fixtures/saved.json')
};

const userUuid = '989a08e5-28ff-41fb-9627-bd827694060d';

function mockFetch(response, status) {
	return new Promise(function(resolve) {
		resolve({
			ok: true,
			status: status || 200,
			json: function() {
				return Promise.resolve(response);
			}
		});
	});
}

function listenOnce(eventName, func) {
	return new Promise(resolve => {
		document.addEventListener(eventName, function listener (ev) {
			func(ev);
			resolve();
			document.removeEventListener(eventName, listener);
		})
	});
}

describe('Initialising', function() {

	let fetchStub;
	beforeEach(function () {
		fetchStub = sinon.stub(window, 'fetch');
		fetchStub.returns(mockFetch(fixtures.follow));
	});

	afterEach(function () {
		window.fetch.restore();
	});

	it('expecs an apiRoot', function () {
		expect(function () {
			new MyFtClient();
		}).to.throw;
	});

	it('fetches a guid from the session', function (done) {
		document.cookie = 'FTSession=12345';
		sinon.stub(session, 'uuid', function () {
			return Promise.resolve({uuid: userUuid});
		});
		let myFtClient = new MyFtClient({
			apiRoot: 'testRoot/'
		});
		myFtClient.init()
			.then(function () {
				expect(myFtClient.userId).to.equal(userUuid);
				session.uuid.restore();
				done();
			}).catch(done);

	});

	it('exits if no or invalid guid', function (done) {
		document.cookie = 'FTSession=bad';
		sinon.stub(session, 'uuid', function () {
			return Promise.reject();
		});
		let myFtClient = new MyFtClient({
			apiRoot: 'testRoot/'
		});
		myFtClient.init()
			.catch(function () {
				expect(myFtClient.userId).not.to.exist;
				session.uuid.restore();
				done();
			});

	});

	it('exits if undefined guid', function (done) {
		document.cookie = 'FTSession=bad';
		sinon.stub(session, 'uuid', function () {
			return Promise.resolve({uuid: undefined});
		});
		let myFtClient = new MyFtClient({
			apiRoot: 'testRoot/'
		});
		myFtClient.init()
			.catch(function () {
				expect(myFtClient.userId).not.to.exist;
				session.uuid.restore();
				done();
			});

	});


});

describe('Requesting relationships on initialisation', function () {

	let fetchStub;
	let myFtClient;
	beforeEach(function () {
		document.cookie = 'FT_U=_EID=12324_PID=4011101642_TIME=%5BWed%2C+04-Mar-2015+11%3A49%3A49+GMT%5D_RI=0_I=0_';
		fetchStub = sinon.stub(window, 'fetch');
		sinon.stub(session, 'uuid', function () {
			return Promise.resolve({uuid: userUuid});
		});
		myFtClient = new MyFtClient({
			apiRoot: 'testRoot/'
		});
	});

	afterEach(function () {
		window.fetch.restore();
		session.uuid.restore();
		fetchStub.reset();
	});

	function expectLoaded(relationship, type) {
		expect(fetchStub.calledWith(`testRoot/${userUuid}/${relationship}/${type}`)).to.be.true;
	}

	function expectNotLoaded(relationship, type) {
		expect(fetchStub.calledWith(`testRoot/${userUuid}/${relationship}/${type}`)).to.be.false;
	}

	it('should load the right stuff when initialised with defaults', function (done) {

		fetchStub.returns(mockFetch(fixtures.follow));

		myFtClient.init().then(function () {

			expectLoaded('preferred', 'preference');
			expectLoaded('enabled', 'endpoint');
			expectLoaded('created', 'list');

			expectNotLoaded('followed', 'concept');
			expectNotLoaded('saved', 'content');

			done();
		}).catch(done);
	});

	it('should load the right stuff when initialised with additional relationships', function (done) {

		fetchStub.returns(mockFetch(fixtures.follow));

		myFtClient.init([
			{ relationship: 'followed', type: 'concept' }
		]).then(function () {

			expectLoaded('preferred', 'preference');
			expectLoaded('enabled', 'endpoint');
			expectLoaded('created', 'list');
			expectLoaded('followed', 'concept');

			expectNotLoaded('saved', 'content');

			done();
		}).catch(done);
	});
});

describe('url personalising', function () {
	it('should be possible to personalise a url', function (done) {
		document.cookie = 'FT_U=_EID=12324_PID=4011101642_TIME=%5BWed%2C+04-Mar-2015+11%3A49%3A49+GMT%5D_RI=0_I=0_';
		sinon.stub(session, 'uuid', function () {
			return Promise.resolve({uuid:userUuid});
		});
		let myFtClient = new MyFtClient({
			apiRoot: 'testRoot/'
		});

		Promise.all([
			myFtClient.personaliseUrl('/myft'),

			// immutable URLs
			myFtClient.personaliseUrl(`/myft/${userUuid}`)

		]).then(function (results) {
			expect(results.shift()).to.equal(`/myft/${userUuid}`);

			// immutable URLs
			expect(results.shift()).to.equal(`/myft/${userUuid}`);

			session.uuid.restore();
			done();
		}).catch(function(err) {
			session.uuid.restore();
			done(err);
		});

	});
});

describe('endpoints', function() {

	let fetchStub;
	let myFtClient;
	beforeEach(function() {
		document.cookie = 'FT_U=_EID=12324_PID=4011101642_TIME=%5BWed%2C+04-Mar-2015+11%3A49%3A49+GMT%5D_RI=0_I=0_';
		fetchStub = sinon.stub(window, 'fetch');
		sinon.stub(session, 'uuid', function () {
			return Promise.resolve({uuid:userUuid});
		});
		myFtClient = new MyFtClient({
			apiRoot: 'testRoot/'
		});
	});

	afterEach(function() {
		window.fetch.restore();
		session.uuid.restore();
	});

	describe('list contained', function () {

		const listId = 'd88e9f87-7d51-4394-bae4-b5812f817bb5';
		const contentId = 'a5f1544e-920b-11e5-94e6-c5413829caa5';

		beforeEach(function () {
			fetchStub.returns(mockFetch(fixtures.follow)); // ???
		});

		afterEach(function() {
			fetchStub.reset();
		});

		it('can add an item to a list with stringified meta', function (done) {
			myFtClient.init().then(() => {
				let callPromise = myFtClient.add('list', listId, 'contained', 'content', contentId, {
					someKey: "blah"
				});

				let eventPromise = listenOnce('myft.list.contained.content.add', function(evt) {
					expect(evt.detail.subject).to.equal(contentId);
					expect(evt.detail.actorId).to.equal(listId);
				});
				const firstNonLoadCall = fetchStub.args[3];

				expect(firstNonLoadCall[0]).to.equal(`testRoot/list/${listId}/contained/content/${contentId}`);
				expect(firstNonLoadCall[1].method).to.equal('PUT');
				expect(firstNonLoadCall[1].headers['Content-Type']).to.equal('application/json');
				expect(firstNonLoadCall[1]['body']).to.equal('{"someKey":"blah"}');

				return Promise.all([callPromise, eventPromise]).then(results => {
					let callPromiseResult = results[0];
					expect(callPromiseResult.subject).to.equal(contentId);
					expect(callPromiseResult.actorId).to.equal(listId);
					done();
				});


			}).catch(done);
		});

		it('can remove an item from a list', function (done) {
			myFtClient.init().then(() => {
				let callPromise = myFtClient.remove('list', listId, 'contained', 'content', contentId);
				let eventPromise = listenOnce('myft.list.contained.content.remove', function(evt) {
					expect(evt.detail.subject).to.equal(contentId);
					expect(evt.detail.actorId).to.equal(listId);
				});
				const firstNonLoadCall = fetchStub.args[3];

				expect(firstNonLoadCall[0]).to.equal(`testRoot/list/${listId}/contained/content/${contentId}`);
				expect(firstNonLoadCall[1].method).to.equal('DELETE');
				expect(firstNonLoadCall[1].headers['Content-Type']).to.equal('application/json');

				return Promise.all([callPromise, eventPromise]).then(results => {
					let callPromiseResult = results[0];
					expect(callPromiseResult.subject).to.equal(contentId);
					expect(callPromiseResult.actorId).to.equal(listId);
					done();
				});

			}).catch(done);
		});

		it('should error if passed a list and no listID', function (done) {
			myFtClient.init().then(() => {
				myFtClient.add('list', null, 'contained', 'content', contentId);
				throw new Error('Shouldn\'t get here');
			}).catch(err => {
				if(err.message === 'no actorId specified') {
					done();
				} else {
					done(err)
				}
			});
		});

	});

	describe('user followed', function () {

		beforeEach(function () {
			fetchStub.returns(mockFetch(fixtures.follow));
		});

		afterEach(function() {
			fetchStub.reset();
		});

		it('loads follow data from server', function(done) {
			myFtClient.init([
				{ relationship: 'followed', type: 'concept' }
			]).then(function () {
				expect(fetchStub.calledWith(`testRoot/${userUuid}/followed/concept`)).to.be.true;
				listenOnce('myft.user.followed.concept.load', function(evt) {
					expect(myFtClient.loaded['followed.concept']).to.be.exist;
					expect(evt.detail.count).to.equal(18);
					expect(evt.detail.items[0].uuid).to.equal('TnN0ZWluX0dMX0FG-R0w=');
					done();
				});
			}).catch(done);
		});

		it('can get a followed concept by the concept\'s ID', function (done) {
			myFtClient.init([
				{ relationship: 'followed', type: 'concept' }
			]).then(function () {
				return myFtClient.get('followed', 'concept', 'TnN0ZWluX1BOXzIwMDkwNjIzXzI1Mjc=-UE4=').then(stuff => {
					expect(stuff.length).to.equal(1);
					expect(stuff[0].name).to.equal('J.K. Rowling');
					done();
				});
			}).catch(done);
		});

		it('can get all followed concepts', function (done) {
			myFtClient.init([
				{ relationship: 'followed', type: 'concept' }
			]).then(function () {
				return myFtClient.getAll('followed', 'concept').then(stuff => {
					expect(stuff.length).to.equal(18);
					done();
				});
			}).catch(done);
		});

		it('can add a follow with stringified meta and with the default userId', function (done) {
			myFtClient.init().then(function () {
				let callPromise = myFtClient.add('user', null, 'followed', 'concept', 'fds567ksgaj=sagjfhgsy', {
					someKey: "blah"
				});
				let eventPromise = listenOnce('myft.user.followed.concept.add', evt => expect(evt.detail.subject).to.equal('fds567ksgaj=sagjfhgsy'));
				const firstNonLoadCall = fetchStub.args[3];

				expect(firstNonLoadCall[0]).to.equal(`testRoot/user/${userUuid}/followed/concept/fds567ksgaj=sagjfhgsy`);
				expect(firstNonLoadCall[1].method).to.equal('PUT');
				expect(firstNonLoadCall[1].headers['Content-Type']).to.equal('application/json');
				expect(firstNonLoadCall[1]['body']).to.equal('{"someKey":"blah"}');

				return Promise.all([callPromise, eventPromise]).then(results => {
					let callPromiseResult = results[0];
					expect(callPromiseResult.subject).to.equal('fds567ksgaj=sagjfhgsy');
					done();
				});
			})
				.catch(done);
		});

		it('can add a follow with some other userId', function (done) {
			myFtClient.init().then(() => {
				let callPromise = myFtClient.add('user', 'some-other-user-id', 'followed', 'concept', 'fds567ksgaj=sagjfhgsy');
				let eventPromise = listenOnce('myft.user.followed.concept.add', evt => {
					expect(evt.detail.subject).to.equal('fds567ksgaj=sagjfhgsy');
					expect(evt.detail.actorId).to.equal('some-other-user-id');
				});
				const firstNonLoadCall = fetchStub.args[3];

				expect(firstNonLoadCall[0]).to.equal('testRoot/user/some-other-user-id/followed/concept/fds567ksgaj=sagjfhgsy');
				expect(firstNonLoadCall[1].method).to.equal('PUT');
				expect(firstNonLoadCall[1].headers['Content-Type']).to.equal('application/json');

				return Promise.all([callPromise, eventPromise]).then(results => {
					let callPromiseResult = results[0];
					expect(callPromiseResult.subject).to.equal('fds567ksgaj=sagjfhgsy');
					expect(callPromiseResult.actorId).to.equal('some-other-user-id');
					done();
				});

			}).catch(done);
		});

		it('can assert if a topic has been followed', function (done) {
			fetchStub.returns(mockFetch(fixtures.follow));
			myFtClient.init([
				{ relationship: 'followed', type: 'concept' }
			]).then(function () {
				return myFtClient.has('followed', 'concept', 'TnN0ZWluX0dMX0FG-R0w=');
			}).then(function(hasFollowed) {
				expect(hasFollowed).to.be.true;
				done();
			})
				.catch(done);
		});

		it('can assert if a topic has not been followed', function (done) {
			fetchStub.returns(mockFetch(fixtures.nofollow));
			myFtClient.init([
				{ relationship: 'followed', type: 'concept' }
			]).then(function () {
				return myFtClient.has('followed', 'concept', '');
			}).then(function(hasFollowed) {
				expect(hasFollowed).to.be.false;
				done();
			})
				.catch(done);

		});

		it('can remove a follow from the current user', function (done) {
			myFtClient.init().then(function () {
				let callPromise = myFtClient.remove('user', null, 'followed', 'concept', 'fds567ksgaj=sagjfhgsy');
				let eventPromise = listenOnce('myft.user.followed.concept.remove', evt => {
					expect(evt.detail.subject).to.equal('fds567ksgaj=sagjfhgsy');
					expect(evt.detail.actorId).to.equal(userUuid);
				});
				const firstNonLoadCall = fetchStub.args[3];

				expect(firstNonLoadCall[0]).to.equal(`testRoot/user/${userUuid}/followed/concept/fds567ksgaj=sagjfhgsy`);
				expect(firstNonLoadCall[1].method).to.equal('DELETE');
				expect(firstNonLoadCall[1].headers['Content-Type']).to.equal('application/json');

				return Promise.all([callPromise, eventPromise]).then(results => {
					let callPromiseResult = results[0];
					expect(callPromiseResult.subject).to.equal('fds567ksgaj=sagjfhgsy');
					expect(callPromiseResult.actorId).to.equal(userUuid);
					done();
				});
			})
				.catch(done);
		});

		it('can remove a follow from some other user', function (done) {
			myFtClient.init().then(function () {
				let callPromise = myFtClient.remove('user', 'some-other-user-id', 'followed', 'concept', 'fds567ksgaj=sagjfhgsy');
				let eventPromise = listenOnce('myft.user.followed.concept.remove', function (evt) {
					expect(evt.detail.subject).to.equal('fds567ksgaj=sagjfhgsy');
					expect(evt.detail.actorId).to.equal('some-other-user-id');
				});
				const firstNonLoadCall = fetchStub.args[3];

				expect(firstNonLoadCall[0]).to.equal('testRoot/user/some-other-user-id/followed/concept/fds567ksgaj=sagjfhgsy');
				expect(firstNonLoadCall[1].method).to.equal('DELETE');
				expect(firstNonLoadCall[1].headers['Content-Type']).to.equal('application/json');

				return Promise.all([callPromise, eventPromise]).then(results => {
					let callPromiseResult = results[0];
					expect(callPromiseResult.subject).to.equal('fds567ksgaj=sagjfhgsy');
					expect(callPromiseResult.actorId).to.equal('some-other-user-id');
					done();
				});
			})
				.catch(done);
		});
	});

	describe('save for later', function () {
		beforeEach(function () {
			fetchStub.returns(mockFetch(fixtures.saved));
		});

		it('loads save for later data from server', function(done) {
			myFtClient.init([
				{ relationship: 'saved', type: 'content' }
			]).then(function () {
				expect(fetchStub.calledWith(`testRoot/${userUuid}/saved/content`)).to.be.true;
				listenOnce('myft.user.saved.content.load', function(evt) {
					expect(myFtClient.loaded['saved.content']).to.be.exist;
					expect(evt.detail.count).to.equal(3);
					expect(evt.detail.items[0].uuid = 'd4feb2e2-628e-11e5-9846-de406ccb37f2');
					done();
				});
			})
			.catch(done);

		});

		it('can get a saved article by the article\'s UUID', function (done) {
			myFtClient.init([
				{ relationship: 'saved', type: 'content' }
			]).then(function () {
				return myFtClient.get('saved', 'content', '0b020018-52a7-3862-a9df-cb0621078128').then(stuff => {
					expect(stuff.length).to.equal(1);
					done();
				});
			}).catch(done);
		});

		it('can get all saved articles', function (done) {
			myFtClient.init([
				{ relationship: 'saved', type: 'content' }
			]).then(function () {
				return myFtClient.getAll('saved', 'content').then(stuff => {
					expect(stuff.length).to.equal(3);
					done();
				});
			}).catch(done);
		});


		it('can add a save for later with stringified meta', function (done) {
			myFtClient.init().then(function () {
				let callPromise = myFtClient.add('user', null, 'saved', 'content', '12345', {
					someKey: "blah"
				});
				let eventPromise = listenOnce('myft.user.saved.content.add', function(evt) {
					expect(evt.detail.subject).to.equal('12345');
				});
				const firstNonLoadCall = fetchStub.args[3];

				expect(firstNonLoadCall[0]).to.equal(`testRoot/user/${userUuid}/saved/content/12345`);
				expect(firstNonLoadCall[1].method).to.equal('PUT');
				expect(firstNonLoadCall[1].headers['Content-Type']).to.equal('application/json');
				expect(firstNonLoadCall[1]['body']).to.equal('{"someKey":"blah"}');

				return Promise.all([callPromise, eventPromise]).then(results => {
					let callPromiseResult = results[0];
					expect(callPromiseResult.subject).to.equal('12345');
					done();
				});
			})
			.catch(done);

		});

		it('can remove a saved', function (done) {
			myFtClient.init().then(function () {
				let callPromise = myFtClient.remove('user', null, 'saved', 'content', '12345');
				let eventPromise = listenOnce('myft.user.saved.content.remove', function(evt) {
					expect(evt.detail.subject).to.equal('12345');
				});
				const firstNonLoadCall = fetchStub.args[3];

				expect(firstNonLoadCall[0]).to.equal(`testRoot/user/${userUuid}/saved/content/12345`);
				expect(firstNonLoadCall[1].method).to.equal('DELETE');
				expect(firstNonLoadCall[1].headers['Content-Type']).to.equal('application/json');

				return Promise.all([callPromise, eventPromise]).then(results => {
					let callPromiseResult = results[0];
					expect(callPromiseResult.subject).to.equal('12345');
					done();
				});
			});
		});
	});

});
