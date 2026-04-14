function sanitizePathSegment(raw) {
  if (typeof raw !== 'string') return 'data';
  const s = raw.replace(/^\/+/, '').replace(/\.\./g, '').slice(0, 128);
  const safe = s.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return safe || 'data';
}

module.exports = { sanitizePathSegment };
