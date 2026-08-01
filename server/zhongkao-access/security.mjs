import crypto from 'node:crypto';

export function hmac(secret, value) {
  return crypto.createHmac('sha256', secret).update(String(value)).digest('hex');
}

export function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function randomCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export const SERIAL_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function randomSerialCode(length = 10) {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += SERIAL_CHARSET[crypto.randomInt(0, SERIAL_CHARSET.length)];
  }
  return code;
}

export function normalizeSerialCode(value) {
  const code = String(value || '').replace(/[\s-]/g, '').toUpperCase();
  return /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{10}$/.test(code) ? code : null;
}

export function normalizeDeviceId(value) {
  const deviceId = String(value || '').trim().toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(deviceId) ? deviceId : null;
}

export function normalizePhone(value) {
  const phone = String(value || '').replace(/[\s-]/g, '');
  if (!/^1[3-9]\d{9}$/.test(phone)) return null;
  return phone;
}

export function parseCookies(header = '') {
  const cookies = {};
  for (const item of header.split(';')) {
    const separator = item.indexOf('=');
    if (separator < 0) continue;
    const key = item.slice(0, separator).trim();
    const value = item.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

export function sessionCookie(config, token, maxAgeSeconds = config.sessionDays * 86400) {
  return cookieWithName(config.cookieName, config, token, maxAgeSeconds);
}

export function serialSessionCookie(config, token, maxAgeSeconds = config.serialSessionDays * 86400) {
  return cookieWithName(config.serialCookieName, config, token, maxAgeSeconds);
}

function cookieWithName(name, config, token, maxAgeSeconds) {
  const parts = [
    `${name}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.max(0, maxAgeSeconds)}`
  ];
  if (config.cookieSecure) parts.push('Secure');
  return parts.join('; ');
}

export function clientIp(request, config) {
  if (config.trustProxy) {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) return String(forwarded).split(',')[0].trim();
  }
  return request.socket.remoteAddress || 'unknown';
}
