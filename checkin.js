// Scriptable 脚本 for WeLink 自动打卡
// 功能: 自动刷新用户Token, 并自动执行打卡。
// 版本: 2.3 (增强日志 + 修正刷新逻辑)
//
// ------------------------------------------------------------------
// ⚠️ --- (1) 用户配置 (必须更新为您自己的信息!) --- ⚠️
// ------------------------------------------------------------------

// Keychain Key，用于保存和读取最新的 Auth Data
const KEYCHAIN_KEY = "WeLinkAutoCheckinAuthData";

// --- 仅需抓取一次的静态/初始配置 ---
// 粘贴您抓取到的 *初始* 的 refresh_token 值 (来自 refresh.txt Response Body)
// 脚本会自动更新这个值。
const INITIAL_REFRESH_TOKEN = "N5tToVmneYWPg0JEmiIo2g==e2A27tV2snfijyd8r4zHWXJ9RjS+e3UxWenZdcdH0sAvlU8PEjKSuA7uyIG8zc1YI/ZfjdEaVyoLpRfcPt0qc+ga+an5t1sfqE5lc9/1FFcpFfmPLTCQ8BxEz0JkZdTx3c3SfC6Ht6HtOYeqdu34fh+GuzBhWosJIFxN9Z/mtZUdHv8tGfNv+6ZNMAQC71vjmpym7zpEDQXJEpB9FlUKX65F4OwF9C+Fp6DUUtWrUR++kA+WZunelmQbAoytqJ1qi6D8jWq9UvaEvFWmpqDh1HGK9w9NPRkZh1sVbjJ3dN6T"; // (来自 refresh.txt)

// 粘贴 refresh.txt Request Body 中 `tenantid=...` 的值 (注意：是完整的URL编码后的值)
const STATIC_TENANT_ID_ENCODED = "nT8N5Q2pSqKqWKqFyyBEtN1lT7vfxVejb7QFCBndHLwYDRbkbztWtWsS8oDyUavX9LZ9W/MKKnofbRiF6RSZF4TD61bc8qMZhzXkkm6UXzBXRHQlgYELHcwIPH2jI1Qi3pkj3TQ0F3H7FLaAY8Opzqju3FoBOiz3J5KEBHGsV%2BzVjphWZttUgdT%2BpwZ5h97olHOC2dD/MhutMFlULdsQc8kXWys0iFallpJ/9FMPLNXQpuRzcLLOutSs9hcOtnScecp8j2xHebqbpeRomq7hvyifZhhf5BGyTt3i/Hf6SYzV/9uRZGVzpDuIbrZDVnpEHu7MwT%2Bv6EC2PG0T8GxrNLreIketmyz31oTVlzgc6kCBMQ4T6gLzXuoReHHaPYg6qcQBi2yYO5mh23OiYYoRGxEpwZ6znrw2tBJd0FNijaV%2BD0BVg%2BAd2BfvSRPWJY1bJTLysGzuiklb2pbFIvlJGJTaQmy%2BDl46EK6MWmooviS135GSXcEUm8W5WmluD/l"; // (来自 refresh.txt)

// --- 打卡地理位置/设备信息配置 (来自 all.txt Request Body/Headers) ---
const USER_DEVICE_ID = "5295F639-0CA9-4B42-87CD-B75B3BEF1A77"; // 'uuid' and 'deviceId'
const USER_EMPLOYEE_NUMBER = "3ZGHIG5PP7YI@AD802282B91"; // 'employeeNumber'
const USER_AGENT = "WorkPlace/7.50.10 (iPhone; iOS 26.0.1; Scale/3.00)"; // 'User-Agent'
const USER_IP = "10.245.32.114"; // 'ip'
const USER_MEAPIP = "198.18.129.164"; // 'meapip'
const OFFICE_LOC_X = "120.798321"; // 'x' 经度
const OFFICE_LOC_Y = "31.275254"; // 'y' 纬度
const OFFICE_LOCATION = "江苏省苏州市虎丘区斜塘街道华为苏州研究所(北门)"; // 'location'
const OFFICE_PROVINCE = "江苏省"; // 'province'
const OFFICE_CITY = "苏州市"; // 'city'
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
    const refreshURL = "https://api.welink.huaweicloud.com/mcloud/mag/v7/refresh/LoginReg"; // [cite: 86]
    let req = new Request(refreshURL);
    req.method = "POST";
    
    req.headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
        "uuid": USER_DEVICE_ID,
        "lang": "zh"
    };

    const encodedRefreshToken = encodeURIComponent(auth.refreshToken);
    req.body = `refresh_token=${encodedRefreshToken}&tenantid=${STATIC_TENANT_ID_ENCODED}&thirdAuthType=3`;

    try {
        console.log("🚀 正在执行 Token 刷新请求...");
        
        // --- [!] 修改点 1: 增加日志 ---
        // 使用 loadString() 捕获所有响应，包括非JSON错误
        const responseText = await req.loadString();
        // 打印服务器返回的原始响应体，用于调试
        console.log(`ℹ️ 刷新请求的原始响应 (Raw Response): ${responseText}`);

        let response;
        try {
            response = JSON.parse(responseText); // 尝试解析JSON
        } catch (jsonError) {
            console.error(`❌ Token 刷新失败：响应不是有效的 JSON。`);
            return false;
        }
        // --- [!] 修改点 1 结束 ---


        if (req.response.statusCode !== 200) {
            console.error(`❌ Token 刷新失败，状态码: ${req.response.statusCode}`);
            console.error(`响应: ${JSON.stringify(response)}`);
            return false;
        }

        // --- [!] 修改点 2: 修正刷新逻辑 ---
        // 1. 检查新的 refresh_token (这是可选的)
        if (response && response.refresh_token) {
            auth.refreshToken = response.refresh_token;
            console.log(`✅ 成功获取并更新 new refresh_token: ${mask(auth.refreshToken)}`);
        } else {
            console.log("ℹ️ 响应中未包含 new refresh_token，将沿用旧的 refresh_token。");
            // 注意：我们不再因此而失败
        }
        
        // 2. 检查新的 cookies (这是必须的)
        let gotNewCookies = false;
        const setCookieHeader = req.response.headers["Set-Cookie"];
        if (setCookieHeader) {
            parseSetCookie(setCookieHeader, auth);
            // 确保关键 token 被更新
            if (auth.token && auth.cdnToken) {
                gotNewCookies = true;
            }
        }

        // 只要成功获取了 new cookies (包含 access token)，就视为刷新成功
        if (gotNewCookies) {
            saveAuthData(auth);
            return true;
        } else {
            console.error("❌ Token 刷新失败。未能在 Set-Cookie 中提取到新的 token/cdn_token。");
            return false;
        }
        // --- [!] 修改点 2 结束 ---

    } catch (e) {
        console.error("❌ Token 刷新请求异常:", e);
        return false;
    }
}

