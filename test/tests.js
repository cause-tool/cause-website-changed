var assert = require('assert');
var block = require('../cause-website-changed.js');

describe('block', function() {
	it('should detect a difference', function() {
		var before = '<html><head><title>before</title></head><body>before</body></html>';
		var after = '<html><head><title>after</title></head><body>after</body></html>';
		var hash1 = block.createHash(before);
		var hash2 = block.createHash(after);
		assert(block.didChange(hash1, hash2));

		var sameHash1 = block.createHash(after);
		var sameHash2 = block.createHash(after);
		assert(!block.didChange(sameHash1, sameHash2));
	});
});
