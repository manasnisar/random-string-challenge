import tokenizer from './src/tokenizer.js';
import parser from './src/parser.js';


/**
 * Generates and returns the random string.
 * 
 * @param {RegExp} expPattern
 * @return {string}
 */
const generate = (expPattern) => {
  //Check if provided argument is indeed a regex
  if (expPattern instanceof RegExp) {
    expPattern = expPattern.source;
  } else {
    throw Error('Expected a regular expression');
  }

  // Tokenize the string
  let tokens = tokenizer(expPattern);

  // Parse the tokens to create a random string
  return parser(tokens, []);
}

console.log(generate(/[-+]?[0-9]{1,16}[.][0-9]{1,6}/));
console.log(generate(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{8}/));
console.log(generate(/.{8,12}/));
console.log(generate(/[^aeiouAEIOU0-9]{5}/));
console.log(generate(/[a-f-]{5}/));
console.log(generate(/(1[0-2]|0[1-9])(:[0-5][0-9]){2} (A|P)M/));
