export function isValidVideoId(id: unknown): id is string {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id);
}

export function isValidBrowseId(id: unknown): id is string {
  return typeof id === 'string' && !id.includes('..') && !id.startsWith('.') && /^[A-Za-z0-9_.-]{1,128}$/.test(id);
}
