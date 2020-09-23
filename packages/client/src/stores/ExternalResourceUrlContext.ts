import { createContext, useContext } from 'react';

export function defaultExternalResourceUrl(resource: string | undefined) {
  if (!resource === undefined) {
    return undefined;
  }

  return `/results/${resource}`;
}

export const GetExternalResourceUrlContext = createContext<(url: string | undefined) => string | undefined>(
  defaultExternalResourceUrl
);

export function useExternalResourceUrl() {
  return useContext(GetExternalResourceUrlContext);
}
