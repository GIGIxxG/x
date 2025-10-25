// Scriptable Script for WeLink Auto Check-in
//
// ------------------------------------------------------------------
// ⚠️ --- (1) 用户配置 (必须填写!) --- ⚠️
// 您必须用您自己的信息更新以下值。
// ------------------------------------------------------------------

// --- 来自 refresh.txt [来源 88] (Response Body) ---
// 粘贴您抓取到的 *最新* 的 refresh_token 值
// 这是脚本的“启动种子”，它只在第一次运行时使用。
// 脚本会自动更新这个值。
const INITIAL_REFRESH_TOKEN = "N5tToVmneYWPg0JEmiIo2g==e2A27tV2snfijyd8r4zHWXJ9RjS+e3UxWenZdcdH0sAvlU8PEjKSuA7uyIG8zc1YI/ZfjdEaVyoLpRfcPt0qc+ga+an5t1sfqE5lc9/1FFcpFfmPLTCQ8BxEz0JkZdTx3c3SfC6Ht6HtOYeqdu34fh+GuzBhWosJIFxN9Z/mtZUdHv8tGfNv+6ZNMAQC71vjmpym7zpEDQXJEpB9FlUKX65F4OwF9C+Fp6DUUtWrUR++kA+WZunelmQbAoytqJ1qi6D8jWq9UvaEvFWmpqDh1HGK9w9NPRkZh1sVbjJ3dN6T";

// --- 来自 refresh.txt [来源 86] (Request Body) ---
// 粘贴 refresh.txt 请求体中的 `tenantid=...` 的值
// !! 注意：只粘贴 `&` 和 `tenantid=` 之间的部分
const STATIC_TENANT_ID_ENCODED = "nT8N5Q2pSqKqWKqFyyBEtN1lT7vfxVejb7QFCBndHLwYDRbkbztWtWsS8oDyUavX9LZ9W/MKKnofbRiF6RSZF4TD61bc8qMZhzXkkm6UXzBXRHQlgYELHcwIPH2jI1Qi3pkj3TQ0F3H7FLaAY8Opzqju3FoBOiz3J5KEBHGsV%2BzVjphWZttUgdT%2BpwZ5h97olHOC2dD/MhutMFlULdsQc8kXWys0iFallpJ/9FMPLNXQpuRzcLLOutSs9hcOtnScecp8j2xHebqbpeRomq7hvyifZhhf5BGyTt3i/Hf6SYzV/9uRZGVzpDuIbrZDVnpEHu7MwT%2BBv6EC2PG0T8GxrNLreIketmyz31oTVlzgc6kCBMQ4T6gLzXuoReHHaPYg6qcQBi2yYO5mh23OiYYoRGxEpwZ6znrw2tBJd0FNijaV%2BD0BVg%2BAd2BfvSRPWJY1bJTLysGzuiklb2pbFIvlJGJTaQmy%2BDl46EK6MWmooviS135GSXcEUm8W5WmluD/l";

// --- 来自 all.txt (checkin 请求) [来源 2, 3] ---
const USER_DEVICE_ID = "5295F639-0CA9-4B42-87CD-B75B3BEF1A77"; // 'uuid'
const USER_EMPLOYEE_NUMBER = "3ZGHIG5PP7YI@AD802282B91";
const USER_IP = "10.245.32.114"; // 似乎是硬编码
const USER_MEAPIP = "198.18.129.164"; // 似乎是硬编码

// --- (来自 checkin req body [来源 3]) ---
const OFFICE_LOCATION = "江苏省苏州市虎丘区斜塘街道华为苏州研究所(北门)";
const OFFICE_CITY = "苏州市";
const OFFICE_PROVINCE = "江苏省";
const OFFICE_COUNTRY = "中国";


// ------------------------------------------------------------------
// (2) 脚本逻辑 (通常不需要修改)
// ------------------------------------------------------------------

// --- 文件管理器，用于存储 refresh_token ---
const fm = FileManager.local();
const scriptDir = fm.documentsDirectory();
const tokenFilePath = fm.joinPath(scriptDir, "welink_refresh_token.txt");

let alertTitle = "打卡失败";
let alertMessage = "发生未知错误。";

try {
    // --- 1. 加载 Refresh Token ---
    console.log("正在加载 Refresh Token...");
    let currentRefreshToken;
    if (fm.fileExists(tokenFilePath)) {
        currentRefreshToken = fm.readString(tokenFilePath);
        console.log("从文件加载 Token 成功。");
    } else {
        currentRefreshToken = INITIAL_REFRESH_TOKEN;
        console.log("使用初始 Token。");
    }

    // --- 2. 执行 Token 刷新 ---
    console.log("正在刷新 Token...");
    const authData = await fetchNewTokens(currentRefreshToken);
    
    // --- 3. 保存新的 Refresh Token ---
    fm.writeString(tokenFilePath, authData.newRefreshToken);
    console.log("新的 Refresh Token 已保存。");

    // --- 4. 获取动态数据 (GPS 和 WiFi) ---
	console.log("正在获取当前位置...");
    Location.setAccuracyToBest();
    const location = await Location.current();
    const locX = location.longitude.toString();
    const locY = location.latitude.toString();
    
    // --- 修复 WiFi API 调用 ---
    console.log("正在获取 WiFi 详情...");
    // 1. 正确调用 Device.wifi() 函数，它返回一个对象或 undefined
    const wifiInfo = Device.wifi(); 
    
    // 2. 检查 wifiInfo 是否存在。如果不存在 (如使用蜂窝网络)，则使用抓包的默认值 
    const wifiName = (wifiInfo && wifiInfo.ssid) ? wifiInfo.ssid : "Huawei-Employee";
    const wifiMac = (wifiInfo && wifiInfo.bssid) ? wifiInfo.bssid : "48:2c:d0:2a:6e:31";

    // --- 5. 执行打卡 ---
    console.log("正在发送打卡请求...");
    const checkinResponse = await fetchCheckin(authData, { locX, locY, wifiName, wifiMac });

    // --- 6. 处理打卡响应 ---
    console.log("收到打卡响应:");
    console.log(checkinResponse);
    if (checkinResponse.status === "1" && checkinResponse.msg === "打卡成功") {
        alertTitle = "打卡成功";
        alertMessage = `时间: ${checkinResponse.data.sysDate}\n地点: ${checkinResponse.data.location}`;
    } else {
        alertTitle = "打卡失败";
        alertMessage = checkinResponse.msg || "服务器返回错误。";
    }

} catch (e) {
    console.error(e);
    alertMessage = e.toString();
}

