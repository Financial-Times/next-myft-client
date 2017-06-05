/*global expect*/
const isValidUuid = require('../../src/lib/is-valid-uuid');

describe('identifying valid UUIDs', () => {
	it('should return true for valid UUIDs', () => {
		expect(isValidUuid('00000000-0000-0000-0000-000000000001')).to.equal(true);
	});

	it('should return false for invalid UUIDs', () => {
		expect(isValidUuid('-')).to.equal(false);
		expect(isValidUuid()).to.equal(false);
	});
});
