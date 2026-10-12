// server/src/wxpay.js
// 微信支付 v3 签名 / 验签 / 回调解密工具（纯 Node crypto 实现，无第三方依赖）。
const crypto = require('crypto');
const cfg = require('./config.js');

function nonceStr(len = 32) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

// 构造 APIv3 请求头 Authorization
function buildAuthorization(method, urlPath, body = '') {
  const mchid = cfg.mchid;
  const serialNo = cfg.serialNo;
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = nonceStr();
  const message = `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${body}\n`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(message);
  const signature = signer.sign(cfg.privateKey, 'base64');
  return `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${serialNo}"`;
}

// 构造 wx.requestPayment 所需的支付参数（paySign）
function buildPaySign(prepayId) {
  const appid = cfg.appid;
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = nonceStr();
  const message = `${appid}\n${timestamp}\n${nonce}\nprepay_id=${prepayId}\n`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(message);
  const paySign = signer.sign(cfg.privateKey, 'base64');
  return {
    timeStamp: String(timestamp),
    nonceStr: nonce,
    package: `prepay_id=${prepayId}`,
    signType: 'RSA',
    paySign
  };
}

// 校验微信支付回调签名
function verifyNotify(timestamp, nonce, signature, bodyStr) {
  try {
    const message = `${timestamp}\n${nonce}\n${bodyStr}\n`;
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(message);
    return verifier.verify(cfg.platformPublicKey, signature, 'base64');
  } catch (e) {
    return false;
  }
}

// 解密回调报文中的 resource（AES-256-GCM）
// 协议口径：只有 ciphertext 是 Base64；resource.nonce 是原始随机串，必须按其 UTF-8 字节直接作为 IV。
// 2026-10-10 更正：此前误将 nonce 按 Base64 解码（R1），与微信官方 SDK 不一致，会导致真实回调认证失败。
function decryptResource(ciphertext, nonce, associatedData) {
  const key = Buffer.from(cfg.apiV3Key, 'utf8');
  const data = Buffer.from(ciphertext, 'base64');
  const authTag = data.subarray(data.length - 16);
  const cipherData = data.subarray(0, data.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(nonce, 'utf8'));
  decipher.setAuthTag(authTag);
  if (associatedData) decipher.setAAD(Buffer.from(associatedData, 'utf8'));
  const decrypted = Buffer.concat([decipher.update(cipherData), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { nonceStr, buildAuthorization, buildPaySign, verifyNotify, decryptResource };
