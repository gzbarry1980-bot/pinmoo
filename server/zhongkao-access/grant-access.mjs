import { loadConfig } from './config.mjs';
import { openDatabase } from './db.mjs';
import { hmac, normalizePhone } from './security.mjs';

const phone = normalizePhone(process.argv[2]);
const source = process.argv[3] || 'manual';
if (!phone || !['manual', 'test'].includes(source)) {
  console.error('Usage: node grant-access.mjs <mainland-mobile> [manual|test]');
  process.exit(2);
}

const config = loadConfig();
const db = openDatabase(config.dbPath);
try {
  const phoneHash = hmac(config.identityPepper, `phone:${phone}`);
  const user = db.findOrCreateUser(phoneHash, phone.slice(-4));
  const existing = db.activeEntitlement(user.id, config.productCode);
  if (existing) {
    console.log(`Access already active for mobile ending ${phone.slice(-4)} via ${existing.source}`);
  } else {
    db.grantEntitlement({ userId: user.id, productCode: config.productCode, source });
    db.audit({ userId: user.id, action: 'entitlement_granted_cli', detail: { source } });
    console.log(`Access granted for mobile ending ${phone.slice(-4)} via ${source}`);
  }
} finally {
  db.close();
}
