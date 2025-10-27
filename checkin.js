// Scriptable 脚本 for WeLink 自动打卡
// 功能: 自动刷新用户Token, 并自动执行打卡。
// 版本: 2.7 (修复: 补全 refreshAuthData 的所有 Headers；增强: 打印 Response Headers)
//
// ------------------------------------------------------------------
// ⚠️ --- (1) 用户配置 (必须更新为您自己的信息!) --- ⚠️
// ------------------------------------------------------------------

// Keychain Key，用于保存和读取最新的 Auth Data
const KEYCHAIN_KEY = "WeLinkAutoCheckinAuthData";

// --- 仅需抓取一次的静态/初始配置 ---
// [!] 关键修正:
// 此 Token (qWTB...) 来自 login.txt 的响应体
// 并且在 refresh.txt 的请求体 中被使用，
// 证明了它可以和下面的 tenantid 成功配对。
const INITIAL_REFRESH_TOKEN = "qWTB3obvCBSlW9HdMkONzQ==9lZfJZYNBixj+6sFORKyfiVM0nHJzR3qaQFic4W9snIfmHTLeAANWIXC36xQL/+/4UQzMeNhe7v6a348NOX3vGjIRaYnn/uo80mEcq/xaZ9V3+MiQW1J5B9s8jhHLFCJgQTaQ2K5qpAJA+J3IC9mSm/5scDLT6l+D2UhdE9sRZAxcoWxpbpM8v0bvdHqVtdRWLeWqzRxqYiSPScNZuCqvDb7XKBq1or94gi/RTqfsR2Z3SrslOCPoe/zTCp6z0FgmCZk1m5KKtU3Tao09C40QYJlIxOLfhgUJtiFibNr+66U";

// 此 tenantid (nT8N...) 来自 refresh.txt 的请求体
const STATIC_TENANT_ID_ENCODED = "nT8N5Q2pSqKqWKqFyyBEtN1lT7vfxVejb7QFCBndHLwYDRbkbztWtWsS8oDyUavX9LZ9W/MKKnofbRiF6RSZF4TD61bc8qMZhzXkkm6UXzBXRHQlgYELHcwIPH2jI1Qi3pkj3TQ0F3H7FLaAY8Opzqju3FoBOiz3J5KEBHGsV%2BzVjphWZttUgdT%2BpwZ5h97olHOC2dD/MhutMFlULdsQc8kXWys0iFallpJ/9FMPLNXQpuRzcLLOutSs9hcOtnScecp8j2xHebqbpeRomq7hvyifZhhf5BGyTt3i/Hf6SYzV/9uRZGVzpDuIbrZDVnpEHu7MwT%2Bv6EC2PG0T8GxrNLreIketmyz31oTVlzgc6kCBMQ4T6gLzXuoReHHaPYg6qcQBi2yYO5mh23OiYYoRGxEpwZ6znrw2tBJd0FNijaV%2BD0BVg%2BAd2BfvSRPWJY1bJTLysGzuiklb2pbFIvlJGJTaQmy%2BDl46EK6MWmooviS135GSXcEUm8W5WmluD/l"; //

// --- 打卡地理位置/设备信息配置 (来自 all.txt Request Body/Headers) ---
const USER_DEVICE_ID = "5295F639-0CA9-4B42-87CD-B75B3BEF1A77"; // 'uuid' and 'deviceId'
const USER_EMPLOYEE_NUMBER = "3ZGHIG5PP7YI@AD802282B91"; // 'employeeNumber'
const USER_AGENT = "WorkPlace/7.50.10 (iPhone; iOS 26.0.1; Scale/3.00)"; // 'User-Agent'
const USER_APP_VERSION = "7.50.10"; //
const USER_BUILD_CODE = "703"; //

// 伪造的IP信息 (请替换为您的抓包值)
const USER_IP = "10.245.32.114"; // 'ip'
const USER_MEAPIP = "198.18.129.164"; // 'meapip'

