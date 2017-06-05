'use strict';

import chai from 'chai';
const expect = chai.expect;
const isPersonalisedUrl = require('../../src/lib/is-personalised-url');

const userId = '00000000-0000-0000-0000-000000000000';
const listId = '00000000-0000-0000-0000-000000000001';

describe('identifying personalised URLs', () => {
	it('should identify between personalised urls and not personalised urls', () => {

		expect(isPersonalisedUrl(`/${userId}`)).to.be.true;
		expect(isPersonalisedUrl(`/following/${userId}`)).to.be.true;
		expect(isPersonalisedUrl('/following/')).to.be.false;

	});

	it('should identify lists urls as personal', () => {
		expect(isPersonalisedUrl(`/list/${listId}`)).to.be.true;
	});
});
