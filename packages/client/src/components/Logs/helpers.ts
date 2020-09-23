import { NormalizedLog, CallFrame, LogLevel } from './interfaces';
import { ConsoleMessage, ConsoleException } from '@testim/root-cause-types';
import { StackUtils } from '../../utils/StackUtils';

const stackUtils = new StackUtils({ cwd: process.cwd() });

export function normalizeError(error: ConsoleException): NormalizedLog {
  const stackTrace = getCallFramesFromError(error);
  return {
    level: 'error',
    message: error.message,
    stackTrace: stackTrace,
    when: new Date(error.timestamp),
    text: error.message,
    location: stackTrace ? `${stackTrace[0].lineNumber}:${stackTrace[0].columnNumber}` : '',
    url: stackTrace ? stackTrace[0].url : '',
    type: 'error',
    command: 'error',
    source: 'javascript',
  };
}

function getCallFramesFromError(error: ConsoleException): CallFrame[] | undefined {
  if (!error.stack) {
    return;
  }

  // remove first error line
  const stackTraceLines = error.stack.split('\n').slice(1);

  const frames = stackTraceLines
    ?.map((line) => stackUtils.parseLine(line))
    .filter((frame): frame is NonNullable<typeof frame> => {
      return frame !== null;
    });

  return frames.map((frame) => ({
    functionName: frame.function || '',
    scriptId: '0',
    url: frame.file || '',
    lineNumber: frame.line ?? 0,
    columnNumber: frame.column ?? 0,
  }));
}

export function normalizeConsoleEntry(consoleEntry: ConsoleMessage): NormalizedLog {
  return {
    // Bummer, but most simple solution
    level: consoleEntry.level as LogLevel,
    message: consoleEntry.text,
    when: new Date(consoleEntry.timestamp),
    text: consoleEntry.text,
    location: `${consoleEntry.line}:${consoleEntry.column}`,
    url: consoleEntry.url,
    type: 'logEntry',
    // Bummer, but most simple solution
    command: consoleEntry.level as LogLevel,
    source: 'javascript',
  };
}
