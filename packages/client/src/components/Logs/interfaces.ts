export type LogType = 'error' | 'console' | 'logEntry';
export type LogLevel = 'verbose' | 'info' | 'warning' | 'error';
export type LogCommand =
  | 'verbose'
  | 'info'
  | 'warning'
  | 'error'
  | 'log'
  | 'debug'
  | 'dir'
  | 'dirxml'
  | 'table'
  | 'trace'
  | 'clear'
  | 'startGroup'
  | 'startGroupCollapsed'
  | 'endGroup'
  | 'assert'
  | 'profile'
  | 'profileEnd'
  | 'count'
  | 'timeEnd';

export type ConsoleMessagePart = {
  type: string;
  text: string;
  serializationInfo?: string;
};

export interface CallFrame {
  /**
   * JavaScript function name.
   */
  functionName: string;
  /**
   * JavaScript script id.
   */
  scriptId: string;
  /**
   * JavaScript script name or url.
   */
  url: string;
  /**
   * JavaScript script line number (0-based).
   */
  lineNumber: number;
  /**
   * JavaScript script column number (0-based).
   */
  columnNumber: number;
}

export type LogSource =
  | 'xml'
  | 'javascript'
  | 'network'
  | 'console-api'
  | 'storage'
  | 'appcache'
  | 'rendering'
  | 'security'
  | 'other'
  | 'deprecation'
  | 'worker'
  | 'violation'
  | 'intervention'
  | 'recommendation';

export interface NormalizedLog {
  level: LogLevel;
  message: string;
  stackTrace?: CallFrame[];
  when: Date;
  text?: string;
  location: string;
  url?: string;
  type: LogType;
  parts?: ConsoleMessagePart[];
  command: LogCommand;
  origin?: string;
  source: LogSource;
}
