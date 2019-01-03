module.exports = class Collection extends Map {
	constructor (iterable) {
		super(iterable);
	}

	/**
	 * Obtains the first value(s) in this collection.
	 * @param {number} [amount] Amount of values to obtain from the beginning
	 * @returns {*|Array<*>} A single value if no amount is provided or an array of values, starting from the end if
	 * amount is negative
	 */
	first (amount) {
		if (typeof amount === 'undefined') return this.values().next().value;
		if (amount < 0) return this.last(amount * -1);
		amount = Math.min(this.size, amount);
		const arr = new Array(amount);
		const iter = this.values();
		for (let i = 0; i < amount; i++) arr[i] = iter.next().value;
		return arr;
	}

	/**
	 * Obtains the first key(s) in this collection.
	 * @param {number} [amount] Amount of keys to obtain from the beginning
	 * @returns {*|Array<*>} A single key if no amount is provided or an array of keys, starting from the end if
	 * amount is negative
	 */
	firstKey (amount) {
		if (typeof amount === 'undefined') return this.keys().next().value;
		if (amount < 0) return this.lastKey(amount * -1);
		amount = Math.min(this.size, amount);
		const arr = new Array(amount);
		const iter = this.keys();
		for (let i = 0; i < amount; i++) arr[i] = iter.next().value;
		return arr;
	}

	/**
	 * Searches for all items where their specified property's value is identical to the given value
	 * (`item[prop] === value`).
	 * @param {string} prop The property to test against
	 * @param {*} value The expected value
	 * @returns {Array}
	 * @example
	 * collection.findAll('username', 'Bob');
	 */
	findAll (prop, value) {
		if (typeof prop !== 'string') throw new TypeError('Key must be a string.');
		if (typeof value === 'undefined') throw new Error('Value must be specified.');
		const results = [];
		for (const item of this.values()) {
			if (item[prop] === value) results.push(item);
		}
		return results;
	}

	/**
	 * Searches for a single item where its specified property's value is identical to the given value
	 * (`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is identical to
	 * [Array.find()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find).
	 * <warn>All collections used in Discord.js are mapped using their `id` property, and if you want to find by id you
	 * should use the `get` method. See
	 * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get) for details.</warn>
	 * @param {string|Function} propOrFn The property to test against, or the function to test with
	 * @param {*} [value] The expected value - only applicable and required if using a property for the first argument
	 * @returns {*}
	 * @example
	 * collection.find('username', 'Bob');
	 * @example
	 * collection.find(val => val.username === 'Bob');
	 */
	find (propOrFn, value) {
		if (typeof propOrFn === 'string') {
			if (typeof value === 'undefined') throw new Error('Value must be specified.');
			for (const item of this.values()) {
				if (item[propOrFn] === value) return item;
			}
			return undefined;
		} else if (typeof propOrFn === 'function') {
			for (const [key, val] of this) {
				if (propOrFn(val, key, this)) return val;
			}
			return undefined;
		} else {
			throw new Error('First argument must be a property string or a function.');
		}
	}

	/* eslint-disable max-len */
	/**
	 * Searches for the key of a single item where its specified property's value is identical to the given value
	 * (`item[prop] === value`), or the given function returns a truthy value. In the latter case, this is identical to
	 * [Array.findIndex()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex).
	 * @param {string|Function} propOrFn The property to test against, or the function to test with
	 * @param {*} [value] The expected value - only applicable and required if using a property for the first argument
	 * @returns {*}
	 * @example
	 * collection.findKey('username', 'Bob');
	 * @example
	 * collection.findKey(val => val.username === 'Bob');
	 */
	/* eslint-enable max-len */
	findKey (propOrFn, value) {
		if (typeof propOrFn === 'string') {
			if (typeof value === 'undefined') throw new Error('Value must be specified.');
			for (const [key, val] of this) {
				if (val[propOrFn] === value) return key;
			}
			return undefined;
		} else if (typeof propOrFn === 'function') {
			for (const [key, val] of this) {
				if (propOrFn(val, key, this)) return key;
			}
			return undefined;
		} else {
			throw new Error('First argument must be a property string or a function.');
		}
	}

	/**
	 * Searches for the existence of a single item where its specified property's value is identical to the given value
	 * (`item[prop] === value`), or the given function returns a truthy value.
	 * <warn>Do not use this to check for an item by its ID. Instead, use `collection.has(id)`. See
	 * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/has) for details.</warn>
	 * @param {string|Function} propOrFn The property to test against, or the function to test with
	 * @param {*} [value] The expected value - only applicable and required if using a property for the first argument
	 * @returns {boolean}
	 * @example
	 * if (collection.exists('username', 'Bob')) {
	 *  console.log('user here!');
	 * }
	 * @example
	 * if (collection.exists(user => user.username === 'Bob')) {
	 *  console.log('user here!');
	 * }
	 */
	exists (propOrFn, value) {
		return Boolean(this.find(propOrFn, value));
	}

	filter (fn, thisArg) {
		if (thisArg) fn = fn.bind(thisArg);
		const results = new Collection();
		for (const [key, val] of this) {
			if (fn(val, key, this)) results.set(key, val);
		}
		return results;
	}

	/**
	 * Identical to
	 * [Array.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every).
	 * @param {Function} fn Function used to test (should return a boolean)
	 * @param {Object} [thisArg] Value to use as `this` when executing function
	 * @returns {boolean}
	 */
	every (fn, thisArg) {
		if (thisArg) fn = fn.bind(thisArg);
		for (const [key, val] of this) {
			if (!fn(val, key, this)) return false;
		}
		return true;
	}

	clone () {
		return new this.constructor(this);
	}
};
