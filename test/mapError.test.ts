import { describe, expect, it } from 'vitest';
import { ExtendedIterable } from '../src/extended-iterable.js';
import { assertReturnedThrown, dataMatrix, hasAsyncTestData, hasSyncTestData } from './lib/util.js';

describe('.mapError()', () => {
	for (const [name, testData] of Object.entries(dataMatrix)) {
		if (hasSyncTestData(testData)) {
			describe(`${name} sync`, () => {
				if (testData.syncData) {
					it('should return a mapped iterable with an error with a callback', () => {
						const data = testData.syncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(item => {
							if (item === 2) {
								throw new Error('error');
							}
							return item * 2;
						}).mapError(error => error)[Symbol.iterator]();
						expect(mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(mapErrorIter.next()).toEqual({ value: new Error('error'), done: false });
						expect(mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should return a mapped iterable with an error with a callback returning a string', () => {
						const data = testData.syncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(item => {
							if (item === 2) {
								throw new Error('error');
							}
							return item * 2;
						}).mapError(() => 'error occurred')[Symbol.iterator]();
						expect(mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(mapErrorIter.next()).toEqual({ value: 'error occurred', done: false });
						expect(mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should return a mapped iterable with an error with a callback returning undefined', () => {
						const data = testData.syncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(item => {
							if (item === 2) {
								throw new Error('error');
							}
							return item * 2;
						}).mapError(() => {})[Symbol.iterator]();
						expect(mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(mapErrorIter.next()).toEqual({ value: new Error('error'), done: false });
						expect(mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should return a mapped iterable with an error with an async callback', async () => {
						const data = testData.syncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(item => {
							if (item === 2) {
								throw new Error('error');
							}
							return item * 2;
						}).mapError(async error => error)[Symbol.iterator]();
						expect(await mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: new Error('error'), done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should return a mapped iterable with an error with an async callbacks', async () => {
						const data = testData.syncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(async item => {
							if (item === 2) {
								throw new Error('error');
							}
							return item * 2;
						}).mapError(async error => error)[Symbol.iterator]();
						expect(await mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: new Error('error'), done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should return a mapped iterable with an error without a callback', () => {
						const data = testData.syncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(item => {
							if (item === 2) {
								throw new Error('error');
							}
							return item * 2;
						}).map(item => item).mapError()[Symbol.iterator]();
						expect(mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(mapErrorIter.next()).toEqual({ value: new Error('error'), done: false });
						expect(mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should return a mapped and filterable iterable with an error without a callback', () => {
						const data = testData.syncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.filter(item => {
							if (item === 2) {
								throw new Error('error');
							}
							return item * 2;
						}).mapError()[Symbol.iterator]();
						expect(mapErrorIter.next()).toEqual({ value: 1, done: false });
						expect(mapErrorIter.next()).toEqual({ value: new Error('error'), done: false });
						expect(mapErrorIter.next()).toEqual({ value: 3, done: false });
						assertReturnedThrown(data, 0, 1);
					});

					it('should return a mapped iterable without an error and with a callback', () => {
						const data = testData.syncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(item => item * 2).mapError(error => error)[Symbol.iterator]();
						expect(mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(mapErrorIter.next()).toEqual({ value: 4, done: false });
						expect(mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should return a mapped iterable without an error without a callback', () => {
						const data = testData.syncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(item => item * 2).mapError()[Symbol.iterator]();
						expect(mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(mapErrorIter.next()).toEqual({ value: 4, done: false });
						expect(mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should throw an error if the callback is not a function', () => {
						const data = testData.syncData!(false);
						const iter = new ExtendedIterable<number>(data);
						expect(() => iter.map(item => item * 2).mapError(123 as any)).toThrowError(new TypeError('Callback is not a function'));
					});
				}

				if (testData.syncEmptyData) {
					it('should return an empty iterable if the array is empty', () => {
						const data = testData.syncEmptyData!();
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(item => item * 2).mapError(error => error)[Symbol.iterator]();
						expect(mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});
				}

				if (testData.syncNextThrows) {
					it('should return a mapped iterable with an error if the iterator next() throws an error', () => {
						const data = testData.syncNextThrows!();
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(item => item * 2).mapError(error => error)[Symbol.iterator]();
						expect(mapErrorIter.next()).toEqual({ value: new Error('test'), done: false });
						expect(mapErrorIter.next()).toEqual({ value: 4, done: false });
						expect(mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should return a mapped iterable with an error if the iterator next() throws an error at a specific index', () => {
						const data = testData.syncNextThrows!(2);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(item => item * 2).mapError(error => error)[Symbol.iterator]();
						expect(mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(mapErrorIter.next()).toEqual({ value: new Error('test'), done: false });
						expect(mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});
				}
			});
		}

		if (hasAsyncTestData(testData)) {
			describe(`${name} async`, () => {
				if (testData.asyncData) {
					it('should return a mapped async iterable with an error with a callback', async () => {
						const data = testData.asyncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(async item => {
							if (item === 2) {
								throw new Error('error');
							}
							return item * 2;
						}).mapError(error => error)[Symbol.iterator]();
						expect(await mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: new Error('error'), done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should return a mapped async iterable with an error with a callback returning a string', async () => {
						const data = testData.asyncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(async item => {
							if (item === 2) {
								throw new Error('error');
							}
							return item * 2;
						}).mapError(() => 'error occurred')[Symbol.iterator]();
						expect(await mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 'error occurred', done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should return a mapped async iterable with an error with a callback returning undefined', async () => {
						const data = testData.asyncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(async item => {
							if (item === 2) {
								throw new Error('error');
							}
							return item * 2;
						}).mapError(() => {})[Symbol.iterator]();
						expect(await mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: new Error('error'), done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should return a mapped async iterable with an error with an async callback', async () => {
						const data = testData.asyncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(async item => {
							if (item === 2) {
								throw new Error('error');
							}
							return item * 2;
						}).mapError(async error => error)[Symbol.iterator]();
						expect(await mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: new Error('error'), done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should return a mapped async iterable with an error without a callback', async () => {
						const data = testData.asyncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(async item => {
							if (item === 2) {
								throw new Error('error');
							}
							return item * 2;
						}).mapError()[Symbol.iterator]();
						expect(await mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: new Error('error'), done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should return a mapped async iterable without an error with a callback', async () => {
						const data = testData.asyncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(async item => item * 2).mapError(error => error)[Symbol.iterator]();
						expect(await mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 4, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});

					it('should return a mapped async iterable without an error without a callback', async () => {
						const data = testData.asyncData!(false);
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(async item => item * 2).mapError()[Symbol.iterator]();
						expect(await mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 4, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});
				}

				if (testData.asyncEmptyData) {
					it('should return an empty iterable if the array is empty', async () => {
						const data = testData.asyncEmptyData!();
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(async item => item * 2).mapError(error => error)[Symbol.iterator]();
						expect(await mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});
				}

				if (testData.asyncMixedData) {
					it('should return a mapped async mixed iterable with an error if the iterator next() throws an error', async () => {
						const data = testData.asyncMixedData!();
						const iter = new ExtendedIterable<number>(data);
						const mapErrorIter = iter.map(async item => {
							if (item === 2) {
								throw new Error('test');
							}
							return item * 2;
						}).mapError(error => error)[Symbol.iterator]();
						expect(await mapErrorIter.next()).toEqual({ value: 2, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: new Error('test'), done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 6, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: 8, done: false });
						expect(await mapErrorIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});
				}

				if (testData.asyncNextThrows) {
					it('should return a mapped async iterable with an error if the iterator next() throws an error', async () => {
						const data = testData.asyncNextThrows!();
						const iter = new ExtendedIterable<number>(data);
						const mapIter = iter.map(async item => {
							if (item === 2) {
								throw new Error('test');
							}
							return item * 2;
						}).mapError(error => error)[Symbol.iterator]();
						expect(await mapIter.next()).toEqual({ value: new Error('test'), done: false });
						expect(await mapIter.next()).toEqual({ value: new Error('test'), done: false });
						expect(await mapIter.next()).toEqual({ value: 6, done: false });
						expect(await mapIter.next()).toEqual({ value: 8, done: false });
						expect(await mapIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});
				}

				if (testData.asyncPartialData) {
					it('should return a mapped async iterable with an error from a partial iterable', async () => {
						const data = testData.asyncPartialData!();
						const iter = new ExtendedIterable<number>(data);
						const mapIter = iter.map(item => {
							if (item === 2) {
								throw new Error('test');
							}
							return item * 2;
						}).mapError(error => error)[Symbol.iterator]();
						expect(await mapIter.next()).toEqual({ value: 2, done: false });
						expect(await mapIter.next()).toEqual({ value: new Error('test'), done: false });
						expect(await mapIter.next()).toEqual({ value: 6, done: false });
						expect(await mapIter.next()).toEqual({ value: 8, done: false });
						expect(await mapIter.next()).toEqual({ value: undefined, done: true });
						assertReturnedThrown(data, 0, 0);
					});
				}

				if (testData.asyncPartialNextThrows) {
					it('should return a mapped async iterable with an error if the partial iterator next() throws an error at a specific index', async () => {
						const data = testData.asyncPartialNextThrows!(2);
						const iter = new ExtendedIterable<number>(data);
						const mapIter = iter.map(item => {
							if (item === 2) {
								throw new Error('test');
							}
							return item * 2;
						}).mapError(error => error)[Symbol.iterator]();
						expect(await mapIter.next()).toEqual({ value: 2, done: false });
						expect(await mapIter.next()).toEqual({ value: new Error('test'), done: false });
						assertReturnedThrown(data, 0, 1);
					});
				}
			});
		}
	}
});
