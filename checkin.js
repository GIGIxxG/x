// Scriptable 脚本 for WeLink 自动打卡 - 升级版
// 功能: 自动刷新用户Token, 并自动执行打卡。
// 增强功能: 详细运行日志、打卡结果通知、全面错误检查。

// ------------------------------------------------------------------
// ⚠️ --- (1) 用户配置 (必须更新为您自己的信息!) --- ⚠️
// ------------------------------------------------------------------

// Keychain Key，用于保存和读取最新的 Auth Data
const KEYCHAIN_KEY = "WeLinkAutoCheckinAuthData";

// --- 仅需抓取一次的静态/初始配置 ---
// 粘贴您抓取到的 *初始* 的 refresh_token 值 (来自 refresh.txt Request Body，需要URL解码)
// 脚本会自动更新这个值。
const INITIAL_REFRESH_TOKEN = "qWTB3obvCBSlW9HdMkONzQ==9lZfJZYNBixj+6sFORKyfiVM0nHJzR3qaQFic4W9snIfmHTLeAANWIXC36xQL/+/4UQzMeNhe7v6a348NOX3vGjIRaYnn/uo80mEcq/xaZ9V3+MiQW1J5B9s8jhHLFCJgQTaQ2K5qpAJA+J3IC9mSm/5scDLT6l+D2UhdE9sRZAxcoWxpbpM8v0bvdHqVtdRWLeWqzRxqYiSPScNZuCqvDb7XKBq1or94gi/RTqfsR2Z3SrslOCPoe/zTCp6z0FgmCZk1m5KKtU3Tao09C40QYJlIxOLfhgUJtiFibNr+66U"; // [cite: 1]

// 粘贴 refresh.txt Request Body 中 `tenantid` 的值（加密字符串）
// 注意：这是请求体中的 tenantid，不是响应体中的 tenantIdentity
const STATIC_TENANT_ID = "nT8N5Q2pSqKqWKqFyyBEtN1lT7vfxVejb7QFCBndHLwYDRbkbztWtWsS8oDyUavX9LZ9W/MKKnofbRiF6RSZF4TD61bc8qMZhzXkkm6UXzBXRHQlgYELHcwIPH2jI1Qi3pkj3TQ0F3H7FLaAY8Opzqju3FoBOiz3J5KEBHGsV+zVjphWZttUgdT+pwZ5h97olHOC2dD/MhutMFlULdsQc8kXWys0iFallpJ/9FMPLNXQpuRzcLLOutSs9hcOtnScecp8j2xHebqbpeRomq7hvyifZhhf5BGyTt3i/Hf6SYzV/9uRZGVzpDuIbrZDVnpEHu7MwT+Bv6EC2PG0T8GxrNLreIketmyz31oTVlzgc6kCBMQ4T6gLzXuoReHHaPYg6qcQBi2yYO5mh23OiYYoRGxEpwZ6znrw2tBJd0FNijaV+D0BVg+Ad2BfvSRPWJY1bJTLysGzuiklb2pbFIvlJGJTaQmy+Dl46EK6MWmooviS135GSXcEUm8W5WmluD/l"; // [cite: 32]

// --- 打卡地理位置/设备信息配置 (来自 all.txt Request Body/Headers) ---
const USER_DEVICE_ID = "5295F639-0CA9-4B42-87CD-B75B3BEF1A77"; // 'uuid' and 'deviceId' [cite: 127]
const USER_EMPLOYEE_NUMBER = "3ZGHIG5PP7YI@AD802282B91"; // 'employeeNumber' [cite: 127]
const USER_AGENT = "WorkPlace/7.50.10 (iPhone; iOS 26.0.1; Scale/3.00)"; // 'User-Agent' [cite: 126]
const USER_IP = "10.245.32.114"; // 'ip' [cite: 127]
const USER_MEAPIP = "198.18.129.164"; // 'meapip' [cite: 127]

