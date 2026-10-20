import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as esm from '../index.js';

// Harper and rocksdb-js load the package with require(), which resolves to the
// CommonJS build, so every behavior is checked against both entries.
const cjs = createRequire(import.meta.url)('@harperfast/extended-iterable');

test('require() loads the CommonJS build, not the ES module', () => {
	assert.notEqual(cjs.ExtendedIterable, esm.ExtendedIterable);
	assert.deepEqual(Object.keys(cjs).sort(), Object.keys(esm).sort());
});

for (const [entry, { ExtendedIterable }] of Object.entries({ import: esm, require: cjs })) {
	describe(entry, () => {
		const source = () => new ExtendedIterable([1, 2, 3, 4]);

		test('map', () => {
			assert.deepEqual([...source().map((x, i) => x * 10 + i)], [10, 21, 32, 43]);
		});

		test('filter', () => {
			assert.deepEqual([...source().filter((x) => x % 2 === 0)], [2, 4]);
		});

		test('concat', () => {
			assert.deepEqual([...source().concat([5, 6])], [1, 2, 3, 4, 5, 6]);
			assert.deepEqual(
				[...source().concat(new ExtendedIterable([5]).map((x) => x * 2))],
				[1, 2, 3, 4, 10],
			);
		});

		test('flatMap', () => {
			assert.deepEqual(
				[...source().flatMap((x) => (x % 2 ? [x, x] : x))],
				[1, 1, 2, 3, 3, 4],
			);
		});

		test('forEach', () => {
			const seen = [];
			source()
				.map((x) => x + 1)
				.forEach((x) => seen.push(x));
			assert.deepEqual(seen, [2, 3, 4, 5]);
		});

		test('async map', async () => {
			const seen = [];
			for await (const x of source().map(async (x) => x * 2)) seen.push(x);
			assert.deepEqual(seen, [2, 4, 6, 8]);
		});

		test('next() on an iterable not yet iterated', () => {
			const mapped = source().map((x) => x * 2);
			assert.deepEqual(mapped.next(), { value: 2 });
			assert.deepEqual(mapped.next(), { value: 4 });
			assert.deepEqual(mapped.next(), { value: 6 });
			assert.deepEqual(mapped.next(), { value: 8 });
			assert.equal(mapped.next().done, true);
		});

		test('iterating does not keep the iterator on the iterable', () => {
			const mapped = source().map((x) => x);
			const concatenated = mapped.concat([5]);
			const flatMapped = concatenated.flatMap((x) => [x]);
			assert.deepEqual([...flatMapped], [1, 2, 3, 4, 5]);
			flatMapped.forEach(() => {});
			for (const iterable of [mapped, concatenated, flatMapped])
				assert.equal(iterable.iterator, undefined);
			// each iteration gets its own iterator, and next() continues its own
			assert.equal(flatMapped.next().value, 1);
			assert.deepEqual([...flatMapped], [1, 2, 3, 4, 5]);
			assert.equal(flatMapped.next().value, 2);
		});
	});
}
