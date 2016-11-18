/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

'use strict';

const jestExpect = require('../').expect;
const skipOnWindows = require('skipOnWindows');

// Custom Error class because node versions have different stack trace strings.
class Error {
  constructor(message) {
    this.message = message;
    this.name = 'Error';
    this.stack =
      'Error\n' +
      '  at jestExpect' +
      ' (packages/jest-matchers/src/__tests__/toThrowMatchers-test.js:24:74)';
  }
}

['toThrowError', 'toThrow'].forEach(toThrow => {
  describe('.' + toThrow + '()', () => {
    skipOnWindows.suite();

    class Err extends Error {}
    class Err2 extends Error {}

    test('to throw or not to throw', () => {
      jestExpect(() => { throw new Error('apple'); })[toThrow]();
      jestExpect(() => {}).not[toThrow]();
    });

    describe('strings', () => {
      it('passes', () => {
        jestExpect(() => { throw new Error('apple'); })[toThrow]('apple');
        jestExpect(() => { throw new Error('banana'); })
          .not[toThrow]('apple');
        jestExpect(() => {}).not[toThrow]('apple');
        jestExpect(() => { throw new Error('apple'); })
          [toThrow]('apple', e => { expect(e).toBeInstanceOf(Error); });
        jestExpect(() => { throw new Error('banana'); })
          .not[toThrow]('apple', e => { expect(e).not.toBeInstanceOf(Error); });
      });

      test('did not throw at all', () => {
        expect(() => jestExpect(() => {})[toThrow]('apple'))
          .toThrowErrorMatchingSnapshot();
      });

      test('threw, but message did not match', () => {
        expect(() => {
          jestExpect(() => { throw new Error('apple'); })
            [toThrow]('banana');
        }).toThrowErrorMatchingSnapshot();
      });

      it('properly escapes strings when matching against errors', () => {
        jestExpect(() => { throw new TypeError('"this"? throws.'); })
          [toThrow]('"this"? throws.');
      });

      test('threw, but should not have', () => {
        expect(() => {
          jestExpect(() => { throw new Error('apple'); })
            .not[toThrow]('apple');
        }).toThrowErrorMatchingSnapshot();
      });

      test('threw, but should not have, and callback did not fail', () => {
        expect(() => {
          jestExpect(() => { throw new Error('apple'); })
            .not[toThrow]('apple', e => { expect(e).toBeInstanceOf(Error); });
        }).toThrowErrorMatchingSnapshot();
      });

      test('threw as expected, but callback failed', () => {
        expect(() => {
          jestExpect(() => { throw new Error('apple'); })
            [toThrow]('apple', e => { expect(e).not.toBeInstanceOf(Error); });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('regexp', () => {
      it('passes', () => {
        expect(() => { throw new Error('apple'); })[toThrow](/apple/);
        expect(() => { throw new Error('banana'); }).not[toThrow](/apple/);
        expect(() => {}).not[toThrow](/apple/);
        expect(() => { throw new Error('apple'); })
          [toThrow](/apple/, e => { expect(e).toBeInstanceOf(Error); });
        expect(() => { throw new Error('banana'); })
          .not[toThrow](/apple/, e => { expect(e).not.toBeInstanceOf(Error); });
      });

      test('did not throw at all', () => {
        expect(() => jestExpect(() => {})[toThrow](/apple/))
          .toThrowErrorMatchingSnapshot();
      });

      test('threw, but message did not match', () => {
        expect(() => {
          jestExpect(() => { throw new Error('apple'); })
            [toThrow](/banana/);
        }).toThrowErrorMatchingSnapshot();
      });

      test('threw, but should not have', () => {
        expect(() => {
          jestExpect(() => { throw new Error('apple'); })
            .not[toThrow](/apple/);
        }).toThrowErrorMatchingSnapshot();
      });

      test('threw, but should not have, and callback did not fail', () => {
        expect(() => {
          jestExpect(() => { throw new Error('apple'); })
            .not[toThrow]('apple', e => { expect(e).toBeInstanceOf(Error); });
        }).toThrowErrorMatchingSnapshot();
      });

      test('threw as expected, but callback failed', () => {
        expect(() => {
          jestExpect(() => { throw new Error('apple'); })
            [toThrow](/apple/, e => { expect(e).not.toBeInstanceOf(Error); });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('errors', () => {
      it('works', () => {
        it('passes', () => {
          jestExpect(() => { throw new Err(); })[toThrow](new Err());
          jestExpect(() => { throw new Err('Message'); })
            [toThrow](new Err('Message'));
          jestExpect(() => { throw new Err(); })[toThrow](new Error());
          jestExpect(() => { throw new Err(); }).not[toThrow](new Err2());
          jestExpect(() => {}).not[toThrow](new Err());
          jestExpect(() => { throw new Err(); })
            [toThrow](new Err(), e => { expect(e).toBeInstanceOf(Err); });
          jestExpect(() => { throw new Err(); })
            .not[toThrow](new Err2(), e => {
              expect(e).not.toBeInstanceOf(Err);
            });
        });
      });

      test('threw, but should not have, and callback did not fail', () => {
        expect(() => {
          jestExpect(() => { throw new Err(); })
            .not[toThrow](new Err(), e => { expect(e).toBeInstanceOf(Err); });
        }).toThrowErrorMatchingSnapshot();
      });

      test('threw as expected, but callback failed', () => {
        expect(() => {
          jestExpect(() => { throw new Err(); })[toThrow](new Err(), e => {
            expect(e).not.toBeInstanceOf(Err);
          });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    describe('error class', () => {
      it('passes', () => {
        jestExpect(() => { throw new Err(); })[toThrow](Err);
        jestExpect(() => { throw new Err(); })[toThrow](Error);
        jestExpect(() => { throw new Err(); }).not[toThrow](Err2);
        jestExpect(() => {}).not[toThrow](Err);
        jestExpect(() => { throw new Err(); })[toThrow](Err, e => {
          expect(e).toBeInstanceOf(Err);
        });
        jestExpect(() => { throw new Err(); }).not[toThrow](Err2, e => {
          expect(e).not.toBeInstanceOf(Err);
        });
      });

      test('did not throw at all', () => {
        expect(() => expect(() => {})[toThrow](Err))
          .toThrowErrorMatchingSnapshot();
      });

      test('threw, but class did not match', () => {
        expect(() => {
          jestExpect(() => { throw new Err('apple'); })[toThrow](Err2);
        }).toThrowErrorMatchingSnapshot();
      });

      test('threw, but should not have', () => {
        expect(() => {
          jestExpect(() => { throw new Err('apple'); }).not[toThrow](Err);
        }).toThrowErrorMatchingSnapshot();
      });

      test('threw, but should not have, and callback did not fail', () => {
        expect(() => {
          jestExpect(() => { throw new Err(); })
            .not[toThrow](Err, e => { expect(e).toBeInstanceOf(Err); });
        }).toThrowErrorMatchingSnapshot();
      });

      test('threw as expected, but callback failed', () => {
        expect(() => {
          jestExpect(() => { throw new Err(); })[toThrow](Err, e => {
            expect(e).not.toBeInstanceOf(Err);
          });
        }).toThrowErrorMatchingSnapshot();
      });
    });

    test('invalid arguments', () => {
      expect(() => jestExpect(() => {})[toThrow](111))
        .toThrowErrorMatchingSnapshot();
    });
  });
});
