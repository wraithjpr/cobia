'use strict';

 /**
  * Cobia polyfills module.
  * This module implements the RST API of the Cobia web application.
  * @module lib/polyfills
  */

/**
 * @summary Array.prototype.includes()
 * @description
 * Polyfill for Array.prototype.includes() that is not implemented in Node.js
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes}
 * @static
 * @returns {void}
 */
function arrayIncludes () {
/* eslint-disable */
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement /*, fromIndex*/) {
      'use strict';
      if (this == null) {
        throw new TypeError('Array.prototype.includes called on null or undefined');
      }

      var O = Object(this);
      var len = parseInt(O.length, 10) || 0;
      if (len === 0) {
        return false;
      }
      var n = parseInt(arguments[1], 10) || 0;
      var k;
      if (n >= 0) {
        k = n;
      } else {
        k = len + n;
        if (k < 0) {k = 0;}
      }
      var currentElement;
      while (k < len) {
        currentElement = O[k];
        if (searchElement === currentElement ||
           (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
          return true;
        }
        k++;
      }
      return false;
    };
  }
  /* eslint-enable */

  return;
}

module.exports.arrayIncludes = arrayIncludes;
