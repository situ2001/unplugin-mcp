import _debug from "debug";

export function createDebug(namespace: string) {
  return _debug(namespace);
}

export function createErrorDebug(namespace: string) {
  return _debug(`${namespace}:error`);
}
