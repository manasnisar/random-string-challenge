import DRange from 'drange';
import {
  types
} from './types.js'

/**
 * Generate random string modeled after given tokens.
 *
 * @param {Object} token
 * @param {Array.<string>} groups
 * @return {string}
 */
const parser = (token, groups) => {
  let stack, str;
  switch (token.type) {
    case types.ROOT:
    case types.GROUP:
      // Insert placeholder until group string is generated.
      if (token.remember && token.groupNumber === undefined) {
        token.groupNumber = groups.push(null) - 1;
      }

      stack = token.options ?
        randomSelect(token.options) : token.stack;

      str = '';
      for (let i = 0, l = stack.length; i < l; i++) {
        str += parser(stack[i], groups);
      }

      if (token.remember) {
        groups[token.groupNumber] = str;
      }
      return str;

    case types.SET:
      let expandedSet = expandToken(token);
      if (!expandedSet.length) {
        return '';
      }
      return String.fromCharCode(randomSelect(expandedSet));

    case types.REPETITION:
      // Randomly generate number between min and max.
      let n = randInt(token.min, token.max);

      str = '';
      for (let i = 0; i < n; i++) {
        str += parser(token.value, groups);
      }

      return str;
    case types.CHAR:
      let code = token.value;
      return String.fromCharCode(code);
  }
}

/**
 * Randomly selects and returns a value from the array.
 *
 * @param {Array.<Object>} arr
 * @return {Object}
 */
const randomSelect = (arr) => {
  if (arr instanceof DRange) {
    return arr.index(randInt(0, arr.length - 1));
  }
  return arr[randInt(0, arr.length - 1)];
}

/**
 * Expands a token to a DiscontinuousRange of characters which has a
 * length and an index function (for random selecting).
 *
 * @param {Object} token
 * @return {DiscontinuousRange}
 */
const expandToken = (token) => {
  if (token.type === types.CHAR) {
    return new DRange(token.value);
  } else if (token.type === types.RANGE) {
    return new DRange(token.from, token.to);
  } else {
    let drange = new DRange();
    for (let i = 0; i < token.set.length; i++) {
      let subrange = expandToken(token.set[i]);
      drange.add(subrange);
    }
    if (token.not) {
      return defaultRange().clone().subtract(drange);
    } else {
      return defaultRange().clone().intersect(drange);
    }
  }
}

/**
 * Randomly generates and returns a number between a and b (inclusive).
 *
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
const randInt = (a, b) => {
  return a + Math.floor(Math.random() * (1 + b - a));
}

/**
 * Default range of characters to generate from.
 * 
 *@return {DiscontinuousRange}
 */
const defaultRange = () => {
  return new DRange(32, 126);
}

export default parser;
