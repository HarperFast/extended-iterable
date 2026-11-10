import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { ExtendedIterable } from '../index.js';

const indexUrl = new URL('../index.js', import.meta.url).href;

const ok = (value) => () => ({ value, done: false });
const okAsync = (value) => () => Promise.resolve({ value, done: false });
const end = () => ({ value: undefined, done: true });
const endAsync = () => Promise.resolve(end());
const rejectWith = (reason) => () => Promise.reject(reason);
const throwSync = (reason) => () => {
	throw reason;
};

// Each iterate() plays the next attempt's steps, one per next(); the last attempt repeats.
function scripted(...attempts) {
	const iterable = new ExtendedIterable();
	iterable.iterations = 0;
	iterable.iterate = () => {
		const attempt = Math.min(iterable.iterations++, attempts.length - 1);
		const steps = attempts[attempt];
		let step = 0;
		return { next: () => steps[step++]() };
	};
	return iterable;
}

const PENDING = Symbol('pending');
// A hang resolves to PENDING, so it fails fast instead of timing out the suite.
async function settle(promise, ms = 100) {
	let timer;
	const pending = new Promise((resolve) => {
		timer = setTimeout(resolve, ms, PENDING);
	});
	try {
		return await Promise.race([
			Promise.resolve(promise).then(
				(resolved) => ({ resolved }),
				(rejected) => ({ rejected }),
			),
			pending,
		]);
	} finally {
		clearTimeout(timer);
	}
}

test('asArray returns the array synchronously for a synchronous source', () => {
	const iterable = new ExtendedIterable([1, 2, 3]);
	const array = iterable.asArray;
	assert.deepEqual(array, [1, 2, 3]);
	assert.equal(array.iterable, iterable);
	assert.equal(iterable.asArray, array);
	assert.deepEqual(new ExtendedIterable([]).asArray, []);
});

test('asArray resolves an async source and caches the array', async () => {
	const iterable = scripted([okAsync(1), ok(2), okAsync(3), endAsync]);
	const promise = iterable.asArray;
	assert.equal(promise.iterable, iterable);
	assert.equal(iterable.asArray, promise);
	const array = await promise;
	assert.deepEqual(array, [1, 2, 3]);
	assert.equal(array.iterable, iterable);
	assert.equal(iterable.asArray, array);
	assert.equal(iterable.iterations, 1);
});

test('asArray rejects with the error when next() rejects', async () => {
	const denied = new Error('denied');
	const iterable = scripted([okAsync(1), rejectWith(denied)]);
	assert.deepEqual(await settle(iterable.asArray), { rejected: denied });
});

test('asArray rejects when next() throws after an async step', async () => {
	const boom = new Error('boom');
	const iterable = scripted([okAsync(1), throwSync(boom)]);
	assert.deepEqual(await settle(iterable.asArray), { rejected: boom });
});

test('asArray rejects when the first next() throws, and does not cache it', async () => {
	const boom = new Error('boom');
	const iterable = scripted([throwSync(boom)], [ok(1), end]);
	assert.deepEqual(await settle(iterable.asArray), { rejected: boom });
	assert.deepEqual(iterable.asArray, [1]);
	assert.equal(iterable.iterations, 2);
});

test('asArray rejects when iterate() throws, and does not cache it', async () => {
	const boom = new Error('boom');
	const iterable = new ExtendedIterable();
	let iterations = 0;
	iterable.iterate = () => {
		if (iterations++ === 0) throw boom;
		const steps = [ok(1), end];
		let step = 0;
		return { next: () => steps[step++]() };
	};
	assert.deepEqual(await settle(iterable.asArray), { rejected: boom });
	assert.deepEqual(iterable.asArray, [1]);
	assert.equal(iterations, 2);
});

test('a falsy rejection reason is still a failure', async () => {
	for (const reason of [undefined, null, 0, '']) {
		const iterable = scripted([okAsync(1), rejectWith(reason)], [ok(2), end]);
		assert.deepEqual(await settle(iterable.asArray), { rejected: reason });
		assert.deepEqual(iterable.asArray, [2]);
	}
	const iterable = scripted([throwSync(undefined)], [ok(2), end]);
	assert.deepEqual(await settle(iterable.asArray), { rejected: undefined });
	assert.deepEqual(iterable.asArray, [2]);
});

test('asArray iterates again after a rejection, without the earlier elements', async () => {
	const denied = new Error('denied');
	const iterable = scripted(
		[okAsync(1), rejectWith(denied)],
		[okAsync(2), okAsync(3), endAsync],
	);
	const first = iterable.asArray;
	assert.deepEqual(await settle(first), { rejected: denied });
	const second = iterable.asArray;
	assert.notEqual(second, first);
	assert.deepEqual(await second, [2, 3]);
	assert.equal(iterable.iterations, 2);
});

test('concurrent asArray reads share one iteration, then all see the rejection', async () => {
	const denied = new Error('denied');
	const iterable = scripted([okAsync(1), rejectWith(denied)], [ok(2), end]);
	const first = iterable.asArray;
	assert.equal(iterable.asArray, first);
	assert.deepEqual(await settle(first), { rejected: denied });
	assert.equal(iterable.iterations, 1);
	assert.deepEqual(iterable.asArray, [2]);
});

test('toJSON over a failing source iterates once and exposes the rejection', async () => {
	const boom = new Error('boom');
	const iterable = scripted([throwSync(boom)]);
	let thrown;
	try {
		iterable.toJSON();
	} catch (error) {
		thrown = error;
	}
	assert.match(thrown.message, /asArray/);
	assert.equal(iterable.iterations, 1);
	assert.deepEqual(await settle(thrown.resolution), { rejected: boom });
});

test('a handled asArray failure does not terminate a strict-unhandled-rejections process', () => {
	const script = `
		import { ExtendedIterable } from ${JSON.stringify(indexUrl)};
		const scripted = (...steps) => {
			const iterable = new ExtendedIterable();
			iterable.iterate = () => {
				let step = 0;
				return { next: () => steps[step++]() };
			};
			return iterable;
		};
		const okAsync = (value) => () => Promise.resolve({ value, done: false });
		const failures = [
			scripted(okAsync(1), () => Promise.reject(new Error('rejected next'))),
			scripted(okAsync(1), () => { throw new Error('thrown next'); }),
			scripted(() => { throw new Error('thrown first next'); }),
		];
		for (const iterable of failures) {
			await iterable.asArray.then(
				() => { throw new Error('expected a rejection'); },
				() => {},
			);
		}
		await new Promise((resolve) => setImmediate(resolve));
	`;
	execFileSync(
		process.execPath,
		['--unhandled-rejections=strict', '--input-type=module', '--eval', script],
		{ timeout: 10000, stdio: 'pipe' },
	);
});
