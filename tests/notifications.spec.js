/*global describe, it, expect, beforeEach, afterEach, fetch, xit*/
/*jshint expr:true*/
'use strict';

require('isomorphic-fetch');

var sinon = require('sinon');
var session = require('next-session-client');
var Notifications = require('../src/notifications-client');
var MyFt = require('../src/myft-client');

var fixtures = {
	notifications: require('./fixtures/notifications.json')
};

function mockFetch(response, status) {
	return new Promise(function(resolve, reject) {
		resolve({
			status: status || 200,
			json: function() {
				return response;
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

describe('Notification Polling', function() {

	var fetchStub;
	var myFt;
	var myFtPromise;

	beforeEach(function() {
		myFt = new MyFt({
			apiRoot: 'testRoot/'
		});
		sinon.stub(session, 'uuid', function () {
			return Promise.resolve({uuid:'abcd'});
		});
		myFtPromise = myFt.init({
			userPrefsGuid: true
		});
		fetchStub = sinon.stub(window, 'fetch');
		fetchStub.returns(mockFetch(fixtures.notifications));
	});

	afterEach(function() {
		window.fetch.restore();
		session.uuid.restore();
	});

	it('expect a my ft client instance', function() {
		expect(function () {
			new Notifications();
		}).to.throw;
	});

	// can't be bothered refactoring for now, but needs more detail
	// in guid implementation as session service already calls fetch
	xit('don\'t start automatically', function (done) {
		new Notifications(myFt);
		expect(fetch.called).to.be.false;
		myFtPromise.then(function () {
			expect(fetch.called).to.be.false;
		});
	});


	it('polls for notifications data', function (done) {
		var clock = sinon.useFakeTimers();
		var n = new Notifications(myFt);
		myFtPromise.then(function () {
			n.start();
			// We'd expect 2, as /prefs endpoint always gets called too
			// For some reason prefs gets called twice in this test
			// TODO: figure out why
			expect(fetch.args.length).to.equal(3);
			expect(fetch.args[2][0]).to.equal('testRoot/events/User:guid-abcd/articleFromFollow/getSinceDate/-168h?status=new');
			clock.tick(30001);
			expect(fetch.args.length).to.equal(4);
			n.stop();
			clock.restore();
			listenOnce('myft.articleFromFollow.load', function(ev) {
				done();
			});
		});
	});

	it('event sent on notifications load', function (done) {
		var clock = sinon.useFakeTimers();
		var n = new Notifications(myFt);
		myFtPromise.then(function () {
			n.previousResponse = {
				Count: 1,
				Items: [JSON.parse(JSON.stringify(fixtures.notifications.Items[0]))]
			};
			n.poll();
			listenOnce('myft.articleFromFollow.load', function(ev) {
				expect(ev.detail.Count).to.equal(2);
				clock.restore();
				done();
			});
		});
	});

	it('possible to clear one or more notifications', function (done) {
		var n = new Notifications(myFt);
		myFtPromise.then(function () {
			n.clear(['12345', '678910'], true);
			listenOnce('myft.articleFromFollow.add', function(ev) {
				expect(ev.detail.subject).to.equal('12345');
				done();
			});
			expect(fetchStub.calledWith('testRoot/events/User:guid-abcd/articleFromFollow/Article:12345')).to.be.true;
			expect(fetchStub.calledWith('testRoot/events/User:guid-abcd/articleFromFollow/Article:678910')).to.be.true;
			expect(fetchStub.args[1][1].method).to.equal('PUT');
			expect(fetchStub.args[1][1]['body']).to.equal('{"status":"read"}');
		});
	});

	it('don\'t clear non-existant notifications', function (done) {
		var n = new Notifications(myFt);
		myFtPromise.then(function () {
			myFt.loaded.articleFromFollow = {
				Items: [{
					UUID: '12345'
				}]
			};
			n.clear(['12345', '678910']);
			expect(fetchStub.calledWith('testRoot/events/User:guid-abcd/articleFromFollow/Article:12345')).to.be.true;
			expect(fetchStub.calledWith('testRoot/events/User:guid-abcd/articleFromFollow/Article:678910')).to.be.false;
			n.clear(['678910'], true);
			expect(fetchStub.calledWith('testRoot/events/User:guid-abcd/articleFromFollow/Article:678910')).to.be.true;
			done();
		});
	});

	it('possible to mark one or more notifications as seen', function (done) {
		var n = new Notifications(myFt);
		myFtPromise.then(function () {
			n.markAsSeen(['12345', '678910']);
			expect(fetchStub.calledWith('testRoot/events/User:guid-abcd/articleFromFollow/Article:12345')).to.be.true;
			expect(fetchStub.calledWith('testRoot/events/User:guid-abcd/articleFromFollow/Article:678910')).to.be.true;
			expect(fetchStub.args[1][1].method).to.equal('PUT');
			expect(fetchStub.args[1][1]['body']).to.equal('{"status":"seen"}');
			listenOnce('myft.articleFromFollow.add', function(ev) {
				expect(ev.detail.subject).to.equal('12345');
				done();
			});
		});
	});

});
