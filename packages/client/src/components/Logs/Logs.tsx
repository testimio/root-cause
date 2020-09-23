import * as React from 'react';
import type { StepResult } from '@testim/root-cause-types';
import { LogViewer } from './components';
import { normalizeConsoleEntry, normalizeError } from './helpers';

export const Logs = React.memo(function Logs({ step }: { step: StepResult }) {
  const normalizedErrors = React.useMemo(() => {
    return step.unhandledExceptions ? step.unhandledExceptions.map(normalizeError) : [];
  }, [step.unhandledExceptions]);

  const normalizedConsoleEntries = React.useMemo(
    () => (step.consoleEntries ? step.consoleEntries.map(normalizeConsoleEntry) : []),
    [step.consoleEntries]
  );

  const allEntries = React.useMemo(
    () =>
      [...normalizedErrors, ...normalizedConsoleEntries].sort((a, b) => {
        if (a.when.getTime() < b.when.getTime()) {
          return -1;
        } else if (a.when.getTime() === b.when.getTime()) {
          return 0;
        }

        return 1;
      }),
    [normalizedConsoleEntries, normalizedErrors]
  );

  return <LogViewer entries={allEntries} darkMode={false} isLoading={false} />;
});
