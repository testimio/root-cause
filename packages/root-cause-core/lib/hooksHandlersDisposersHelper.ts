const objectsMap = new WeakMap<object, Map<string, Array<() => void>>>();

export function getDisposersArray(obj: object, topic: string) {
  let mapForGivenObject = objectsMap.get(obj);
  let disposersArrayForGivenTopic = mapForGivenObject ? mapForGivenObject.get(topic) : undefined;

  if (!mapForGivenObject) {
    mapForGivenObject = new Map();
    objectsMap.set(obj, mapForGivenObject);
  }

  if (!disposersArrayForGivenTopic) {
    disposersArrayForGivenTopic = [];
    mapForGivenObject.set(topic, disposersArrayForGivenTopic);
  }

  return disposersArrayForGivenTopic;
}

export function addDisposer(obj: object, topic: string, disposer: () => void) {
  getDisposersArray(obj, topic).push(disposer);
}

export function runAllDisposers(obj: object, topic: string) {
  const allDisposers = getDisposersArray(obj, topic);
  let disposer = allDisposers.pop();
  while (disposer !== undefined) {
    disposer();
    disposer = allDisposers.pop();
  }
}
