/**
 * The code here is mostly based on clickim angular code
 */

import React from 'react';
import classnames from 'classnames';
import styles from './styles.module.scss';
import { NormalizedLog, ConsoleMessagePart } from './interfaces';
import emptyStateImage from './no_logs@3x.svg';

export const LogViewer = React.memo(function LogViewer({
  darkMode,
  isLoading,
  entries,
}: {
  darkMode: boolean;
  isLoading: boolean;
  entries: NormalizedLog[];
}) {
  return (
    <div
      className={classnames(styles['log-wrapper'], {
        [styles['-theme-with-dark-background']]: darkMode,
        [styles['isLoading']]: isLoading,
      })}
    >
      <div className={styles['console-general-wrapper']}>
        {entries.length > 0 && (
          <div className={'console-view-wrapper'}>
            <div id="console-messages" className={styles['console-view']}>
              {entries.map((entry, index) => (
                <LogEntry key={index} entry={entry} />
              ))}
            </div>
          </div>
        )}

        {entries.length === 0 && (
          <div className={styles['List--empty-hero']}>
            <img src={emptyStateImage} alt="No logs available" />
            <h3 className={styles['List--empty-hero-title']}>No logs available</h3>
          </div>
        )}
      </div>
    </div>
  );
});

export function LogEntry({ entry }: { entry: NormalizedLog }) {
  const [logOpened, setLogOpened] = React.useState(false);

  return (
    <div
      className={classnames(styles['console-message-wrapper'], calcCssClass(entry))}
      onClick={() => {
        setLogOpened((oldState) => !oldState);
      }}
    >
      <div className={styles['console-message']}>
        <span className={styles['source-code']}>
          <i
            className={classnames({
              [styles['warnsign']]: entry.level === 'warning',
              [styles['errorsign']]: entry.level === 'error',
            })}
          />
          <i
            className={classnames({
              [styles['Icon-arrowRight']]: isHasStackTrace(entry),
              [styles['downwards']]: logOpened,
            })}
          />
          <span className={styles['console-message-anchor']}>
            <a
              href={entry.url ? removeTrailingRowAndColumnFromUrl(entry.url) : ''}
              target="_blank"
              rel="noopener noreferrer"
              className={styles['link']}
            >
              {entry.url ? trimMiddle(entry.url) : ''}
              {printLocation(entry.location)}
            </a>
            <span className={styles['console-message-time']} title={entry.when.toISOString()}>
              ({entry.when.toLocaleString()})
            </span>
          </span>
          {!shouldFormatConsole(entry) && (
            <span className={styles['console-message-text']}>{getLogMessage(entry)}</span>
          )}
          {shouldFormatConsole(entry) && (
            <span>
              {entry.parts?.map((part, index) => {
                return (
                  <span
                    key={index}
                    className={classnames(styles['console-message-text'], styles[`object-value-${part.type}`], {
                      [styles['hasPrefix']]: hasPrefix(entry, part),
                    })}
                  >
                    {hasPrefix(entry, part) && <span className={getPrefixClass(part)}>{prefixContent(part)}</span>}
                    <span className={styles['actual-message-text']}>{getConsoleMessage(entry, part)}</span>
                    {hasPostfix(entry, part) && <span className={getPostfixClass(part)}>{postfixContent(part)}</span>}
                    &nbsp;
                  </span>
                );
              })}
            </span>
          )}
          {entry.stackTrace && logOpened && (
            <div className={styles['stack-container']}>
              <table>
                <tbody>
                  {entry.stackTrace?.map((frame, index) => {
                    return (
                      <tr key={index}>
                        <td className={styles['function-name']}>{frame.functionName || '(anonymous)'}</td>
                        <td className={styles['stacktrace-separator']}>@</td>
                        <td className={styles['function-origin']}>
                          {frame.url}:{frame.lineNumber}:{frame.columnNumber}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </span>
      </div>
    </div>
  );
}

function showStackTrace(log: NormalizedLog) {
  return (
    log.level === 'error' ||
    log.level === 'warning' ||
    log.command === 'trace' ||
    log.source === 'network' ||
    log.source === 'violation' ||
    log.command === 'assert'
  );
}

function isHasStackTrace(log: NormalizedLog) {
  return showStackTrace(log) && log.stackTrace && log.stackTrace.length > 0;
}

// https://github.com/ChromeDevTools/devtools-frontend/blob/910988b619ba25e56cf803a411d3c2b52560ec37/front_end/console/ConsoleViewMessage.js#L1340
export function calcCssClass(log: NormalizedLog) {
  const forceAsWarning = !log.source
    ? false
    : (log.level === 'verbose' || log.level === 'info') &&
      (log.source === 'violation' ||
        log.source === 'deprecation' ||
        log.source === 'intervention' ||
        log.source === 'recommendation');

  const forceAsError = log.command === 'assert';

  if (log.command === 'clear') {
    return {
      [styles['console-info']]: true,
    };
  }

  let resolvedLevel = log.level;

  if (forceAsWarning) {
    resolvedLevel = 'warning';
  } else if (forceAsError) {
    resolvedLevel = 'error';
  }

  return {
    [styles[`console-${resolvedLevel}-level`]]: true,
    [styles['has-stack-trace']]: isHasStackTrace(log),
  };
}

function printLocation(location: string) {
  if (!location) return '';
  return `:${location}`;
}

function trimMiddle(url: string, maxChars = 40) {
  if (!url || url.length <= maxChars) return url || '';
  const trimmedUrl = `${url.substr(0, maxChars / 2)}…${url.substr(url.length - maxChars / 2)}`;
  return trimmedUrl;
}

function removeTrailingRowAndColumnFromUrl(url: string) {
  if (/.*:\d+:\d+$/g.test(url)) {
    const removeIndex = url.lastIndexOf(':', url.lastIndexOf(':') - 1);
    const trimmedUrl = url.substr(0, removeIndex);
    return trimmedUrl;
  } else {
    return url;
  }
}

function shouldFormatConsole(log: NormalizedLog) {
  if (log.type !== 'console') return false;
  switch (log.command) {
    case 'assert':
      return false;
    case 'startGroup':
      return false;
    case 'startGroupCollapsed':
      return false;
    case 'endGroup':
      return false;
    case 'clear':
      return false;
    case 'profile':
      return false;
    case 'profileEnd':
      return false;
    default:
      return true;
  }
}

function getConsoleMessage(log: NormalizedLog, part: ConsoleMessagePart) {
  if (part.type === 'function' && hasPrefix(log, part)) {
    return part.text.substring(9);
  }

  // return fixErrorMessage(part.text);
  return part.text;
}

function getPrefixClass(part: ConsoleMessagePart) {
  if (part.type === 'function') {
    return 'object-value-function-prefix';
  }

  if (part.type === 'string') {
    return 'object-value-string-quote';
  }
  return '';
}

function getPostfixClass(part: ConsoleMessagePart) {
  if (part.type === 'string') {
    return 'object-value-string-quote';
  }
  return '';
}

function hasPrefix(log: NormalizedLog, part: ConsoleMessagePart) {
  if (part.type === 'function' && part.text.startsWith('function')) {
    return true;
  }
  return part.type === 'string' && log.parts && log.parts[0] && log.parts[0].type === 'object';
}

function hasPostfix(log: NormalizedLog, part: ConsoleMessagePart) {
  return part.type === 'string' && log.parts && log.parts[0] && log.parts[0].type === 'object';
}

function postfixContent(part: ConsoleMessagePart) {
  if (part.type === 'string') {
    return '"';
  }
  return undefined;
}

function prefixContent(part: ConsoleMessagePart) {
  if (part.type === 'function') return 'ƒ ';
  if (part.type === 'string') {
    return '"';
  }
  return undefined;
}

function getLogMessage(log: NormalizedLog) {
  if (log.type === 'console') {
    switch (log.command) {
      case 'assert':
        return `Assertion Failed: ${log.message}`;
      case 'startGroup':
        return `group start ${log.message}`;
      case 'startGroupCollapsed':
        return `group collapsed (${log.message})`;
      case 'endGroup':
        return `group end (${log.message})`;
      case 'clear':
        return 'Console was cleared';
      case 'profile':
        return `profile ${log.message}`;
      case 'profileEnd':
        return `profile end ${log.message}`;
      default:
        return undefined;
    }
  }

  if (log.source === 'violation') {
    return `[Violation] ${log.message}`;
  }
  if (log.source === 'intervention') {
    return `[Intervention] ${log.message}`;
  }
  if (log.source === 'deprecation') {
    return `[Deprecation] ${log.message}`;
  }
  return log.message;
}
