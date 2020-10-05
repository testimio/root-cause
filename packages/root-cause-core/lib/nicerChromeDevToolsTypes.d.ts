import type { ProtocolMapping } from 'devtools-protocol/types/protocol-mapping';

export type CommandParams = {
  [C in keyof ProtocolMapping.Commands]: ProtocolMapping.Commands[C]['paramsType'];
};

export type CommandReturnType = {
  [C in keyof ProtocolMapping.Commands]: ProtocolMapping.Commands[C]['returnType'];
};

export type EventParams = ProtocolMapping.Events;
