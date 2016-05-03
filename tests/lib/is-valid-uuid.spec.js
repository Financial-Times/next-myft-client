/*global expect*/
const isValidUuid = require('../../src/lib/is-valid-uuid');

describe('identifying valid UUIDs', () => {
	it('should return true for valid UUIDs', () => {
		expect(isValidUuid('e077a74b-693f-4744-b055-d239f548f356')).to.equal(true);
	});

	it('should return false for invalid UUIDs', () => {
		expect(isValidUuid('-')).to.equal(false);
		expect(isValidUuid()).to.equal(false);
	});
});
