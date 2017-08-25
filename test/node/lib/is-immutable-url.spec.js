const { expect } = require('chai');
const isImmutableUrl = require('../../../src/lib/is-immutable-url');

describe('identifying immutable URLs', () => {
	it('should identify between immutable urls and mutable urls', () => {

		expect(isImmutableUrl('/myft/00000000-0000-0000-0000-000000000000')).to.be.true;
		expect(isImmutableUrl('/myft/following/00000000-0000-0000-0000-000000000000')).to.be.true;
		expect(isImmutableUrl('/myft/saved-articles/00000000-0000-0000-0000-000000000000')).to.be.true;

		expect(isImmutableUrl('/myft/following/')).to.be.false;
		expect(isImmutableUrl('/myft/saved-articles/')).to.be.false;

		expect(isImmutableUrl('/myft/list/00000000-0000-0000-0000-000000000001/')).to.be.true;

		expect(isImmutableUrl('/list/00000000-0000-0000-0000-000000000001')).to.be.true;
		expect(isImmutableUrl('/lists/00000000-0000-0000-0000-000000000000')).to.be.true;

		//Legacy URLs
		expect(isImmutableUrl('/myft/my-news/')).to.be.true;
		expect(isImmutableUrl('/myft/my-topics/')).to.be.true;
		expect(isImmutableUrl('/myft/preferences/')).to.be.true;
		expect(isImmutableUrl('/myft/product-tour')).to.be.true;
	});
});
