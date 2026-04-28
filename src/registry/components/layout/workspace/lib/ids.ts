let counter = 0;

export function makeAreaId(): string {
  counter += 1;
  return `area-${Date.now().toString(36)}-${counter.toString(36)}`;
}
