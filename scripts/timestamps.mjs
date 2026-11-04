export function toIsoTimestamp(value) {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function isIsoTimestamp(value) {
  return typeof value === 'string' && toIsoTimestamp(value) === value;
}
