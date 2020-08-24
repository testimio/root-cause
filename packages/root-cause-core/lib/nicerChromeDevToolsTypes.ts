import type devtoolsProtocolMapping from 'devtools-protocol/types/protocol-mapping';

export type DevtoolsProtocolRequestWithId = DevtoolsProtocolRequestMapWithId[keyof DevtoolsProtocolRequestMapWithId];

export type DevtoolsProtocolRequestMap = {
  [x in keyof devtoolsProtocolMapping.Commands]: {
    method: x;
    params: devtoolsProtocolMapping.Commands[x]['paramsType'][0];
  };
};

export type DevtoolsProtocolRequestMapWithId = {
  [x in keyof DevtoolsProtocolRequestMap]: DevtoolsProtocolRequestMap[x] & {
    id: number;
    sessionId?: string;
  };
};

export type DevtoolsProtocolRequest = DevtoolsProtocolRequestMap[keyof devtoolsProtocolMapping.Commands];

export type DevtoolsProtocolResponseMap = {
  [x in keyof devtoolsProtocolMapping.Commands]: devtoolsProtocolMapping.Commands[x]['returnType'];
};

export type DevtoolsProtocolEventKeyParamsMap = {
  [x in keyof devtoolsProtocolMapping.Events]: devtoolsProtocolMapping.Events[x][0];
};

export type DevtoolsProtocolEventMap = {
  [x in keyof DevtoolsProtocolEventKeyParamsMap]: {
    method: x;
    params: DevtoolsProtocolEventKeyParamsMap[x];
  };
};

export type DevtoolsProtocolEvent = DevtoolsProtocolEventMap[keyof DevtoolsProtocolEventMap];