// 地理位置信息 (请替换为您的抓包值)
const OFFICE_LOC_X = "120.798321"; // 'x' 经度
const OFFICE_LOC_Y = "31.275254"; // 'y' 纬度
const OFFICE_LOCATION = "江苏省苏州市虎丘区斜塘街道华为苏州研究所(北门)"; // 'location'
const OFFICE_PROVINCE = "江苏省"; // 'province'
const OFFICE_CITY = "苏州市"; // 'city'

// WiFi信息 (请替换为您的抓包值)
const WIFI_MAC = "48:2c:d0:2a:6e:31"; // wifiList[0].wifiMac
const WIFI_NAME = "Huawei-Employee"; // wifiList[0].wifiName

// ------------------------------------------------------------------
// --- (2) 核心函数实现 ---
// ------------------------------------------------------------------

/**
 * 封装 Auth Data 结构
 * @typedef {object} AuthData
 * @property {string} refreshToken - 用于刷新Token
 * @property {string} cdnToken - 从 Set-Cookie 中提取
 * @property {string} token - 从 Set-Cookie 中提取的 Access Token
 * @property {string} hwafSESID - 从 Set-Cookie 中提取
 * @property {string} hwafSESTIME - 从 Set-Cookie 中提取
 */

function mask(s) {
    if (!s || s.length < 10) return s;
    return `${s.substring(0, 4)}...${s.substring(s.length - 4)}`;
}

async function loadAuthData() {
    try {
        const jsonString = Keychain.get(KEYCHAIN_KEY);
        if (jsonString) {
            const auth = JSON.parse(jsonString);
            console.log("✅ 成功加载 Keychain 中的认证数据。");
            return auth;
        }
    } catch (e) {
        console.error("⚠️ 加载 Keychain 数据失败 (可忽略):", e);
    }
    console.log("ℹ️ 首次运行或加载失败，使用初始 REFRESH_TOKEN。");
    return {
        refreshToken: INITIAL_REFRESH_TOKEN,
        cdnToken: "",
        token: "",
        hwafSESID: "",
        hwafSESTIME: ""
    };
}

function saveAuthData(auth) {
    try {
        Keychain.set(KEYCHAIN_KEY, JSON.stringify(auth));
        console.log("✅ 认证数据已成功保存到 Keychain。");
    } catch (e) {
        console.error("❌ 保存 Keychain 数据失败:", e);
    }
}

function parseSetCookie(cookieHeader, currentAuth) {
    if (!cookieHeader) {
        console.warn("⚠️ Set-Cookie 头部为空，无法解析。");
        return;
    }
    const cookies = cookieHeader.split(', ');
    const cdnMatch = cookies.find(c => c.startsWith('cdn_token='))?.match(/cdn_token=([^;]+)/);
    const tokenMatch = cookies.find(c => c.startsWith('token='))?.match(/token=([^;]+)/);
    const hwsidMatch = cookies.find(c => c.startsWith('HWWAFSESID='))?.match(/HWWAFSESID=([^;]+)/);
    const hwtimeMatch = cookies.find(c => c.startsWith('HWWAFSESTIME='))?.match(/HWWAFSESTIME=([^;]+)/);

    if (cdnMatch) {
        currentAuth.cdnToken = cdnMatch[1].split(';')[0];
        console.log(`💡 更新 cdnToken: ${mask(currentAuth.cdnToken)}`);
    }
    if (tokenMatch) {
        currentAuth.token = tokenMatch[1].split(';')[0];
        console.log(`💡 更新 token (Access Token): ${mask(currentAuth.token)}`);
    }
    if (hwsidMatch) {
        currentAuth.hwafSESID = hwsidMatch[1].split(';')[0];
        console.log(`💡 更新 HWWAFSESID: ${mask(currentAuth.hwafSESID)}`);
    }
    if (hwtimeMatch) {
        currentAuth.hwafSESTIME = hwtimeMatch[1].split(';')[0];
        console.log(`💡 更新 HWWAFSESTIME: ${mask(currentAuth.hwafSESTIME)}`);
    }
}


