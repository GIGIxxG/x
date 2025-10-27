// 华为 WeLink 自动签到 Scriptable 脚本
// 适用于 Scriptable（iOS），定时触发即可自动签到+自动续 token，无需人工交互
// —— 作者: ChatGPT 2024/10/27

// ====== 配置区（首次抓包填好，后续无需更改）======
const config = {
  refresh_token: "refresh_token=qWTB3obvCBSlW9HdMkONzQ%3D%3D9lZfJZYNBixj%2B6sFORKyfiVM0nHJzR3qaQFic4W9snIfmHTLeAANWIXC36xQL/%2B/4UQzMeNhe7v6a348NOX3vGjIRaYnn/uo80mEcq/xaZ9V3%2BMiQW1J5B9s8jhHLFCJgQTaQ2K5qpAJA%2BJ3IC9mSm/5scDLT6l%2BD2UhdE9sRZAxcoWxpbpM8v0bvdHqVtdRWLeWqzRxqYiSPScNZuCqvDb7XKBq1or94gi/RTqfsR2Z3SrslOCPoe/zTCp6z0FgmCZk1m5KKtU3Tao09C40QYJlIxOLfhgUJtiFibNr%2B66U&tenantid=nT8N5Q2pSqKqWKqFyyBEtN1lT7vfxVejb7QFCBndHLwYDRbkbztWtWsS8oDyUavX9LZ9W/MKKnofbRiF6RSZF4TD61bc8qMZhzXkkm6UXzBXRHQlgYELHcwIPH2jI1Qi3pkj3TQ0F3H7FLaAY8Opzqju3FoBOiz3J5KEBHGsV%2BzVjphWZttUgdT%2BpwZ5h97olHOC2dD/MhutMFlULdsQc8kXWys0iFallpJ/9FMPLNXQpuRzcLLOutSs9hcOtnScecp8j2xHebqbpeRomq7hvyifZhhf5BGyTt3i/Hf6SYzV/9uRZGVzpDuIbrZDVnpEHu7MwT%2BBv6EC2PG0T8GxrNLreIketmyz31oTVlzgc6kCBMQ4T6gLzXuoReHHaPYg6qcQBi2yYO5mh23OiYYoRGxEpwZ6znrw2tBJd0FNijaV%2BD0BVg%2BAd2BfvSRPWJY1bJTLysGzuiklb2pbFIvlJGJTaQmy%2BDl46EK6MWmooviS135GSXcEUm8W5WmluD/l&thirdAuthType=3",
  tenantid: "nT8N5Q2pSqKqWKqFyyBEtN1lT7vfxVejb7QFCBndHLwYDRbkbztWtWsS8oDyUavX9LZ9W/MKKnofbRiF6RSZF4TD61bc8qMZhzXkkm6UXzBXRHQlgYELHcwIPH2jI1Qi3pkj3TQ0F3H7FLaAY8Opzqju3FoBOiz3J5KEBHGsV%2BzVjphWZttUgdT%2BpwZ5h97olHOC2dD/MhutMFlULdsQc8kXWys0iFallpJ/9FMPLNXQpuRzcLLOutSs9hcOtnScecp8j2xHebqbpeRomq7hvyifZhhf5BGyTt3i/Hf6SYzV/9uRZGVzpDuIbrZDVnpEHu7MwT%2BBv6EC2PG0T8GxrNLreIketmyz31oTVlzgc6kCBMQ4T6gLzXuoReHHaPYg6qcQBi2yYO5mh23OiYYoRGxEpwZ6znrw2tBJd0FNijaV%2BD0BVg%2BAd2BfvSRPWJY1bJTLysGzuiklb2pbFIvlJGJTaQmy%2BDl46EK6MWmooviS135GSXcEUm8W5WmluD/l",           // 从refresh数据体/抓包获取
  uuid: "5295F639-0CA9-4B42-87CD-B75B3BEF1A77",           // 你的uuid
  deviceId: "5295F639-0CA9-4B42-87CD-B75B3BEF1A77",       // 你的deviceId
  employeeNumber: "3ZGHIG5PP7YI@AD802282B91", // 你的员工号
  province: "江苏省",
  city: "苏州市",
  country: "中国",
  location: "江苏省苏州市虎丘区江韵路华为苏州研究所(北门)",
  x: "120.798321",
  y: "31.275254",
  wifiList: [
    {wifiMac: "48:2c:d0:2a:6e:31", wifiName: "Huawei-Employee"}
  ],
  meapip: "198.18.129.164",
  ip: "10.245.32.114",
  appName: "WeLink",
  appVersion: "7.50.10",
};

