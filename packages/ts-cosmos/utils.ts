import { Resource } from "@azure/cosmos";

export const fromResource = <T>(resource: T & Resource): T => {
  const { _etag, _rid, _self, _ts, ...rest } = resource;
  return rest as T;
};
