'use strict';

const assert = require('assert');
const block = require('../');


describe('block', () => {
	it('should detect a difference', () => {
		const before = '<html><head><title>before</title></head><body>before</body></html>';
		const after = '<html><head><title>after</title></head><body>after</body></html>';
		const hash1 = block.createHash(before);
		const hash2 = block.createHash(after);
		assert(block.didChange(hash1, hash2));

		const sameHash1 = block.createHash(after);
		const sameHash2 = block.createHash(after);
		assert(!block.didChange(sameHash1, sameHash2));
	});
});
