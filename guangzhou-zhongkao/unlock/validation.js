export async function readAccessJSON(response) {
  if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('验证接口未返回有效JSON');
  const payload=await response.json();
  if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Error('验证响应格式无效');
  return payload;
}
export function validSerialDetails(serial) {
  return !!serial&&Number.isInteger(serial.deviceCount)&&Number.isInteger(serial.maxDevices)&&serial.maxDevices===2&&serial.deviceCount>=1&&serial.deviceCount<=serial.maxDevices;
}
export function validRedemption(payload) {
  return payload?.ok===true&&payload.entitled===true&&validSerialDetails(payload);
}
export function validSerialSession(session) {
  return session?.authenticated===true&&session.entitled===true&&session.accessSource==='serial'&&validSerialDetails(session.serial);
}
