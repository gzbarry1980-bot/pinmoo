#!/usr/bin/env node
// 小程序生产构建防呆（R5）。
// 检出下列任一情况即以非 0 退出，阻止带缺陷的包被上传：
//   1) 出现 payMock / mockPay / mock-pay 等伪支付残留
//   2) 生产 profile 的 URL 不是正式 HTTPS，或包含 mock / 回环地址
//   3) 任何地方仍透传长期令牌（zk_token / zk_openid）
//   4) 测试/开发环境复用了生产域名
// 用法： node scripts/assert-env.cjs [--env=production|test|development]
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PRODUCTION_HOST = 'zhongkao.pinmooconsulting.com';

const argEnv = (process.argv.find((a) => a.startsWith('--env=')) || '').split('=')[1];

const SKIP_DIRS = new Set(['node_modules', '.git']);
function walk(dir, out = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    if (SKIP_DIRS.has(e.name)) return;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|json|wxml)$/.test(e.name)) out.push(p);
  });
  return out;
}

const problems = [];

// 1) & 3) 源码静态扫描
const banned = [
  { re: /payMock\s*[:=]\s*true/, msg: 'payMock 被置为 true' },
  { re: /mockPay|mock-pay/, msg: '存在 mock 支付残留（mockPay / mock-pay）' },
  { re: /zk_token/, msg: '仍在透传长期令牌 zk_token' },
  { re: /zk_openid/, msg: '仍在透传 zk_openid' },
  { re: /LOCAL_PREVIEW/, msg: '存在 LOCAL_PREVIEW 预览开关残留' }
];
walk(ROOT).forEach((f) => {
  // 本脚本自身的规则字符串与 README 文档不参与扫描
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (rel === 'scripts/assert-env.cjs' || rel.endsWith('.md')) return;
  const text = fs.readFileSync(f, 'utf8');
  banned.forEach(({ re, msg }) => {
    if (re.test(text)) problems.push(`${rel}: ${msg}`);
  });
});

// 2) 解析 app.js 中的环境 profile
const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
function grabProfile(name) {
  const block = new RegExp(`${name}\\s*:\\s*\\{([\\s\\S]*?)\\}`).exec(appSrc);
  if (!block) return null;
  const pick = (k) => {
    const m = new RegExp(`${k}\\s*:\\s*['\`]([^'\`]+)['\`]`).exec(block[1]);
    return m ? m[1] : null;
  };
  const pm = new RegExp(`payMock\\s*:\\s*(true|false)`).exec(block[1]);
  return {
    dataBaseUrl: pick('dataBaseUrl'),
    webBaseUrl: pick('webBaseUrl'),
    payMock: pm ? pm[1] === 'true' : null,
    storageNs: pick('storageNs')
  };
}

const buildEnvMatch = /BUILD_ENV\s*=\s*['"]([^'"]+)['"]/.exec(appSrc);
const buildEnv = argEnv || (buildEnvMatch ? buildEnvMatch[1] : 'production');
const profile = grabProfile(buildEnv);

if (!profile) {
  problems.push(`app.js 中找不到 ${buildEnv} 环境 profile`);
} else {
  const hosts = [profile.dataBaseUrl, profile.webBaseUrl].filter(Boolean);
  if (buildEnv === 'production') {
    if (profile.payMock !== false) problems.push('生产 profile 的 payMock 必须为 false');
    hosts.forEach((u) => {
      if (!/^https:\/\//.test(u)) problems.push(`生产 URL 必须 HTTPS：${u}`);
      if (!u.includes(PRODUCTION_HOST)) problems.push(`生产 URL 必须指向 ${PRODUCTION_HOST}：${u}`);
    });
    if (profile.storageNs !== 'prod') problems.push('生产存储命名空间必须为 prod');
  } else {
    hosts.forEach((u) => {
      if (u.includes(PRODUCTION_HOST)) problems.push(`${buildEnv} 环境不得复用生产域名：${u}`);
    });
    if (profile.payMock !== false) problems.push(`${buildEnv} 环境 payMock 必须为 false`);
  }
}

const ok = problems.length === 0;
console.log(JSON.stringify({ buildEnv, profile, scanned: walk(ROOT).length, problems, pass: ok }, null, 2));
process.exitCode = ok ? 0 : 1;
