import { normalizeError, normalizeConsoleEntry } from './helpers';
import resultsFromTestWithManyKindsOfConsoleEntries from './fixtures/resultsFromTestWithManyKindsOfConsoleEntries.json';
import { ConsoleException } from '@testim/root-cause-types';

describe('helpers test', () => {
  test('normalizeConsoleEntry', () => {
    expect(normalizeConsoleEntry(resultsFromTestWithManyKindsOfConsoleEntries.steps[8].consoleEntries[0]))
      .toMatchInlineSnapshot(`
            Object {
              "command": "warning",
              "level": "warning",
              "location": "30:10",
              "message": "Some warning here",
              "source": "javascript",
              "text": "Some warning here",
              "type": "logEntry",
              "url": "http://jsbin.testim.io/tog/1",
              "when": 2020-07-08T10:18:16.007Z,
            }
        `);

    expect(normalizeConsoleEntry(resultsFromTestWithManyKindsOfConsoleEntries.steps[8].consoleEntries[1]))
      .toMatchInlineSnapshot(`
            Object {
              "command": "log",
              "level": "log",
              "location": "34:10",
              "message": "Some console log here",
              "source": "javascript",
              "text": "Some console log here",
              "type": "logEntry",
              "url": "http://jsbin.testim.io/tog/1",
              "when": 2020-07-08T10:18:16.007Z,
            }
        `);

    expect(normalizeConsoleEntry(resultsFromTestWithManyKindsOfConsoleEntries.steps[8].consoleEntries[2]))
      .toMatchInlineSnapshot(`
            Object {
              "command": "assert",
              "level": "assert",
              "location": "67:10",
              "message": "the word is %s foo",
              "source": "javascript",
              "text": "the word is %s foo",
              "type": "logEntry",
              "url": "http://jsbin.testim.io/tog/1",
              "when": 2020-07-08T10:18:16.508Z,
            }
        `);

    expect(normalizeConsoleEntry(resultsFromTestWithManyKindsOfConsoleEntries.steps[8].consoleEntries[3]))
      .toMatchInlineSnapshot(`
            Object {
              "command": "table",
              "level": "table",
              "location": "77:8",
              "message": "JSHandle@array",
              "source": "javascript",
              "text": "JSHandle@array",
              "type": "logEntry",
              "url": "http://jsbin.testim.io/tog/1",
              "when": 2020-07-08T10:18:16.508Z,
            }
        `);
  });

  test('normalizeError', () => {
    expect(
      normalizeError(resultsFromTestWithManyKindsOfConsoleEntries.steps[8].unhandledExceptions[0] as ConsoleException)
    ).toMatchInlineSnapshot(`
            Object {
              "command": "error",
              "level": "error",
              "location": "27:9",
              "message": "Heya error",
              "source": "javascript",
              "stackTrace": Array [
                Object {
                  "columnNumber": 9,
                  "functionName": "makeError",
                  "lineNumber": 27,
                  "scriptId": "0",
                  "url": "http://jsbin.testim.io/tog/1",
                },
                Object {
                  "columnNumber": 5,
                  "functionName": "HTMLButtonElement.oneMoreStep",
                  "lineNumber": 49,
                  "scriptId": "0",
                  "url": "http://jsbin.testim.io/tog/1",
                },
                Object {
                  "columnNumber": 16,
                  "functionName": "eval",
                  "lineNumber": 3,
                  "scriptId": "0",
                  "url": "__playwright_evaluation_script__220",
                },
                Object {
                  "columnNumber": 24,
                  "functionName": "UtilityScript.callFunction",
                  "lineNumber": 156,
                  "scriptId": "0",
                  "url": "__playwright_evaluation_script__6",
                },
                Object {
                  "columnNumber": 44,
                  "functionName": "UtilityScript.<anonymous>",
                  "lineNumber": 1,
                  "scriptId": "0",
                  "url": "__playwright_evaluation_script__221",
                },
              ],
              "text": "Heya error",
              "type": "error",
              "url": "http://jsbin.testim.io/tog/1",
              "when": 2020-07-08T10:18:16.007Z,
            }
        `);
  });
});