// ===== 可选：持久化数据本地存储（Scriptable Keychain） =====
const KEYCHAIN_KEY = 'welink_token_info';

async function saveTokenInfo(token) {
  Keychain.set(KEYCHAIN_KEY, JSON.stringify(token));
}
async function loadTokenInfo() {
  try {
    let info = Keychain.get(KEYCHAIN_KEY);
    if (info) return JSON.parse(info);
  } catch(_) {}
  return null;
}

// ===== 1. 自动 refresh，获取 access_token、cookie等 =====
async function refreshToken() {
  const url = 'https://api.welink.huaweicloud.com/mcloud/mag/v7/refresh/LoginReg';
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'WorkPlace/7.50.10 (iPhone; iOS 26.0.1; Scale/3.00)',
    'uuid': config.uuid,
  };
  const bodyObj = {
    refresh_token: config.refresh_token,
    tenantid: config.tenantid,
    thirdAuthType: 3
  };
  const body = Object.entries(bodyObj).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  let resp = await new Request(url);
  resp.method = 'POST';
  resp.headers = headers;
  resp.body = body;
  let res = await resp.loadString();
  try {
    res = JSON.parse(res);
  } catch(_) { throw new Error('刷新出错:'+res); }
  if(res && res.access_token){
    // 保存新token
    await saveTokenInfo({
      access_token: res.access_token,
      refresh_token: res.refresh_token,
      expires_in: res.expires_in,
      time: Date.now()
    });
    config.refresh_token = res.refresh_token;
    return res.access_token;
  } else {
    throw new Error('刷新失败:'+JSON.stringify(res));
  }
}

// ===== 2. 检查 access_token，有效即用，无效则自动刷新 =====
async function getValidAccessToken() {
  const info = await loadTokenInfo();
  if(info && info.access_token && info.expires_in && info.time){
    const now = Date.now();
    if(now < info.time + (info.expires_in-60) * 1000){
      config.refresh_token = info.refresh_token; // 下次用更好的 token
      return info.access_token;
    }
  }
  // 需要刷新
  return await refreshToken();
}

// ===== 3. 打卡请求主函数 =====
async function checkin() {
  // token
  let access_token = await getValidAccessToken();
  // 签到接口
  const url = 'https://api.welink.huaweicloud.com/mcloud/mag/ProxyForText/mattend/service/mat/punchCardService/punchcardallFront';
  // 构建头
  const headers = {
    'lang': 'zh',
    'User-Agent': 'WorkPlace/7.50.10 (iPhone; iOS 26.0.1; Scale/3.00)',
    'X-Product-Type': '0',
    'appVersion': config.appVersion,
    'uuid': config.uuid,
    'deviceType': '2',
    'deviceName': 'iPhone15,3',
    'osTarget': '1',
    'appName': config.appName,
    'Accept-Language': 'zh-Hans-US;q=0.9',
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Authorization': `Bearer ${access_token}`,
  };
  // 请求体
  const body = {
    employeeNumber: config.employeeNumber,
    x: config.x,
    y: config.y,
    wifiList: config.wifiList,
    meapip: config.meapip,
    province: config.province,
    city: config.city,
    country: config.country,
    deviceId: config.deviceId,
    locale: 'cn',
    deviceType: '2',
    verticalAccuracy: '0',
    location: config.location,
    ip: config.ip,
  };
  let req = new Request(url);
  req.method = 'POST';
  req.headers = headers;
  req.body = JSON.stringify(body);
  let resText = await req.loadString();
  let res = {};
  try {
    res = JSON.parse(resText);
  } catch(e) {
    return {code:-1, msg: '打卡响应解析失败:' + resText};
  }
  if(res && res.status == "1"){
    return {code:1, msg:'打卡成功: '+(res.msg || '')};
  }else{
    return {code:0, msg:'打卡失败:'+ (res.msg || resText)};
  }
}

// ====== 触发执行与桌面提醒 ======
(async()=>{
  const result = await checkin();
  let n = new Notification();
  n.title = 'WeLink签到';
  n.body = result.msg;
  n.schedule();
  console.log(result.msg);
})();

// ====== 说明 ======
// 只需首次抓包 refresh_token，tenantid，和抓 uuid/deviceId/employeeNumber 填好即可。
// 每次运行可自动刷新token与签到，不需手动操作。
// iOS端可设定快捷自动化/日历定时器，每天自动运行。
