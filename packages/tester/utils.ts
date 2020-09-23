export function assertNotNullOrUndefined<T>(value: T): asserts value is Exclude<T, undefined | null | void> {
  if (value === undefined || value === null) {
    throw new Error('value is nullable');
  }
}
