import {
    types
  } from './types.js';
  
  /**
   * Turns class into tokens
   * reads str until it encounters a ] not preceeded by a \
   *
   * @param {string} str
   * @param {string} regexpStr
   * @returns {Array.<Array.<Object>, number>}
   */
  export const tokenizeClass = (str, regexpStr) => {
    let tokens = [],
      rs, c;

    // Gets hold of distinct character classes inside a class definition  i.e. "0-9" or "a-f".
    const regexp =
      /\\(?:(w)|(d)|(s)|(W)|(D)|(S))|((?:(?:\\)(.)|([^\]\\]))-(((?:\\)])|(((?:\\)?([^\]])))))|(\])|(?:\\)?([^])/g;


    // Loop through character classes inside a class definition incase there are multiple  e.g. [0-9a-f].
    while ((rs = regexp.exec(str)) !== null) {
      const p = (rs[7] && {
          type: types.RANGE,
          from: (rs[8] || rs[9]).charCodeAt(0),
          to: (c = rs[10]).charCodeAt(c.length - 1),
        }) ??
        ((c = rs[16]) && {
          type: types.CHAR,
          value: c.charCodeAt(0)
        });
  
      if (p) {
        tokens.push(p);
      } else {
        return [tokens, regexp.lastIndex];
      }
    }
  
    throw new SyntaxError(`Invalid regular expression: /${regexpStr}/: Unterminated character class`);
  };
  