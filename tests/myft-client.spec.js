/*global describe, it, expect, beforeEach, afterEach*/
/*jshint expr:true*/
'use strict';
require('isomorphic-fetch');

var sinon = require('sinon');
var session = require('next-session-client');
var MyFtClient = require('../src/myft-client');
var fixtures = {
	follow: require('./fixtures/follow.json'),
	nofollow: require('./fixtures/nofollow.json'),
	saved: require('./fixtures/saved.json')
};

function mockFetch(response, status) {
	return new Promise(function(resolve, reject) {
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
	document.addEventListener(eventName, function listener (ev) {
		func(ev);
		document.removeEventListener(eventName, listener);
	});
}

describe('Initialising', function() {

	var fetchStub;
	beforeEach(function() {
		fetchStub = sinon.stub(window, 'fetch');
		fetchStub.returns(mockFetch(fixtures.follow));
	});

	afterEach(function() {
		window.fetch.restore();
	});

	it('expecs an apiRoot', function() {
		expect(function () {
			new MyFtClient();
		}).to.throw;
	});

	it('fetches a guid from the session', function(done) {
		document.cookie = 'FTSession=12345';
		sinon.stub(session, 'uuid', function () {
			return Promise.resolve({uuid:'abcd'});
		});
		var myFtClient = new MyFtClient({
			apiRoot: 'testRoot/'
		});
		myFtClient.init({
			follow: false,
			saveForLater: false
		})
		.then(function () {
			expect(myFtClient.userId).to.equal('abcd');
			session.uuid.restore();
			done();
		});

	});

	it('exits if no or invalid guid', function(done) {
		document.cookie = 'FTSession=bad';
		sinon.stub(session, 'uuid', function () {
			return Promise.reject();
		});
		var myFtClient = new MyFtClient({
			apiRoot: 'testRoot/'
		});
		myFtClient.init({
			follow: false,
			saveForLater: false
		})
		.catch(function () {
			expect(myFtClient.userId).not.to.exist;
			session.uuid.restore();
			done();
		});

	});


});

describe('url personalising', function () {
	it('should be possible to personalise a url', function (done) {
		document.cookie = 'FT_U=_EID=12324_PID=4011101642_TIME=%5BWed%2C+04-Mar-2015+11%3A49%3A49+GMT%5D_RI=0_I=0_';
		sinon.stub(session, 'uuid', function () {
			return Promise.resolve({uuid:'abcd'});
		});
		var myFtClient = new MyFtClient({
			apiRoot: 'testRoot/'
		});

		Promise.all([
			myFtClient.personaliseUrl('/myft'),
			myFtClient.personaliseUrl('/myft/'),
			myFtClient.personaliseUrl('/myft/my-news'),
			myFtClient.personaliseUrl('/myft/3f041222-22b9-4098-b4a6-7967e48fe4f7'),
			myFtClient.personaliseUrl('/myft/my-news/'),
			myFtClient.personaliseUrl('/myft/my-news/3f041222-22b9-4098-b4a6-7967e48fe4f7'),
			myFtClient.personaliseUrl('/myft/my-news?query=string'),
			myFtClient.personaliseUrl('/myft/portfolio'),
			myFtClient.personaliseUrl('/myft/portfolio/'),
			myFtClient.personaliseUrl('/myft/product-tour')
		]).then(function (results) {
			expect(results[0]).to.equal('/myft/abcd');
			expect(results[1]).to.equal('/myft/abcd');
			expect(results[2]).to.equal('/myft/my-news/abcd');
			expect(results[3]).to.equal('/myft/3f041222-22b9-4098-b4a6-7967e48fe4f7');
			expect(results[4]).to.equal('/myft/my-news/abcd');
			expect(results[5]).to.equal('/myft/my-news/3f041222-22b9-4098-b4a6-7967e48fe4f7');
			expect(results[6]).to.equal('/myft/my-news/abcd?query=string');
			expect(results[7]).to.equal('/myft/portfolio/abcd');
			expect(results[8]).to.equal('/myft/portfolio/abcd');
			expect(results[9]).to.equal('/myft/product-tour');
			session.uuid.restore();
			done();
		});

	});
});

describe('endpoints', function() {

	var fetchStub;
	var myFtClient;
	beforeEach(function() {
		document.cookie = 'FT_U=_EID=12324_PID=4011101642_TIME=%5BWed%2C+04-Mar-2015+11%3A49%3A49+GMT%5D_RI=0_I=0_';
		fetchStub = sinon.stub(window, 'fetch');
		sinon.stub(session, 'uuid', function () {
			return Promise.resolve({uuid:'abcd'});
		});
		myFtClient = new MyFtClient({
			apiRoot: 'testRoot/'
		});
	});

	afterEach(function() {
		window.fetch.restore();
		session.uuid.restore();
	});

	describe('follow', function () {

		beforeEach(function () {
			fetchStub.returns(mockFetch(fixtures.follow));
		});

		it('loads follow data from server', function(done) {
			myFtClient.init({
				follow: true
			}).then(function () {
				expect(fetchStub.calledWith('testRoot/abcd/followed')).to.be.true;
				listenOnce('myft.followed.load', function(evt) {
					expect(myFtClient.loaded.followed).to.exist;
					expect(evt.detail.Count).to.equal(18);
					expect(evt.detail.Items[0].UUID = 'people:"Basic"');
					done();
				});
			});
		});

		it('can add a follow with stringified meta', function (done) {
			myFtClient.init({
			}).then(function () {
				myFtClient.add('followed', 'fds567ksgaj=sagjfhgsy', {
					someKey: "blah"
				});
				expect(fetchStub.calledWith('testRoot/abcd/followed/fds567ksgaj=sagjfhgsy')).to.be.true;
				expect(fetchStub.args[1][1].method).to.equal('PUT');
				expect(fetchStub.args[1][1].headers['Content-Type']).to.equal('application/json');
				expect(fetchStub.args[1][1]['body']).to.equal('{"someKey":"blah"}');
				listenOnce('myft.followed.add', function(evt) {
					expect(evt.detail.subject).to.equal('fds567ksgaj=sagjfhgsy');
					done();
				});
			});
		});

		it('can assert if a topic has been followed', function (done) {
			fetchStub.returns(mockFetch(fixtures.follow));

			myFtClient.init({
				follow: true
			}).then(function (){
				return myFtClient.has('followed', 'WViODk0MGYtOWE2NC00MzRhLThiNDgtZmIyNDc0YWI3YTYy-UE4=');
			}).then(function(hasFollowed) {
				expect(hasFollowed).to.be.true;
				done();
			});
		});

		it('can assert if a topic has not been followed', function (done) {
			fetchStub.returns(mockFetch(fixtures.nofollow));
			myFtClient.init({
				follow: true
			}).then(function (){
				return myFtClient.has('followed', '');
			}).then(function(hasFollowed) {
				expect(hasFollowed).to.be.false;
				done();
			});
		});

		it('can remove a follow', function (done) {
			myFtClient.init({
			}).then(function () {
				myFtClient.remove('followed', 'fds567ksgaj=sagjfhgsy');

				expect(fetchStub.calledWith('testRoot/abcd/followed/fds567ksgaj=sagjfhgsy')).to.be.true;
				expect(fetchStub.args[1][1].method).to.equal('DELETE');
				expect(fetchStub.args[1][1].headers['Content-Type']).to.equal('application/json');
				listenOnce('myft.followed.remove', function (evt) {
					expect(evt.detail.subject).to.equal('fds567ksgaj=sagjfhgsy');
					done();
				});
			});
		});
	});

	describe('save for later', function () {
		beforeEach(function () {
			fetchStub.returns(mockFetch(fixtures.saved));
		});

		it('loads save for later data from server', function(done) {
			myFtClient.init({
				saveForLater: true
			}).then(function () {
				expect(fetchStub.calledWith('testRoot/abcd/saved')).to.be.true;
				listenOnce('myft.saved.load', function(evt) {
					expect(myFtClient.loaded.saved).to.exist;
					expect(evt.detail.Count).to.equal(33);
					expect(evt.detail.Items[0].UUID = '7be2ae5a-3aa0-11e4-bd08-00144feabdc0');
					done();
				});
			});
		});


		it('can add a save for later with stringified meta', function (done) {
			myFtClient.init({
			}).then(function () {
				myFtClient.add('saved', '12345', {
					someKey: "blah"
				});

				expect(fetchStub.calledWith('testRoot/abcd/saved/12345')).to.be.true;
				expect(fetchStub.args[1][1].method).to.equal('PUT');
				expect(fetchStub.args[1][1].headers['Content-Type']).to.equal('application/json');
				expect(fetchStub.args[1][1]['body']).to.equal('{"someKey":"blah"}');
				listenOnce('myft.saved.add', function(evt) {
					expect(evt.detail.subject).to.equal('12345');
					done();
				});
			});
		});

		it('can remove a saveForLater', function (done) {
			myFtClient.init({
			}).then(function () {
				myFtClient.remove('saved', '12345');

				expect(fetchStub.calledWith('testRoot/abcd/saved/12345')).to.be.true;
				expect(fetchStub.args[1][1].method).to.equal('DELETE');
				expect(fetchStub.args[1][1].headers['Content-Type']).to.equal('application/json');
				listenOnce('myft.saved.remove', function(evt) {
					expect(evt.detail.subject).to.equal('12345');
					done();
				});
			});
		});
	});

	describe('Migration hacks', function () {
		beforeEach(function () {
			fetchStub.returns(mockFetch(fixtures.follow));
		});

		it('can get subject', function (done) {
			myFtClient.init({
				follow: true
			}).then(function () {

				myFtClient.get('followed', 'OTU2OTkwMTYtYTQxZi00OTVkLWIzZDktNmVhOWNmMjhkM2Fi-QnJhbmRz').then(function(result){
					expect(result).to.have.length(1);
				});

				myFtClient.get('followed', 'Topic:OTU2OTkwMTYtYTQxZi00OTVkLWIzZDktNmVhOWNmMjhkM2Fi-QnJhbmRz').then(function(result){
					expect(result).to.have.length(1);
					done();
				});

			});
		});

	});

});
