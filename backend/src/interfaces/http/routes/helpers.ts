export function routeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export function singleQueryParam(value: unknown) {
  return value?.toString();
}
