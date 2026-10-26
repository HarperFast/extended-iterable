import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ExtendedIterable } from '../index.js';

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

// An iterable whose iterator returns promises from next(), as async sources do.
// `steps` entries: a value, or an Error to reject with.
function asyncSource(steps, counts = { returns: 0 }) {
	const iterable = new ExtendedIterable();
	iterable.iterate = () => {
		let i = 0;
		return {
			next() {
				if (i >= steps.length) return { done: true, value: undefined };
				const step = steps[i++];
				return step instanceof Error
					? Promise.reject(step)
					: Promise.resolve({ value: step });
			},
			return() {
				counts.returns++;
				return { done: true, value: undefined };
			},
		};
	};
	return iterable;
}

test('asArray of a synchronous source is an immediate array', () => {
	const result = source().map((x) => x * 2).asArray;
	assert.ok(Array.isArray(result));
	assert.deepEqual(result, [2, 4, 6, 8]);
});

test('asArray resolves async iteration in order', async () => {
	assert.deepEqual(await asyncSource([1, 2, 3]).asArray, [1, 2, 3]);
});

test('asArray rejects with the error from the first async next()', async () => {
	const error = new Error('first step failed');
	await assert.rejects(asyncSource([error, 2, 3]).asArray, (e) => e === error);
});

test('asArray rejects with the error from a later async next()', async () => {
	const error = new Error('later step failed');
	await assert.rejects(asyncSource([1, 2, error, 4]).asArray, (e) => e === error);
});

test('asArray rejects when a later next() throws synchronously after an async step', async () => {
	const error = new Error('sync throw');
	const iterable = new ExtendedIterable();
	iterable.iterate = () => {
		let i = 0;
		return {
			next() {
				if (i++ === 0) return Promise.resolve({ value: 1 });
				throw error;
			},
		};
	};
	await assert.rejects(iterable.asArray, (e) => e === error);
});

test('asArray closes a synchronous source once when the pipeline throws', async () => {
	const error = new Error('mapper failed');
	let returns = 0;
	const base = new ExtendedIterable();
	base.iterate = () => {
		let i = 0;
		return {
			next: () => (i < 4 ? { value: ++i } : { done: true }),
			return() {
				returns++;
				return { done: true };
			},
		};
	};
	const mapped = base.map((x) => {
		if (x === 3) throw error;
		return x;
	});
	await assert.rejects(mapped.asArray, (e) => e === error);
	assert.equal(returns, 1);
});

test('asArray success does not call return on the source', async () => {
	const counts = { returns: 0 };
	assert.deepEqual(await asyncSource([1, 2, 3], counts).asArray, [1, 2, 3]);
	assert.equal(counts.returns, 0);
});