// 地理位置信息 (请替换为您的抓包值)
const USER_X = "120.798321"; // 经度 X [cite: 127]
const USER_Y = "31.275254"; // 纬度 Y [cite: 127]
const USER_PROVINCE = "江苏省"; // 省份 [cite: 127]
const USER_CITY = "苏州市"; // 城市 [cite: 128]
const USER_COUNTRY = "中国"; // 国家 [cite: 128]
const USER_LOCATION_DETAIL = "江苏省苏州市虎丘区斜塘街道华为苏州研究所(北门)"; // 详细地址 [cite: 127]

// WiFi 信息 (请替换为您的抓包值)
const USER_WIFI_LIST = [
    {
        "wifiMac": "48:2c:d0:2a:6e:31",
        "wifiName": "Huawei-Employee"
    }
]; // [cite: 127]

// ------------------------------------------------------------------
// --- (2) 辅助函数 ---
// ------------------------------------------------------------------

/**
 * 弹出通知和警报
 * @param {string} title - 通知标题
 * @param {string} body - 通知内容
 * @param {boolean} isError - 是否为错误通知
 */
async function notify(title, body, isError = false) {
    console.log(`[通知] ${isError ? '❌ 错误' : '✅ 成功'}: ${title} - ${body}`);

    // 使用 Scriptable Notification API
    let n = new Notification();
    n.title = title;
    n.body = body;

    if (isError) {
        // 错误通知采用更醒目的提示
        n.sound = 'alert'; 
        // 确保弹出 Alert，不遗漏任何错误
        let alert = new Alert();
        alert.title = title;
        alert.message = body;
        await alert.present();
    }
    
    await n.schedule();

    // 在 App 内运行时，也显示 Alert，方便调试和立即确认
    if (config.runsInApp && !isError) {
        let alert = new Alert();
        alert.title = title;
        alert.message = body;
        await alert.present();
    }
}

/**
 * 加载持久化的认证数据
 * @returns {object} AuthData
 */
async function loadAuthData() {
    let authData = {};
    if (Keychain.contains(KEYCHAIN_KEY)) {
        try {
            const dataStr = Keychain.get(KEYCHAIN_KEY);
            authData = JSON.parse(dataStr);
            console.log("✔️ 成功从 Keychain 加载认证数据。");
        } catch (e) {
            console.error("❌ Keychain 数据解析失败，将使用初始 Refresh Token。", e);
        }
    }
    
    // 初始化或回退到静态配置
    if (!authData.refresh_token) {
        authData.refresh_token = INITIAL_REFRESH_TOKEN;
        console.log("⚠️ 使用初始静态 Refresh Token。");
    }

    return authData;
}

/**
 * 刷新 Auth Token
 * @param {object} authData - 认证数据对象
 * @returns {boolean} - 是否刷新成功
 */
