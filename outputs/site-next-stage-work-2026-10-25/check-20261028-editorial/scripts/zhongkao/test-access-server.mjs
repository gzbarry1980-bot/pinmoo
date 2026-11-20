import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { openDatabase } from '../../server/zhongkao-access/db.mjs';
import { hmac } from '../../server/zhongkao-access/security.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const port = 18787;
const origin = `http://127.0.0.1:${port}`;

async function waitForServer(child) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`access server exited early: ${child.exitCode}`);
    try {
      const response = await fetch(`${origin}/api/access/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('access server did not become ready');
}

test('账号会话与长期权益保存在服务端，支付未配置时不会产生扣款', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zhongkao-access-test-'));
  const dbPath = path.join(tempDir, 'access.sqlite');
  const sessionSecret = 'test-session-secret-0123456789abcdef';
  const identityPepper = 'test-identity-pepper-0123456789abcdef';
  const child = spawn(process.execPath, ['server/zhongkao-access/server.mjs'], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      HOST: '127.0.0.1',
      PORT: String(port),
      PUBLIC_ORIGIN: origin,
      ALLOWED_ORIGINS: origin,
      DB_PATH: dbPath,
      SESSION_SECRET: sessionSecret,
      IDENTITY_PEPPER: identityPepper,
      COOKIE_SECURE: 'false',
      OTP_PROVIDER: 'console',
      ALLOW_DEV_OTP: 'true',
      PAYMENT_PROVIDER: 'disabled',
      ACCESS_MODE: 'enforce',
      SERIAL_ADMIN_API_KEY: 'test-serial-admin-api-key-0123456789',
      SERIAL_MANAGER_PROXY_USER: 'pinmoo-admin'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });

  try {
    await waitForServer(child);
    const before = await fetch(`${origin}/api/access/auth/check`);
    assert.equal(before.status, 401);

    const phone = '13800138000';
    const codeResponse = await fetch(`${origin}/api/access/auth/request-code`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    assert.equal(codeResponse.status, 200);
    const codeBody = await codeResponse.json();
    assert.match(codeBody.debugCode, /^\d{6}$/);

    const verifyResponse = await fetch(`${origin}/api/access/auth/verify-code`, {
      method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code: codeBody.debugCode })
    });
    assert.equal(verifyResponse.status, 200);
    const cookie = verifyResponse.headers.get('set-cookie').split(';')[0];
    const sessionBeforeGrant = await verifyResponse.json();
    assert.equal(sessionBeforeGrant.authenticated, true);
    assert.equal(sessionBeforeGrant.entitled, false);

    const database = openDatabase(dbPath);
    try {
      const phoneHash = hmac(identityPepper, `phone:${phone}`);
      const user = database.findOrCreateUser(phoneHash, phone.slice(-4));
      database.grantEntitlement({ userId: user.id, productCode: 'guangzhou-zhongkao-lifetime', source: 'test' });
    } finally {
      database.close();
    }

    const sessionResponse = await fetch(`${origin}/api/access/session`, { headers: { Cookie: cookie } });
    const sessionBody = await sessionResponse.json();
    assert.equal(sessionBody.entitled, true);
    assert.equal(sessionBody.entitlement.expiresAt, null);

    const accessResponse = await fetch(`${origin}/api/access/auth/check`, { headers: { Cookie: cookie } });
    assert.equal(accessResponse.status, 204);

    const serialAdminHeaders = { Origin: origin, 'Content-Type': 'application/json', 'X-API-Key': 'test-serial-admin-api-key-0123456789' };
    const generateSerial = await fetch(`${origin}/api/serial-keys/generate`, {
      method: 'POST', headers: serialAdminHeaders, body: JSON.stringify({ count: 1 })
    });
    assert.equal(generateSerial.status, 201);
    const generated = await generateSerial.json();
    const serialCode = generated.records[0].code;
    assert.match(serialCode, /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{10}$/);

    const proxyAuthorizedList = await fetch(`${origin}/api/serial-keys`, { headers: { 'X-Serial-Manager-User': 'pinmoo-admin' } });
    assert.equal(proxyAuthorizedList.status, 200);

    async function redeem(deviceId) {
      return fetch(`${origin}/api/access/serial/redeem`, {
        method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: serialCode, deviceId })
      });
    }
    const deviceA = '550e8400-e29b-41d4-a716-446655440000';
    const deviceB = '550e8400-e29b-41d4-a716-446655440001';
    const deviceC = '550e8400-e29b-41d4-a716-446655440002';
    const firstRedeem = await redeem(deviceA);
    assert.equal(firstRedeem.status, 200);
    assert.equal((await firstRedeem.json()).deviceCount, 1);
    const serialCookie = firstRedeem.headers.get('set-cookie').split(';')[0];
    const repeatedRedeem = await redeem(deviceA);
    assert.equal(repeatedRedeem.status, 200);
    assert.equal((await repeatedRedeem.json()).deviceCount, 1);
    const secondRedeem = await redeem(deviceB);
    assert.equal(secondRedeem.status, 200);
    assert.equal((await secondRedeem.json()).deviceCount, 2);
    const thirdRedeem = await redeem(deviceC);
    assert.equal(thirdRedeem.status, 409);
    assert.equal((await thirdRedeem.json()).code, 'SERIAL_DEVICE_LIMIT');
    const serialAccess = await fetch(`${origin}/api/access/auth/check`, { headers: { Cookie: serialCookie } });
    assert.equal(serialAccess.status, 204);
    const serialSession = await fetch(`${origin}/api/access/session`, { headers: { Cookie: serialCookie } });
    const serialSessionBody = await serialSession.json();
    assert.deepEqual(serialSessionBody.serial, { deviceCount: 2, maxDevices: 2, remainingDevices: 0 });

    const orderResponse = await fetch(`${origin}/api/access/orders`, {
      method: 'POST',
      headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' },
      body: '{}'
    });
    assert.equal(orderResponse.status, 409);

    const logoutResponse = await fetch(`${origin}/api/access/auth/logout`, {
      method: 'POST',
      headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' },
      body: '{}'
    });
    assert.equal(logoutResponse.status, 200);
    const afterLogout = await fetch(`${origin}/api/access/auth/check`, { headers: { Cookie: cookie } });
    assert.equal(afterLogout.status, 401);
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('exit', resolve));
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  assert.equal(stderr, '');
});
