import * as util from './util.js';
import {
  types
} from './types.js';

/**
 * Tokenizes a regular expression (that is currently a string)
 * 
 * @param {string} regexpStr String of regular expression to be tokenized
 * @returns {Object}
 */
const tokenizer = (regexpStr) => {
  let i = 0,
    c;
  let start = {
    type: types.ROOT,
    stack: []
  };

  // Keep track of last clause/group and stack.
  let lastGroup = start;
  let last = start.stack;
  let groupStack = [];


  const repeatErr = (col) => {
    throw new SyntaxError(
      `Invalid regular expression: /${
        regexpStr
      }/: Nothing to repeat at column ${col - 1}`,
    );
  };


  // Iterate through each character in string.
  while (i < regexpStr.length) {
    switch (c = regexpStr[i++]) {

      // Handle custom sets.
      case '[': {
        // Check if this class is a 'not' i.e. [^0-9].
        let not;
        if (regexpStr[i] === '^') {
          not = true;
          i++;
        } else {
          not = false;
        }

        // Get all the characters in class.
        let classTokens = util.tokenizeClass(regexpStr.slice(i), regexpStr);

        // Increase index by length of class.
        i += classTokens[1];
        last.push({
          type: types.SET,
          set: classTokens[0],
          not,
        });

        break;
      }


      // Any character except new line.
      case '.':
        last.push({
          type: types.SET,
          set: [{
            type: types.CHAR,
            value: 10
          }],
          not: true
        });
        break;


      // Push group to stack.
      case '(': {
        // Create group.
        let group = {
          type: types.GROUP,
          stack: [],
          remember: true,
        };

        // Insert subgroup into current group stack.
        last.push(group);

        // Remember the current group for when the group closes.
        groupStack.push(lastGroup);

        // Make this new group the current group.
        lastGroup = group;
        last = group.stack;

        break;
      }


      // Pop group out of stack.
      case ')':
        if (groupStack.length === 0) {
          throw new SyntaxError(
            `Invalid regular expression: /${
              regexpStr
            }/: Unmatched ) at column ${i - 1}`,
          );
        }
        lastGroup = groupStack.pop();

        // Check if this group has alternative branch.
        // To get back the correct last stack.
        last = lastGroup.options ?
          lastGroup.options[lastGroup.options.length - 1] :
          lastGroup.stack;

        break;


      // Use pipe character for alternative branch.
      case '|': {
        // Create array where options are if this is the first PIPE
        // in this clause.
        if (!lastGroup.options) {
          lastGroup.options = [lastGroup.stack];
          delete lastGroup.stack;
        }
        // Create a new stack and add to options for rest of clause.
        let stack = [];
        lastGroup.options.push(stack);
        last = stack;

        break;
      }


      // Repetition.
      // For every repetition, remove last element from last stack
      // then insert back a RANGE object.
      // This design is chosen because there could be more than
      // one repetition symbols in a regex i.e. `a?+{2,3}`.
      case '{': {
        let rs = /^(\d+)(,(\d+)?)?\}/.exec(regexpStr.slice(i)),
          min, max;
        if (rs !== null) {
          if (last.length === 0) {
            repeatErr(i);
          }
          min = parseInt(rs[1], 10);
          max = rs[2] ? rs[3] ? parseInt(rs[3], 10) : Infinity : min;
          i += rs[0].length;

          last.push({
            type: types.REPETITION,
            min,
            max,
            value: last.pop(),
          });
        } else {
          last.push({
            type: types.CHAR,
            value: 123,
          });
        }

        break;
      }

      case '?':
        if (last.length === 0) {
          repeatErr(i);
        }
        last.push({
          type: types.REPETITION,
          min: 0,
          max: 1,
          value: last.pop(),
        });
        break;

      case '+':
        if (last.length === 0) {
          repeatErr(i);
        }
        last.push({
          type: types.REPETITION,
          min: 1,
          max: Infinity,
          value: last.pop(),
        });

        break;

      case '*':
        if (last.length === 0) {
          repeatErr(i);
        }
        last.push({
          type: types.REPETITION,
          min: 0,
          max: Infinity,
          value: last.pop(),
        });

        break;


      // Default is a character that is not `\[](){}?+*^$`.
      default:
        last.push({
          type: types.CHAR,
          value: c.charCodeAt(0),
        });
    }
  }

  // Check if any groups have not been closed.
  if (groupStack.length !== 0) {
    throw new SyntaxError(
      `Invalid regular expression: /${
        regexpStr
      }/: Unterminated group`,
    );
  }

  return start;
};

export default tokenizer;