/**
 * 执行打卡操作。
 * @param {AuthData} auth - 包含最新 token 和 cookie 的认证数据。
 * @returns {Promise<string>} - 返回打卡结果信息。
 */
async function checkin(auth) {
    const checkinURL = "https://api.welink.huaweicloud.com/mcloud/mag/ProxyForText/mattend/service/mat/punchCardService/punchcardallFront"; // [cite: 1]
    let req = new Request(checkinURL);
    req.method = "POST";

    const cookie = `HWWAFSESID=${auth.hwafSESID}; HWWAFSESTIME=${auth.hwafSESTIME}; cdn_token=${auth.cdnToken}; token=${auth.token};`;

    req.headers = {
        "lang": "zh",
        "User-Agent": USER_AGENT,
        "Cookie": cookie,
        "x-wlk-gray": "0", // [cite: 2]
        "uuid": USER_DEVICE_ID,
        "X-Product-Type": "0",
        "appVersion": "7.50.10",
        "Content-Type": "application/json"
    };

    const body = {
        "employeeNumber" : USER_EMPLOYEE_NUMBER,
        "x" : OFFICE_LOC_X,
        "wifiList" : [
            {
              "wifiMac" : WIFI_MAC,
              "wifiName" : WIFI_NAME
            }
        ],
        "meapip" : USER_MEAPIP,
        "y" : OFFICE_LOC_Y,
        "province" : OFFICE_PROVINCE,
        "deviceId" : USER_DEVICE_ID,
        "locale" : "cn",
        "deviceType" : "2",
        "verticalAccuracy" : "0",
        "location" : OFFICE_LOCATION,
        "ip" : USER_IP,
        "city" : OFFICE_CITY,
        "country" : "中国" // [cite: 3]
    };
    req.body = JSON.stringify(body);

    try {
        console.log("--- 准备打卡 ---");
        console.log(`ℹ️ 打卡位置: ${body.location}`);
        console.log(`ℹ️ WiFi: ${body.wifiList[0].wifiName} (${body.wifiList[0].wifiMac})`);
        console.log(`ℹ️ 坐标: (x: ${body.x}, y: ${body.y})`);
        console.log("🚀 正在执行打卡请求...");
        
        const response = await req.loadJSON();

        if (response && response.status === "1" && response.msg === "打卡成功") { // [cite: 4]
            console.log("🎉 打卡成功！");
            return `打卡成功: ${response.msg} (${response.data.location}) [${response.data.sysDate}]`; // [cite: 4]
        } else {
            const errorMsg = response.msg || `状态码: ${req.response.statusCode}, 响应: ${JSON.stringify(response)}`;
            console.error(`❌ 打卡失败: ${errorMsg}`);
            return `打卡失败: ${errorMsg}`;
        }
    } catch (e) {
        console.error("❌ 打卡请求异常:", e);
        return `打卡请求失败: ${e.message}`;
    }
}

// ------------------------------------------------------------------
// --- (3) 主程序 ---
// ------------------------------------------------------------------

async function main() {
    console.log("=== WeLink 自动打卡脚本开始执行 ===");
    
    const authData = await loadAuthData();
    const refreshSuccess = await refreshAuthData(authData);
    
    let result = "";

    if (refreshSuccess) {
        result = await checkin(authData);
    } else {
        result = "Token 刷新失败，无法执行打卡。请检查配置或抓取新的 INITIAL_REFRESH_TOKEN。";
    }

    console.log("=== 脚本执行完毕 ===");
    
    const isSuccess = result.startsWith("打卡成功");
    const notificationTitle = isSuccess ? "✅ WeLink 打卡成功" : "❌ WeLink 打卡失败";

	const n = new Notification();
	n.title = notificationTitle;
	n.body = result;
	n.sound = "default";
	await n.schedule();
}

await main();