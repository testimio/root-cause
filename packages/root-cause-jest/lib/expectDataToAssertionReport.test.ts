import {
  expectDataToAssertionReport,
  javascriptValueToVisualTextualRepresentation,
} from './expectDataToAssertionReport';

describe('Test expectDataToAssertionStep', () => {
  test('Simple', () => {
    expect(
      expectDataToAssertionReport({
        expectArgs: [1],
        matcherName: 'toBe',
        matcherArgs: [2],
      })
    ).toMatchInlineSnapshot(`
            Object {
              "fnName": "assertion",
              "name": "expect(1).toBe(2)",
            }
        `);
  });

  test('With not modifier', () => {
    expect(
      expectDataToAssertionReport({
        expectArgs: [{ b: 2 }],
        modifier: 'not',
        matcherName: 'toMatchObject',
        matcherArgs: [{ a: 1 }],
      })
    ).toMatchInlineSnapshot(`
            Object {
              "fnName": "assertion",
              "name": "expect(object).not.toMatchObject(object)",
            }
        `);
  });
});

describe('test javascriptValueToVisualTextualRepresentation', () => {
  test('Long text', () => {
    expect(
      javascriptValueToVisualTextualRepresentation(
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Donec ac odio tempor orci dapibus ultrices. Morbi tincidunt augue interdum velit euismod in pellentesque massa. Enim eu turpis egestas pretium aenean pharetra. Etiam dignissim diam quis enim lobortis scelerisque. Tincidunt lobortis feugiat vivamus at augue eget arcu dictum. Mauris a diam maecenas sed enim ut. Mi in nulla posuere sollicitudin aliquam ultrices sagittis. Tellus cras adipiscing enim eu turpis egestas.'
      )
    ).toMatchInlineSnapshot('"Lorem ipsum dolor sit amet, co...gestas."');
  });
  test('Short text', () => {
    expect(javascriptValueToVisualTextualRepresentation('Lorem ipsum')).toMatchInlineSnapshot('"Lorem ipsum"');
  });

  test('undefined', () => {
    expect(javascriptValueToVisualTextualRepresentation(undefined)).toMatchInlineSnapshot('"undefined"');
  });
  test('null', () => {
    expect(javascriptValueToVisualTextualRepresentation(null)).toMatchInlineSnapshot('"null"');
  });
  test('bigint', () => {
    expect(javascriptValueToVisualTextualRepresentation(BigInt(100))).toMatchInlineSnapshot('"100"');
  });

  test('symbol', () => {
    expect(
      javascriptValueToVisualTextualRepresentation(Symbol('Symbol for VisualTextualRepresentation'))
    ).toMatchInlineSnapshot('"Symbol(Symbol for VisualTextualRepresentation)"');
  });

  test('boolean', () => {
    expect(javascriptValueToVisualTextualRepresentation(true)).toMatchInlineSnapshot('"true"');
  });

  test('function', () => {
    expect(
      javascriptValueToVisualTextualRepresentation(function someFunctionName() {
        // this is here to prevent eslint autofix to arrow function
        // @ts-ignore
        this.toString();
      })
    ).toMatchInlineSnapshot('"function someFunctionName"');
  });

  test('Array', () => {
    expect(javascriptValueToVisualTextualRepresentation([1, 2, 3])).toMatchInlineSnapshot('"Array(length=3)"');
  });

  test('Promise', () => {
    expect(javascriptValueToVisualTextualRepresentation(Promise.resolve('SOME VALUE'))).toMatchInlineSnapshot(
      '"Promise"'
    );
  });

  test('object with constructor', () => {
    expect(javascriptValueToVisualTextualRepresentation(expect.arrayContaining([1]))).toMatchInlineSnapshot(
      '"instanceof(ArrayContaining)"'
    );
  });

  test('plain object / fallback', () => {
    expect(javascriptValueToVisualTextualRepresentation({ a: 1 })).toMatchInlineSnapshot('"object"');
  });
});
