import path from 'node:path';

function booleanValue(value, fallback = false) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function integerValue(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const production = nodeEnv === 'production';
  const config = {
    nodeEnv,
    production,
    host: env.HOST || '127.0.0.1',
    port: integerValue(env.PORT, 8787),
    publicOrigin: (env.PUBLIC_ORIGIN || 'http://localhost:8787').replace(/\/$/, ''),
    allowedOrigins: new Set((env.ALLOWED_ORIGINS || env.PUBLIC_ORIGIN || 'http://localhost:8787').split(',').map((item) => item.trim()).filter(Boolean)),
    dbPath: path.resolve(env.DB_PATH || path.join(process.cwd(), 'workspace', 'zhongkao-access.sqlite')),
    staticDir: env.STATIC_DIR ? path.resolve(env.STATIC_DIR) : null,
    accessMode: env.ACCESS_MODE === 'enforce' ? 'enforce' : 'preview',
    otpProvider: env.OTP_PROVIDER || 'disabled',
    paymentProvider: env.PAYMENT_PROVIDER || 'disabled',
    priceFen: integerValue(env.ZHONGKAO_PRICE_FEN, 999),
    productCode: env.ZHONGKAO_PRODUCT_CODE || 'guangzhou-zhongkao-lifetime',
    productName: env.ZHONGKAO_PRODUCT_NAME || '广州中考志愿模拟助手长期使用权',
    sessionSecret: env.SESSION_SECRET || (production ? '' : 'development-session-secret-change-me'),
    identityPepper: env.IDENTITY_PEPPER || (production ? '' : 'development-identity-pepper-change-me'),
    cookieName: env.SESSION_COOKIE_NAME || 'zk_session',
    serialCookieName: env.SERIAL_COOKIE_NAME || 'zk_serial_session',
    cookieSecure: booleanValue(env.COOKIE_SECURE, production),
    sessionDays: integerValue(env.SESSION_DAYS, 30),
    serialSessionDays: integerValue(env.SERIAL_SESSION_DAYS, 180),
    serialMaxDevices: integerValue(env.SERIAL_MAX_DEVICES, 2),
    serialAdminApiKey: env.SERIAL_ADMIN_API_KEY || '',
    serialManagerProxyUser: env.SERIAL_MANAGER_PROXY_USER || '',
    otpTtlSeconds: integerValue(env.OTP_TTL_SECONDS, 300),
    allowDevOtp: booleanValue(env.ALLOW_DEV_OTP, nodeEnv === 'test'),
    trustProxy: booleanValue(env.TRUST_PROXY, production)
  };

  if (!['disabled', 'console'].includes(config.otpProvider)) throw new Error(`Unsupported OTP_PROVIDER: ${config.otpProvider}`);
  if (!['disabled'].includes(config.paymentProvider)) throw new Error(`Unsupported PAYMENT_PROVIDER: ${config.paymentProvider}`);
  if (config.sessionSecret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters');
  if (config.identityPepper.length < 32) throw new Error('IDENTITY_PEPPER must contain at least 32 characters');
  if (config.priceFen !== 999) throw new Error('ZHONGKAO_PRICE_FEN must be 999 until pricing is explicitly revised');
  if (config.serialMaxDevices !== 2) throw new Error('SERIAL_MAX_DEVICES must remain 2 unless the product rule is explicitly revised');
  if (config.serialSessionDays < 1 || config.serialSessionDays > 3650) throw new Error('SERIAL_SESSION_DAYS must be between 1 and 3650');
  return Object.freeze(config);
}