// --- 7. 显示最终结果 ---
let alert = new Alert();
alert.title = alertTitle;
alert.message = alertMessage;
alert.addAction("OK");
await alert.present();

Script.complete();


// ------------------------------------------------------------------
// 辅助函数
// ------------------------------------------------------------------

/**
 * [步骤1] 刷新 Token
 * (基于 refresh.txt [来源 1, 2, 3])
 *  * !! 已修复错误并优化 Cookie 解析 !!
 */
async function fetchNewTokens(refreshToken) {
    const url = "https://api.welink.huaweicloud.com/mcloud/mag/v7/refresh/LoginReg"; // [cite: 1]
    let req = new Request(url);
    req.method = "POST";
    
    // 设置 Headers [来源 1]
    req.headers = {
        "User-Agent": "WorkPlace/7.50.10 (iPhone; iOS 26.0.1; Scale/3.00)",
        "uuid": USER_DEVICE_ID,
        "Content-Type": "application/x-www-form-urlencoded" // [cite: 1]
    };
    
    // 设置 Body [来源 1]
    req.body = `refresh_token=${encodeURIComponent(refreshToken)}&tenantid=${STATIC_TENANT_ID_ENCODED}&thirdAuthType=3`;

    // --- 修复点 1 ---
    // 发送请求并直接解析 JSON 响应
    // req.loadJSON() 会自动处理 JSON.parse()
    const responseBody = await req.loadJSON(); // 
    
    // --- 修复点 2 (优化) ---
    // 从 req.response.cookies 数组中安全地解析 Cookies 
    const cookies = req.response.cookies;
    if (!cookies || cookies.length === 0) {
        throw new Error("刷新失败：未在响应中找到 Cookies。");
    }

    // 将 cookie 数组转换为一个易于查找的 Map
    const cookieMap = new Map();
    for (const cookie of cookies) {
        cookieMap.set(cookie.name, cookie.value);
    }
    
    const token = cookieMap.get("token");
    const cdnToken = cookieMap.get("cdn_token");
    const hwafSESID = cookieMap.get("HWWAFSESID");
    const hwafSESTIME = cookieMap.get("HWWAFSESTIME");
    
    // 从 Body 中解析新的 refresh_token
    const newRefreshToken = responseBody.refresh_token;

    if (!token || !cdnToken || !hwafSESID || !hwafSESTIME || !newRefreshToken) {
        console.error("Cookie 或 Token 解析不完整:", cookieMap, responseBody);
        throw new Error("Token 刷新失败: " + (responseBody.msg || "无法解析所有必需的 Cookie 或 refresh_token"));
    }
    
    return { token, cdnToken, hwafSESID, hwafSESTIME, newRefreshToken };
}

/**
 * [步骤2] 执行打卡
 * (基于 all.txt [来源 1, 2, 3, 4, 5])
 */
async function fetchCheckin(auth, dynamicData) {
    const url = "https://api.welink.huaweicloud.com/mcloud/mag/ProxyForText/mattend/service/mat/punchCardService/punchcardallFront"; // [来源 1]
    let req = new Request(url);
    req.method = "POST";
    
    // 构建完整的 Cookie
    const cookie = `HWWAFSESID=${auth.hwafSESID}; HWWAFSESTIME=${auth.hwafSESTIME}; cdn_token=${auth.cdnToken}; token=${auth.token}`;
    
    // 设置 Headers [来源 1, 2]
    req.headers = {
        "lang": "zh",
        "User-Agent": "WorkPlace/7.50.10 (iPhone; iOS 26.0.1; Scale/3.00)",
        "Cookie": cookie,
        "x-wlk-gray": "0",
        "uuid": USER_DEVICE_ID,
        "Content-Type": "application/json" // [来源 2]
        // 其他 headers 似乎不是严格必需的
    };
    
    // 设置 Body [来源 3]
    const body = {
        "employeeNumber" : USER_EMPLOYEE_NUMBER,
        "x" : dynamicData.locX, // 动态
        "wifiList" : [
            {
              "wifiMac" : dynamicData.wifiMac, // 动态
              "wifiName" : dynamicData.wifiName // 动态
            }
        ],
        "meapip" : USER_MEAPIP,
        "y" : dynamicData.locY, // 动态
        "province" : OFFICE_PROVINCE,
        "deviceId" : USER_DEVICE_ID,
        "locale" : "cn",
        "deviceType" : "2",
        "verticalAccuracy" : "0",
        "location" : OFFICE_LOCATION,
        "ip" : USER_IP,
        "city" : OFFICE_CITY,
        "country" : "中国"
    };
    
    req.body = JSON.stringify(body);
    
    return await req.loadJSON(); // [来源 4, 5]
}