async function refreshAuthData(authData) {
    console.log("--- 2. 开始刷新 Token ---");
    const refreshURL = 'https://api.welink.huaweicloud.com/mcloud/mag/v7/refresh/LoginReg'; // [cite: 22]
    const refreshBody = `refresh_token=${authData.refresh_token}&tenantid=${STATIC_TENANT_ID}&thirdAuthType=3`;
    
    // 调试：输出请求体信息
    console.log("🔍 调试信息 - 请求体:");
    console.log(`   Refresh Token: ${authData.refresh_token.substring(0, 30)}...`);
    console.log(`   Tenant ID: ${STATIC_TENANT_ID}`);
    console.log(`   Full Body: ${refreshBody.substring(0, 100)}...`);
    
    const req = new Request(refreshURL);
    req.method = 'POST';
    req.headers = {
        'User-Agent': USER_AGENT, // [cite: 22]
        'Content-Type': 'application/x-www-form-urlencoded', // [cite: 22]
        'uuid': USER_DEVICE_ID, // [cite: 22]
        'appVersion': '7.50.10', // [cite: 22]
        'deviceName': 'iPhone15,3', // [cite: 22]
        'osTarget': '1', // [cite: 22]
        'lang': 'zh', // [cite: 9]
        'traceId': 'WK-A3D2F74B-4C24-4D24-BB47-D7D19F2C167A', // [cite: 11]
        'nflag': '1', // [cite: 12]
        'deviceType': '0', // [cite: 13]
        'X-Product-Type': '0', // [cite: 15]
        'appName': 'WeLink', // [cite: 20]
        'Connection': 'keep-alive', // [cite: 21]
        'buildCode': '703', // [cite: 22]
        'Accept-Language': 'en-US;q=1, zh-Hans-US;q=0.9', // [cite: 23]
        'X-Cloud-Type': '1', // [cite: 24]
        'businessVersionCode': '703', // [cite: 25]
        'networkType': 'Cellular', // [cite: 26]
        'Accept': '*/*', // [cite: 27]
        'Accept-Encoding': 'gzip, deflate, br' // [cite: 29]
    };
    req.body = refreshBody;

    try {
        const responseData = await req.loadJSON();
        
        // 检查 HTTP 状态码
        if (req.response.statusCode !== 200) {
            const errorMsg = `HTTP 状态码: ${req.response.statusCode}`;
            console.error(`❌ Token 刷新失败: ${errorMsg}`);
            await notify("Token 刷新失败", errorMsg, true);
            return false;
        }

        // 调试：输出响应头信息
        console.log("🔍 调试信息 - 响应头:");
        console.log(`   Status Code: ${req.response.statusCode}`);
        console.log(`   Headers: ${JSON.stringify(req.response.headers, null, 2)}`);

        // 调试：输出响应体信息
        console.log("🔍 调试信息 - 响应体:");
        console.log(`   Response Data: ${JSON.stringify(responseData, null, 2)}`);
        
        // 检查响应体中的关键字段
        console.log("🔍 响应体关键字段检查:");
        console.log(`   login: ${responseData.login || '未找到'}`);
        console.log(`   access_token: ${responseData.access_token ? responseData.access_token.substring(0, 20) + '...' : '未找到'}`);
        console.log(`   refresh_token: ${responseData.refresh_token ? responseData.refresh_token.substring(0, 30) + '...' : '未找到'}`);
        console.log(`   crypt_token: ${responseData.crypt_token || '未找到'}`);

        // 修复Cookie解析逻辑 - 处理多个Set-Cookie头
        let newAccessToken = null;
        const setCookieHeaders = req.response.headers['Set-Cookie'];
        
        // 调试：输出所有响应头
        console.log("🔍 调试信息 - 所有响应头:");
        console.log(`   Headers: ${JSON.stringify(req.response.headers, null, 2)}`);
        
        if (setCookieHeaders) {
            // Set-Cookie可能是一个数组或字符串
            const cookieHeaders = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
            
            console.log(`🔍 找到 ${cookieHeaders.length} 个 Set-Cookie 头`);
            
            for (const cookieHeader of cookieHeaders) {
                console.log(`   Cookie: ${cookieHeader}`);
                if (cookieHeader && cookieHeader.includes('token=')) {
                    // 提取token值
                    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
                    if (tokenMatch) {
                        newAccessToken = tokenMatch[1];
                        console.log(`   ✅ 找到 Access Token: ${newAccessToken.substring(0, 10)}...`);
                        break;
                    }
                }
            }
        } else {
            console.log("❌ 响应中没有 Set-Cookie 头");
        }
        
        // 如果Cookie中没有找到token，尝试从响应体中获取access_token
        if (!newAccessToken && responseData.access_token) {
            newAccessToken = responseData.access_token;
            console.log(`   ✅ 从响应体找到 Access Token: ${newAccessToken.substring(0, 10)}...`);
        }
        
        // 如果还是没有找到，尝试使用crypt_token作为access_token
        if (!newAccessToken && responseData.crypt_token) {
            newAccessToken = responseData.crypt_token;
            console.log(`   ✅ 使用 Crypt Token 作为 Access Token: ${newAccessToken.substring(0, 10)}...`);
        }
            
        const newRefreshToken = responseData.refresh_token; // [cite: 4]
        
        // 调试：输出refresh_token信息
        console.log(`🔍 Refresh Token: ${newRefreshToken ? newRefreshToken.substring(0, 30) + '...' : '未找到'}`);
        
        if (newAccessToken && newRefreshToken) {
            // 更新并保存新的 Token
            authData.access_token = newAccessToken;
            authData.refresh_token = newRefreshToken;

            Keychain.set(KEYCHAIN_KEY, JSON.stringify(authData));
            
            // 详细日志输出新获取的 Token
            console.log("✔️ Token 刷新成功并已保存。");
            console.log(`   新 Access Token (Cookie): ${newAccessToken.substring(0, 10)}...`);
            console.log(`   新 Refresh Token: ${newRefreshToken.substring(0, 30)}...`); // [cite: 4]
            
            return true;
        } else {
            const errorMsg = "响应中未找到新的 Access Token (Cookie) 或 Refresh Token。";
            console.error(`❌ Token 刷新失败: ${errorMsg}`);
            await notify("Token 刷新失败", errorMsg, true);
            return false;
        }

    } catch (e) {
        console.error("❌ Token 刷新请求异常:", e);
        await notify("Token 刷新失败", `请求异常: ${e.message}`, true);
        return false;
    }
}