/**
 * 使用 refresh_token 获取新的 token 和 refresh_token。
 * @param {AuthData} auth - 当前认证数据。
 * @returns {Promise<boolean>} - 刷新成功返回 true，否则返回 false。
 */
async function refreshAuthData(auth) {
    const refreshURL = "https://api.welink.huaweicloud.com/mcloud/mag/v7/refresh/LoginReg"; //
    let req = new Request(refreshURL);
    req.method = "POST";
    
    // --- [!] 关键修复 (v2.7): 补全所有在 refresh.txt 中出现的 Headers ---
    req.headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "lang": "zh",
        "User-Agent": USER_AGENT,
        "uuid": USER_DEVICE_ID,
        "nflag": "1", //
        "deviceType": "0", //
        "deviceName": "iPhone15,3", //
        "X-Product-Type": "0", //
        "appVersion": USER_APP_VERSION, //
        "osTarget": "1", //
        "appName": "WeLink", //
        "buildCode": USER_BUILD_CODE, //
        "X-Cloud-Type": "1", //
        "businessVersionCode": USER_BUILD_CODE //
    };
    // --- [!] 修复结束 ---

    const encodedRefreshToken = encodeURIComponent(auth.refreshToken);
    req.body = `refresh_token=${encodedRefreshToken}&tenantid=${STATIC_TENANT_ID_ENCODED}&thirdAuthType=3`;

    try {
        console.log("🚀 正在执行 Token 刷新请求...");
        
        const responseText = await req.loadString();
        
        // --- [!] 增强日志 (v2.7): 打印所有返回信息 ---
        console.log("--- 刷新请求 响应头 (Response Headers) ---");
        console.log(JSON.stringify(req.response.headers, null, 2));
        console.log("--- 刷新请求 响应体 (Response Body) ---");
        console.log(responseText);
        console.log("---------------------------------------");
        // --- [!] 增强日志结束 ---

        let response;
        try {
            response = JSON.parse(responseText);
        } catch (jsonError) {
            console.error(`❌ Token 刷新失败：响应不是有效的 JSON。`);
            return false;
        }

        // --- 关键修复: 如果服务器返回了 errorCode，则立即判定为失败 ---
        if (response && response.errorCode) {
            console.error(`❌ Token 刷新失败: ${response.errorMessage} (Code: ${response.errorCode})`);
            return false;
        }
        // --- 修复结束 ---

        if (req.response.statusCode !== 200) {
            console.error(`❌ Token 刷新失败，状态码: ${req.response.statusCode}`);
            console.error(`响应: ${JSON.stringify(response)}`);
            return false;
        }

        // 1. 检查新的 refresh_token (可选)
        if (response && response.refresh_token) {
            auth.refreshToken = response.refresh_token;
            console.log(`✅ 成功获取并更新 new refresh_token: ${mask(auth.refreshToken)}`);
        } else {
            console.log("ℹ️ 响应中未包含 new refresh_token，将沿用旧的 refresh_token。");
        }
        
        // 2. 检查新的 cookies (必须)
        let gotNewCookies = false;
        const setCookieHeader = req.response.headers["Set-Cookie"];
        if (setCookieHeader) {
            parseSetCookie(setCookieHeader, auth);
            // 确保关键 token 被更新
            if (auth.token && auth.cdnToken) {
                gotNewCookies = true;
            }
        }

        if (gotNewCookies) {
            // 只有在明确拿到新 Cookie 且没有 errorCode 时才保存
            saveAuthData(auth);
            return true;
        } else {
            console.error("❌ Token 刷新失败。未能在 Set-Cookie 中提取到新的 token/cdn_token。");
            return false;
        }

    } catch (e) {
        console.error("❌ Token 刷新请求异常:", e);
        return false;
    }
}

/**
 * 执行打卡操作。
 * @param {AuthData} auth - 包含最新 token