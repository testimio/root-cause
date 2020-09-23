// eslint-disable-next-line import/no-extraneous-dependencies
import stripAnsi from 'strip-ansi';
import type { Plugin } from 'pretty-format';
import escapeStringRegexp from 'escape-string-regexp';
import type { Har } from 'har-format';

export function interestingPartsOfHar(input: Har) {
  return {
    log: {
      ...input.log,
      pages: input.log.pages?.map((page) => ({
        title: page.title,
        _URL: page._URL,
      })),
      entries: input.log.entries.map((entry) => ({
        request: {
          // ...entry.request,
          method: entry.request.method,
          url: entry.request.url,
          postData: entry.request.postData,
          comment: entry.request.comment,
        },
        response: {
          // ...entry.response,
          status: entry.response.status,
          statusText: entry.response.statusText,
          redirectURL: entry.response.redirectURL,
        },
      })),
    },
  };
}

export function getMochaTestTimeZeroPrettyFormatPlugin(): jest.SnapshotSerializerPlugin {
  const plugin: Plugin = {
    test(val) {
      if (typeof val === 'string' && val.match(/\([0-9]+m?s\)/)) {
        return true;
      }

      return false;
    },
    serialize(valueToSerialize: string, config, indentation, depth, refs, printer) {
      return printer(
        valueToSerialize.replace(/\([0-9]+m?s\)/, '(TEST TIME NOISE REMOVED)'),
        config,
        indentation,
        depth,
        refs,
        false
      );
    },
  };

  return plugin;
}

export function getCleanAllPathsPrettyFormatPlugin(processCwd: string): jest.SnapshotSerializerPlugin {
  let resolvedProjectRoot = processCwd;

  // We are running in one of the packages
  if (processCwd.includes('packages')) {
    if (processCwd.split('packages').length > 2) {
      throw new Error('OOPSS we cant do that safely, need to rethink');
    }

    resolvedProjectRoot = processCwd.split('packages')[0];
  }

  const plugin: Plugin = {
    test(val) {
      if (typeof val === 'string' && val.includes(resolvedProjectRoot)) {
        return true;
      }

      return false;
    },
    serialize(valueToSerialize: string, config, indentation, depth, refs, printer) {
      return printer(
        valueToSerialize.split(resolvedProjectRoot).join('noise_removed/'),
        config,
        indentation,
        depth,
        refs,
        false
      );
    },
  };

  return plugin;
}

/**
 * Postman echo service sometimes gives status text, sometimes not.
 * That's sucks. so we need to turn the snapshot to something more consistent
 * Remove status test :(
 *     -           "text": "Failed to load resource: the server responded with a status of 404 (Not Found)",
 *     +           "text": "Failed to load resource: the server responded with a status of 404 ()",
 *
 *
 *     -           "statusText": "Not Found",
 *     +           "statusText": "",
 */
export function getPostmanEchoWorkaround1PrettyFormatPlugin(): jest.SnapshotSerializerPlugin {
  const plugin: Plugin = {
    test(val) {
      if (val === 'OK' || val === 'Not Found') {
        return true;
      }

      return false;
    },
    serialize(valueToSerialize: string, config, indentation, depth, refs, printer) {
      return printer('', config, indentation, depth, refs, false);
    },
  };

  return plugin;
}

/**
 * Same as above, for console logs.
 */
export function getPostmanEchoWorkaround2PrettyFormatPlugin(): jest.SnapshotSerializerPlugin {
  const plugin: Plugin = {
    test(val) {
      if (val === 'Failed to load resource: the server responded with a status of 404 (Not Found)') {
        return true;
      }

      return false;
    },
    serialize(valueToSerialize: string, config, indentation, depth, refs, printer) {
      const afterValueToSerialize = 'Failed to load resource: the server responded with a status of 404 ()';
      return printer(afterValueToSerialize, config, indentation, depth, refs, false);
    },
  };

  return plugin;
}

/**
 * extra stack frame exists when running with out run in band vs with
 * that code remotes that stack frame
 */
export function getCleanProcessTicksAndRejectionsStackFramePrettyFormatPlugin(): jest.SnapshotSerializerPlugin {
  const plugin: Plugin = {
    test(val) {
      if (typeof val === 'string' && val.includes('at processTicksAndRejections (internal/process/task_queues.js')) {
        return true;
      }

      return false;
    },
    serialize(valueToSerialize: string, config, indentation, depth, refs, printer) {
      const regExp = new RegExp(
        `${escapeStringRegexp('at processTicksAndRejections (internal/process/task_queues.js')}.+$`,
        'g'
      );
      const afterValueToSerialize = valueToSerialize.replace(regExp, '').trim();
      return printer(afterValueToSerialize, config, indentation, depth, refs, false);
    },
  };

  return plugin;
}

export function getStackCleanStackTracePrettyFormatPlugin(processCwd: string): jest.SnapshotSerializerPlugin {
  let resolvedProjectRoot = processCwd;

  // We are running in one of the packages
  if (processCwd.includes('packages')) {
    if (processCwd.split('packages').length > 2) {
      throw new Error('OOPSS we cant do that safely, need to rethink');
    }

    resolvedProjectRoot = processCwd.split('packages')[0];
  }

  const plugin: Plugin = {
    test(val) {
      if (typeof val === 'string' && val.startsWith('Error:')) {
        return true;
      }

      return false;
    },
    serialize(valueToSerialize: string, config, indentation, depth, refs, printer) {
      return valueToSerialize.split(resolvedProjectRoot).join('noise_removed/');
    },
  };

  return plugin;
}

export function getCleanAnsiPrettyFormatPluginObjectWithMessage(): jest.SnapshotSerializerPlugin {
  const plugin: Plugin = {
    test(val) {
      return !!val && typeof val.message === 'string' && stripAnsi(val.message) !== val.message;
    },
    serialize(valueToSerialize: Error, config, indentation, depth, refs, printer) {
      valueToSerialize.message = stripAnsi(valueToSerialize.message);
      return printer(valueToSerialize, config, indentation, depth, refs, false);
    },
  };

  return plugin;
}

export function getCleanAnsiPrettyFormatPluginFlatString(): jest.SnapshotSerializerPlugin {
  const plugin: Plugin = {
    test(val) {
      return typeof val === 'string' && stripAnsi(val) !== val;
    },
    serialize(valueToSerialize: string, config, indentation, depth, refs, printer) {
      return printer(stripAnsi(valueToSerialize), config, indentation, depth, refs, false);
    },
  };

  return plugin;
}
