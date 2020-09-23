import type { Har } from 'har-format';

export function harEntriesInTimeRange(harFile: Har, startTime: Date, endTime: Date) {
  return harFile.log.entries.filter((entry) => {
    // native date parsing
    const entryStartDate = new Date(entry.startedDateTime);

    // entry dose not have clear "end" time, so we just go with if the request have started in the current step
    // todo: Try to filter every request that starts/inflight-ends during current step
    return entryStartDate > startTime && entryStartDate < endTime;
  });
}

export function harInTimeRange(harFile: Har, startTime: Date, endTime: Date) {
  const entries = harFile.log.entries.filter((entry) => {
    // native date parsing
    const entryStartDate = new Date(entry.startedDateTime);

    // entry dose not have clear "end" time, so we just go with if the request have started in the current step
    // todo: Try to filter every request that starts/inflight-ends during current step
    return entryStartDate > startTime && entryStartDate < endTime;
  });

  return {
    ...harFile,
    log: {
      ...harFile.log,
      entries: entries,
    },
  };
}
