/* global expect */
const sanitize = require('../../src/lib/sanitize-data');

describe('Sanitize data', () => {
	let dummyData;
	let dummyArrayData;
	let sanitizedData;
	let sanitizedArray;
	beforeEach(() => {
		dummyData = {
			isTrue: 'true',
			isFalse: 'false',
			nested: {
				isNestedTrue: 'true',
				isNestedFalse: 'false'
			},
			supernested: {
				nested: {
					subnested: {
						isSuperNestedTrue: 'true',
						isSuperNestedFalse: 'false'	
					}
				}
			},
			list: [
				{
					nestedInArrayTrue: 'true'
				},
				{
					nestedInArrayFalse: 'false'
				}
			]
		};
		dummyArrayData = [
			{ isArrayTrue: 'true' },
			{ isArrayFalse: 'false' },
			[[{
				isNestedArrayTrue: 'true'
			}]]
		];
		sanitizedData = sanitize(dummyData);
		sanitizedArray = sanitize(dummyArrayData);
	});
	afterEach(() => {
		sanitizedData = null;
		sanitizedArray = null;
		dummyData = null;
		dummyArrayData = null;
	});
	it('converts string true to boolean true', () => {
		expect(sanitizedData.isTrue).to.equal(true);
	});
	it('converts string false to boolean false', () => {
		expect(sanitizedData.isFalse).to.equal(false);
	});
	it('converts deep nested objects to boolean true', () => {
		expect(sanitizedData.nested.isNestedTrue).to.equal(true);
	});
	it('converts deep nested objects to boolean false', () => {
		expect(sanitizedData.nested.isNestedFalse).to.equal(false);
	});
	it('recurses into deeply nested objects', () => {
		expect(sanitizedData.supernested.nested.subnested.isSuperNestedTrue).to.equal(true);
		expect(sanitizedData.supernested.nested.subnested.isSuperNestedFalse).to.equal(false);
	});
	it('converts deep nested objects to boolean false', () => {
		expect(sanitizedData.nested.isNestedFalse).to.equal(false);
	});
	it('runs through objects in arrays to convert to boolean true', () => {
		expect(sanitizedData.list[0].nestedInArrayTrue).to.equal(true);
	});
	it('runs through objects in arrays to convert to boolean false', () => {
		expect(sanitizedData.list[1].nestedInArrayFalse).to.equal(false);
	});
	it('works with data structures that are arrays', () => {
		expect(sanitizedArray[0].isArrayTrue).to.equal(true);
		expect(sanitizedArray[1].isArrayFalse).to.equal(false);
	});
	it('works with deeply nested arrays', () => {
		expect(sanitizedArray[2][0][0].isNestedArrayTrue).to.equal(true);
	});
});
