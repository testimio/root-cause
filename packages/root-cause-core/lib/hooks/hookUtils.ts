import { StepError } from '@testim/root-cause-types';

export const NOOP_HOOK = async () => undefined;

export function unknownErrorToOurRepresentation(error: unknown): StepError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  // sometimes errors we get are cross-realm
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const crossRealmError = error as Error;
    return {
      name: crossRealmError?.name ?? '',
      message: crossRealmError?.message ?? '',
      stack: crossRealmError?.stack ?? '',
    };
  }

  // It's unlikely but we might meet here obscure thrown values
  // strings, numbers, objects
  // we may add more logic here to get something out of them
  return {
    name: 'non serializable error?',
    message: 'non serializabsle error',
  };
}
