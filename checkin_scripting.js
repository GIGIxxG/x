// WeLink 自动打卡 - 迁移版 for scripting.fun
// https://scripting.fun/doc_v2/zh/guide/doc_v2/Quick%20Start

// --- 用户配置 ---
const INITIAL_REFRESH_TOKEN = "xxx";
const STATIC_TENANT_ID_ENCODED = "xxx";
const USER_DEVICE_ID = "xxx";
const USER_EMPLOYEE_NUMBER = "xxx";
const USER_AGENT = "WorkPlace/7.50.10 (iPhone; iOS 26.0.1; Scale/3.00)";
const USER_IP = "10.245.32.114";
const USER_MEAPIP = "198.18.129.164";
const OFFICE_LOC_X = "120.798321";
const OFFICE_LOC_Y = "31.275254";
const OFFICE_LOCATION = "江苏省苏州市虎丘区斜塘街道华为苏州研究所(北门)";
const OFFICE_PROVINCE = "江苏省";
const OFFICE_CITY = "苏州市";
const WIFI_MAC = "48:2c:d0:2a:6e:31";
const WIFI_NAME = "Huawei-Employee";

const STORAGE_KEY = "WeLinkAutoCheckinAuthData";

// --- 工具函数 ---
function mask(s) {
  if (!s || s.length < 10) return s;
  return `${s.substring(0, 4)}...${s.substring(s.length - 4)}`;
}

async function loadAuthData() {
  const stored = await scripting.storage.get(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return { refreshToken: INITIAL_REFRESH_TOKEN, cdnToken: "", token: "", hwafSESID: "", hwafSESTIME: "" };
}

async function saveAuthData(auth) {
  await scripting.storage.set(STORAGE_KEY, JSON.stringify(auth));
}

function parseSetCookie(header, auth) {
  if (!header) return;
  const cookies = header.split(', ');
  const get = (k) => cookies.find(c => c.startsWith(k + '='))?.match(new RegExp(`${k}=([^;]+)`))?.[1];
  if (get('cdn_token')) auth.cdnToken = get('cdn_token');
  if (get('token')) auth.token = get('token');
  if (get('HWWAFSESID')) auth.hwafSESID = get('HWWAFSESID');
  if (get('HWWAFSESTIME')) auth.hwafSESTIME = get('HWWAFSESTIME');
}

async function refreshAuthData(auth) {
  const url = "https://api.welink.huaweicloud.com/mcloud/mag/v7/refresh/LoginReg";
  const body = `refresh_token=${encodeURIComponent(auth.refreshToken)}&tenantid=${STATIC_TENANT_ID_ENCODED}&thirdAuthType=3`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT, "uuid": USER_DEVICE_ID, "lang": "zh" },
    body
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Token 刷新失败: ${res.status}`);
  if (json.refresh_token) auth.refreshToken = json.refresh_token;
  parseSetCookie(res.headers.get("set-cookie"), auth);
  await saveAuthData(auth);
  return true;
}

async function checkin(auth) {
  const url = "https://api.welink.huaweicloud.com/mcloud/mag/ProxyForText/mattend/service/mat/punchCardService/punchcardallFront";
  const cookie = `HWWAFSESID=${auth.hwafSESID}; HWWAFSESTIME=${auth.hwafSESTIME}; cdn_token=${auth.cdnToken}; token=${auth.token};`;
  const body = {
    employeeNumber: USER_EMPLOYEE_NUMBER,
    x: OFFICE_LOC_X,
    wifiList: [{ wifiMac: WIFI_MAC, wifiName: WIFI_NAME }],
    meapip: USER_MEAPIP,
    y: OFFICE_LOC_Y,
    province: OFFICE_PROVINCE,
    deviceId: USER_DEVICE_ID,
    locale: "cn",
    deviceType: "2",
    verticalAccuracy: "0",
    location: OFFICE_LOCATION,
    ip: USER_IP,
    city: OFFICE_CITY,
    country: "中国"
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "lang": "zh", "User-Agent": USER_AGENT, "Cookie": cookie,
      "x-wlk-gray": "0", "uuid": USER_DEVICE_ID,
      "X-Product-Type": "0", "appVersion": "7.50.10", "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (json.status === "1" && json.msg === "打卡成功") return `打卡成功: ${json.msg} (${json.data.location}) [${json.data.sysDate}]`;
  return `打卡失败: ${json.msg || res.status}`;
}

async function main() {
  const auth = await loadAuthData();
  try {
    await refreshAuthData(auth);
    const result = await checkin(auth);
    await scripting.notify("WeLink 打卡结果", result);
  } catch (e) {
    await scripting.notify("WeLink 打卡失败", e.message);
  }
}

await main();
