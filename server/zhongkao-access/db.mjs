import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

function nowIso() {
  return new Date().toISOString();
}

function futureIso(seconds) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function openDatabase(filename) {
  fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone_hash TEXT NOT NULL UNIQUE,
      phone_last4 TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled','deleted')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS identities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      provider TEXT NOT NULL,
      provider_subject_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(provider, provider_subject_hash)
    );
    CREATE TABLE IF NOT EXISTS otp_challenges (
      id TEXT PRIMARY KEY,
      phone_hash TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      consumed_at TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_otp_phone_created ON otp_challenges(phone_hash, created_at);
    CREATE INDEX IF NOT EXISTS idx_otp_ip_created ON otp_challenges(ip_hash, created_at);
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      product_code TEXT NOT NULL,
      amount_fen INTEGER NOT NULL CHECK(amount_fen > 0),
      currency TEXT NOT NULL DEFAULT 'CNY',
      provider TEXT NOT NULL,
      provider_order_id TEXT UNIQUE,
      status TEXT NOT NULL CHECK(status IN ('pending','paid','closed','refunded','failed')),
      paid_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at);
    CREATE TABLE IF NOT EXISTS entitlements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      product_code TEXT NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('paid','follow','manual','test')),
      status TEXT NOT NULL CHECK(status IN ('active','revoked','expired')),
      order_id TEXT REFERENCES orders(id),
      starts_at TEXT NOT NULL,
      expires_at TEXT,
      revoked_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_entitlement_paid_order ON entitlements(order_id) WHERE order_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_entitlement_access ON entitlements(user_id, product_code, status, expires_at);
    CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      provider_event_id TEXT NOT NULL,
      payload_hash TEXT NOT NULL,
      status TEXT NOT NULL,
      received_at TEXT NOT NULL,
      processed_at TEXT,
      UNIQUE(provider, provider_event_id)
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      subject_id TEXT,
      ip_hash TEXT,
      detail_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS serial_keys (
      code TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK(status IN ('active','invalid')),
      max_devices INTEGER NOT NULL DEFAULT 2 CHECK(max_devices = 2),
      created_at TEXT NOT NULL,
      invalidated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS serial_device_bindings (
      serial_code TEXT NOT NULL REFERENCES serial_keys(code),
      device_hash TEXT NOT NULL,
      bound_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      PRIMARY KEY (serial_code, device_hash)
    );
    CREATE INDEX IF NOT EXISTS idx_serial_bindings_code ON serial_device_bindings(serial_code);
    CREATE TABLE IF NOT EXISTS serial_sessions (
      token_hash TEXT PRIMARY KEY,
      serial_code TEXT NOT NULL REFERENCES serial_keys(code),
      device_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_serial_sessions_serial ON serial_sessions(serial_code);
  `);

  const statements = {
    countOtpPhone: db.prepare(`SELECT COUNT(*) AS count FROM otp_challenges WHERE phone_hash = ? AND created_at >= ?`),
    countOtpIp: db.prepare(`SELECT COUNT(*) AS count FROM otp_challenges WHERE ip_hash = ? AND created_at >= ?`),
    insertOtp: db.prepare(`INSERT INTO otp_challenges (id, phone_hash, code_hash, ip_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)`),
    latestOtp: db.prepare(`SELECT * FROM otp_challenges WHERE phone_hash = ? AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1`),
    incrementOtp: db.prepare(`UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = ?`),
    consumeOtp: db.prepare(`UPDATE otp_challenges SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL`),
    findUserByPhone: db.prepare(`SELECT * FROM users WHERE phone_hash = ? LIMIT 1`),
    insertUser: db.prepare(`INSERT INTO users (id, phone_hash, phone_last4, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`),
    insertSession: db.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)`),
    findSession: db.prepare(`SELECT sessions.*, users.phone_last4, users.status AS user_status FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.revoked_at IS NULL AND sessions.expires_at > ? LIMIT 1`),
    touchSession: db.prepare(`UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?`),
    revokeSession: db.prepare(`UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL`),
    entitlement: db.prepare(`SELECT * FROM entitlements WHERE user_id = ? AND product_code = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > ?) ORDER BY CASE source WHEN 'paid' THEN 1 WHEN 'manual' THEN 2 WHEN 'follow' THEN 3 ELSE 4 END LIMIT 1`),
    insertOrder: db.prepare(`INSERT INTO orders (id, user_id, product_code, amount_fen, currency, provider, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'CNY', ?, 'pending', ?, ?)`),
    findOrder: db.prepare(`SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1`),
    findPendingOrder: db.prepare(`SELECT * FROM orders WHERE user_id = ? AND product_code = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1`),
    grantEntitlement: db.prepare(`INSERT INTO entitlements (id, user_id, product_code, source, status, order_id, starts_at, expires_at, created_at) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)`),
    audit: db.prepare(`INSERT INTO audit_log (id, user_id, action, subject_id, ip_hash, detail_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`),
    insertSerial: db.prepare(`INSERT INTO serial_keys (code, status, max_devices, created_at) VALUES (?, 'active', 2, ?)`),
    findSerial: db.prepare(`SELECT * FROM serial_keys WHERE code = ? LIMIT 1`),
    listSerials: db.prepare(`SELECT serial_keys.*, COUNT(serial_device_bindings.device_hash) AS device_count FROM serial_keys LEFT JOIN serial_device_bindings ON serial_device_bindings.serial_code = serial_keys.code GROUP BY serial_keys.code ORDER BY serial_keys.created_at DESC`),
    invalidateSerial: db.prepare(`UPDATE serial_keys SET status = 'invalid', invalidated_at = ? WHERE code = ? AND status = 'active'`),
    findSerialBinding: db.prepare(`SELECT * FROM serial_device_bindings WHERE serial_code = ? AND device_hash = ? LIMIT 1`),
    countSerialBindings: db.prepare(`SELECT COUNT(*) AS count FROM serial_device_bindings WHERE serial_code = ?`),
    insertSerialBinding: db.prepare(`INSERT INTO serial_device_bindings (serial_code, device_hash, bound_at, last_seen_at) VALUES (?, ?, ?, ?)`),
    touchSerialBinding: db.prepare(`UPDATE serial_device_bindings SET last_seen_at = ? WHERE serial_code = ? AND device_hash = ?`),
    insertSerialSession: db.prepare(`INSERT INTO serial_sessions (token_hash, serial_code, device_hash, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)`),
    findSerialSession: db.prepare(`SELECT serial_sessions.*, serial_keys.status AS serial_status, serial_keys.max_devices AS max_devices FROM serial_sessions JOIN serial_keys ON serial_keys.code = serial_sessions.serial_code WHERE serial_sessions.token_hash = ? AND serial_sessions.revoked_at IS NULL AND serial_sessions.expires_at > ? LIMIT 1`),
    touchSerialSession: db.prepare(`UPDATE serial_sessions SET last_seen_at = ? WHERE token_hash = ?`),
    revokeSerialSession: db.prepare(`UPDATE serial_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL`)
  };

  return {
    raw: db,
    close: () => db.close(),
    otpRate(phoneHash, ipHash) {
      const since = new Date(Date.now() - 3600_000).toISOString();
      return {
        phone: Number(statements.countOtpPhone.get(phoneHash, since).count),
        ip: Number(statements.countOtpIp.get(ipHash, since).count)
      };
    },
    createOtp({ phoneHash, codeHash, ipHash, ttlSeconds }) {
      const id = crypto.randomUUID();
      statements.insertOtp.run(id, phoneHash, codeHash, ipHash, futureIso(ttlSeconds), nowIso());
      return id;
    },
    latestOtp: (phoneHash) => statements.latestOtp.get(phoneHash),
    incrementOtp: (id) => statements.incrementOtp.run(id),
    consumeOtp: (id) => statements.consumeOtp.run(nowIso(), id),
    findOrCreateUser(phoneHash, phoneLast4) {
      let user = statements.findUserByPhone.get(phoneHash);
      if (user) return user;
      const timestamp = nowIso();
      const id = crypto.randomUUID();
      statements.insertUser.run(id, phoneHash, phoneLast4, timestamp, timestamp);
      return statements.findUserByPhone.get(phoneHash);
    },
    createSession(tokenHash, userId, seconds) {
      const timestamp = nowIso();
      statements.insertSession.run(tokenHash, userId, futureIso(seconds), timestamp, timestamp);
    },
    findSession(tokenHash) {
      const session = statements.findSession.get(tokenHash, nowIso());
      if (session) statements.touchSession.run(nowIso(), tokenHash);
      return session || null;
    },
    revokeSession: (tokenHash) => statements.revokeSession.run(nowIso(), tokenHash),
    activeEntitlement: (userId, productCode) => statements.entitlement.get(userId, productCode, nowIso()) || null,
    createOrder(userId, productCode, amountFen, provider) {
      const pending = statements.findPendingOrder.get(userId, productCode);
      if (pending) return pending;
      const timestamp = nowIso();
      const id = `zk_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`;
      statements.insertOrder.run(id, userId, productCode, amountFen, provider, timestamp, timestamp);
      return statements.findOrder.get(id, userId);
    },
    findOrder: (id, userId) => statements.findOrder.get(id, userId) || null,
    grantEntitlement({ userId, productCode, source = 'manual', orderId = null, expiresAt = null }) {
      const id = crypto.randomUUID();
      const timestamp = nowIso();
      statements.grantEntitlement.run(id, userId, productCode, source, orderId, timestamp, expiresAt, timestamp);
      return id;
    },
    createSerial(code) {
      statements.insertSerial.run(code, nowIso());
      return statements.findSerial.get(code);
    },
    listSerials() {
      return statements.listSerials.all().map((record) => ({ ...record, device_count: Number(record.device_count) }));
    },
    findSerial: (code) => statements.findSerial.get(code) || null,
    invalidateSerial(code) {
      return statements.invalidateSerial.run(nowIso(), code).changes > 0;
    },
    bindSerialDevice({ code, deviceHash }) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const serial = statements.findSerial.get(code);
        if (!serial) {
          db.exec('COMMIT');
          return { ok: false, reason: 'not_found' };
        }
        if (serial.status !== 'active') {
          db.exec('COMMIT');
          return { ok: false, reason: 'invalid' };
        }
        const timestamp = nowIso();
        const binding = statements.findSerialBinding.get(code, deviceHash);
        if (binding) {
          statements.touchSerialBinding.run(timestamp, code, deviceHash);
          const count = Number(statements.countSerialBindings.get(code).count);
          db.exec('COMMIT');
          return { ok: true, reused: true, deviceCount: count, maxDevices: serial.max_devices };
        }
        const count = Number(statements.countSerialBindings.get(code).count);
        if (count >= serial.max_devices) {
          db.exec('COMMIT');
          return { ok: false, reason: 'device_limit', deviceCount: count, maxDevices: serial.max_devices };
        }
        statements.insertSerialBinding.run(code, deviceHash, timestamp, timestamp);
        db.exec('COMMIT');
        return { ok: true, reused: false, deviceCount: count + 1, maxDevices: serial.max_devices };
      } catch (error) {
        try { db.exec('ROLLBACK'); } catch {}
        throw error;
      }
    },
    createSerialSession(tokenHash, code, deviceHash, seconds) {
      const timestamp = nowIso();
      statements.insertSerialSession.run(tokenHash, code, deviceHash, futureIso(seconds), timestamp, timestamp);
    },
    findSerialSession(tokenHash) {
      const session = statements.findSerialSession.get(tokenHash, nowIso());
      if (!session || session.serial_status !== 'active') return null;
      const binding = statements.findSerialBinding.get(session.serial_code, session.device_hash);
      if (!binding) return null;
      statements.touchSerialSession.run(nowIso(), tokenHash);
      statements.touchSerialBinding.run(nowIso(), session.serial_code, session.device_hash);
      return { ...session, device_count: Number(statements.countSerialBindings.get(session.serial_code).count) };
    },
    revokeSerialSession: (tokenHash) => statements.revokeSerialSession.run(nowIso(), tokenHash),
    audit({ userId = null, action, subjectId = null, ipHash = null, detail = {} }) {
      statements.audit.run(crypto.randomUUID(), userId, action, subjectId, ipHash, JSON.stringify(detail), nowIso());
    }
  };
}
