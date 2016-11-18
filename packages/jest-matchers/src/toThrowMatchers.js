/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
/* eslint-disable max-len */

'use strict';

import type {MatchersObject} from 'types/Matchers';

const {
  escapeStrForRegex,
  formatStackTrace,
  separateMessageFromStack,
} = require('jest-util');
const {
  RECEIVED_COLOR,
  getType,
  matcherHint,
  printExpected,
  printWithType,
} = require('jest-matcher-utils');

const equals = global.jasmine.matchersUtil.equals;

const createMatcher = matcherName =>
  (actual: Function, expected: string | Error | RegExp, callback: ?Function) => {
    const value = expected;
    let error;

    try {
      actual();
    } catch (e) {
      error = e;
    }

    if (typeof expected === 'string') {
      expected = new RegExp(escapeStrForRegex(expected));
    }

    if (typeof expected === 'function') {
      return toThrowMatchingError(matcherName, error, expected, callback);
    } else if (expected instanceof RegExp) {
      return toThrowMatchingStringOrRegexp(matcherName, error, expected, value, callback);
    } else if (expected && typeof expected === 'object') {
      return toThrowMatchingErrorInstance(matcherName, error, expected, callback);
    } else if (expected === undefined) {
      const pass = error !== undefined;
      return {
        message: pass
          ? () => matcherHint('.not' + matcherName, 'function', '') + '\n\n' +
            'Expected the function not to throw an error.\n' +
            printActualErrorMessage(error)
          : () => matcherHint(matcherName, 'function', getType(value)) + '\n\n' +
            'Expected the function to throw an error.\n' +
            printActualErrorMessage(error),
        pass,
      };
    } else {
      throw new Error(
        matcherHint('.not' + matcherName, 'function', getType(value)) + '\n\n' +
        'Unexpected argument passed.\nExpected: ' +
        `${printExpected('string')}, ${printExpected('Error (type)')} or ${printExpected('regexp')}.\n` +
        printWithType('Got', String(expected), printExpected),
      );
    }
  };

const matchers: MatchersObject = {
  toThrow: createMatcher('.toThrow'),
  toThrowError: createMatcher('.toThrowError'),
};

const toThrowMatchingStringOrRegexp = (
  name: string,
  error: ?Error,
  pattern: RegExp,
  value: RegExp | string | Error,
  callback: ?Function,
) => {
  if (error && !error.message && !error.name) {
    error = new Error(error);
  }

  const pass = !!(error && error.message.match(pattern));

  if (pass && callback) {
    callback(error);
  }

  const message = pass
    ? () => matcherHint('.not' + name, 'function', getType(value)) + '\n\n' +
      `Expected the function not to throw an error matching:\n` +
      `  ${printExpected(value)}\n` +
      printActualErrorMessage(error)
    : () => matcherHint(name, 'function', getType(value)) + '\n\n' +
      `Expected the function to throw an error matching:\n` +
      `  ${printExpected(value)}\n` +
      printActualErrorMessage(error);

  return {message, pass};
};

const toThrowMatchingErrorInstance = (
  name: string,
  error: ?Error,
  expectedError: Error,
  callback: ?Function,
) => {
  if (error && !error.message && !error.name) {
    error = new Error(error);
  }

  const pass = equals(error, expectedError);

  if (pass && callback) {
    callback(error);
  }

  const message = pass
    ? () => matcherHint('.not' + name, 'function', 'error') + '\n\n' +
      `Expected the function not to throw an error matching:\n` +
      `  ${printExpected(expectedError)}\n` +
      printActualErrorMessage(error)
    : () => matcherHint(name, 'function', 'error') + '\n\n' +
      `Expected the function to throw an error matching:\n` +
      `  ${printExpected(expectedError)}\n` +
      printActualErrorMessage(error);

  return {message, pass};
};

const toThrowMatchingError = (
  name: string,
  error: ?Error,
  ErrorClass: typeof Error,
  callback: ?Function,
) => {
  const pass = !!(error && error instanceof ErrorClass);

  if (pass && callback) {
    callback(error);
  }

  const message = pass
    ? () => matcherHint('.not' + name, 'function', 'type') + '\n\n' +
      `Expected the function not to throw an error of type:\n` +
      `  ${printExpected(ErrorClass.name)}\n` +
      printActualErrorMessage(error)
    : () => matcherHint(name, 'function', 'type') + '\n\n' +
      `Expected the function to throw an error of type:\n` +
      `  ${printExpected(ErrorClass.name)}\n` +
      printActualErrorMessage(error);

  return {message, pass};
};

const printActualErrorMessage = error => {
  if (error) {
    const {message, stack} = separateMessageFromStack(error.stack);
    return (
      `Instead, it threw:\n` +
      RECEIVED_COLOR(
        '  ' + message + formatStackTrace(stack, {
          noStackTrace: false,
          rootDir: process.cwd(),
          testRegex: '',
        }),
      )
    );
  }

  return `But it didn't throw anything.`;
};

module.exports = matchers;