/**
 * 执行打卡操作
 * @param {object} authData - 包含 access_token 的认证数据
 * @returns {string} - 打卡结果消息
 */
async function checkin(authData) {
    console.log("--- 3. 开始执行打卡 ---");
    const checkinURL = 'https://api.welink.huaweicloud.com/mcloud/mag/ProxyForText/mattend/service/mat/punchCardService/punchcardallFront'; // [cite: 126]
    
    // 构造请求体 (Request Body)
    const checkinBody = {
        "employeeNumber": USER_EMPLOYEE_NUMBER, // [cite: 127]
        "x": USER_X, // 经度 [cite: 127]
        "wifiList": USER_WIFI_LIST, // Wi-Fi 信息 [cite: 127]
        "meapip": USER_MEAPIP, // [cite: 127]
        "y": USER_Y, // 纬度 [cite: 127]
        "province": USER_PROVINCE, // 省份 [cite: 127]
        "deviceId": USER_DEVICE_ID, // [cite: 127]
        "locale": "cn",
        "deviceType": "2",
        "verticalAccuracy": "0",
        "location": USER_LOCATION_DETAIL, // 详细地址 [cite: 127]
        "ip": USER_IP, // [cite: 127]
        "city": USER_CITY, // 城市 [cite: 128]
        "country": USER_COUNTRY // [cite: 128]
    };
    
    // 详细日志输出打卡信息
    const wifiInfo = USER_WIFI_LIST.map(w => `${w.wifiName}(${w.wifiMac})`).join(', ');
    console.log(`   打卡位置: ${checkinBody.location} (X:${checkinBody.x}, Y:${checkinBody.y})`);
    console.log(`   WiFi 信息: ${wifiInfo || '无'}`);

    const req = new Request(checkinURL);
    req.method = 'POST';
    req.headers = {
        'User-Agent': USER_AGENT, // [cite: 126]
        'Content-Type': 'application/json', // [cite: 127]
        'uuid': USER_DEVICE_ID, // [cite: 127]
        'appVersion': '7.50.10', // [cite: 127]
        'deviceName': 'iPhone15,3', // [cite: 127]
        'osTarget': '1', // [cite: 127]
        'lang': 'zh', // [cite: 9]
        'traceId': 'WK-00EF757D-1FDC-4D50-B087-2A445E2E7403', // [cite: 11]
        'deviceType': '0', // [cite: 13]
        'X-Product-Type': '0', // [cite: 15]
        'appName': 'WeLink', // [cite: 20]
        'Connection': 'keep-alive', // [cite: 21]
        'buildCode': '703', // [cite: 22]
        'Accept-Language': 'en-US;q=1, zh-Hans-US;q=0.9', // [cite: 23]
        'X-Cloud-Type': '1', // [cite: 24]
        'businessVersionCode': '703', // [cite: 25]
        'Accept': '*/*', // [cite: 26]
        'Accept-Encoding': 'gzip, deflate, br', // [cite: 28]
        // 使用新获取的 access_token 作为 Cookie
        'Cookie': `token=${authData.access_token}`,
    };
    req.body = JSON.stringify(checkinBody);

    // 调试：输出打卡请求信息
    console.log("🔍 调试信息 - 打卡请求:");
    console.log(`   URL: ${checkinURL}`);
    console.log(`   Cookie Token: ${authData.access_token ? authData.access_token.substring(0, 10) + '...' : '未设置'}`);
    console.log(`   Request Body: ${JSON.stringify(checkinBody, null, 2)}`);

    try {
        const response = await req.loadJSON();

        // **错误处理增强: 1. 检查 HTTP 状态码**
        if (req.response.statusCode !== 200) {
            const httpErrorMsg = `打卡请求 HTTP 失败: 状态码 ${req.response.statusCode}`;
            console.error(`❌ ${httpErrorMsg}`);
            await notify("打卡失败", httpErrorMsg, true);
            return httpErrorMsg;
        }

        // **错误处理增强: 2. 检查响应体内的 status 字段**
        if (response.status === "1") { // [cite: 130] 成功状态
            const successMsg = response.msg || `打卡成功 (${response.data.location})`; // [cite: 130]
            console.log(`✔️ 打卡成功: ${successMsg}`);
            await notify("打卡成功", `位置: ${response.data.location}`, false); // [cite: 130]
            return successMsg;
        } else {
            // status 不为 "1" 即视为失败，**杜绝一切漏打卡的可能性**
            const errorMsg = response.msg || `状态码: ${response.status}, 响应: ${JSON.stringify(response)}`;
            console.error(`❌ 打卡失败: ${errorMsg}`);
            await notify("打卡失败", errorMsg, true); // 强制弹出通知和警报
            return `打卡失败: ${errorMsg}`;
        }

    } catch (e) {
        // **错误处理增强: 3. 捕获网络/解析异常**
        const errorMsg = `打卡请求异常: ${e.message}`;
        console.error(`❌ ${errorMsg}`);
        await notify("打卡请求失败", errorMsg, true); // 强制弹出通知和警报
        return errorMsg;
    }
}

// ------------------------------------------------------------------
// --- (3) 主程序 ---
// ------------------------------------------------------------------

async function main() {
    console.log("=========================================");
    console.log("=== WeLink 自动打卡脚本开始执行 (V2.0) ===");
    console.log("=========================================");
    
    // 1. 加载或初始化认证数据
    const authData = await loadAuthData();
    
    // 2. 刷新 Token
    const refreshSuccess = await refreshAuthData(authData);
    
    let result = "";

    if (refreshSuccess) {
        // 3. 执行打卡
        result = await checkin(authData);
    } else {
        // Token 刷新失败，checkin 函数不会被调用，错误通知已在 refreshAuthData 中触发
        result = "Token 刷新失败，无法执行打卡。请检查配置或抓取新的 INITIAL_REFRESH_TOKEN。";
    }

    // 4. 脚本结束
    console.log("=== 脚本执行完毕 ===");
    // 在 refreshAuthData 和 checkin 内部已经处理了通知和 Alert，
    // 这里仅做脚本结束的标记。
}

await main();

// 必须调用 Script.complete() 结束脚本运行
Script.complete();