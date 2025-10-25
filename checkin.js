// Scriptable 脚本 for WeLink Check-in
//
// ------------------------------------------------------------------
// ⚠️ --- (1) 用户配置 --- ⚠️
// 您必须用您自己的信息更新以下值。
// 这些值来自您提供的 all.txt 日志文件。
// ------------------------------------------------------------------

// --- (来自 login response headers [来源 7]) ---
// 这是您刚抓取到的新 Token，有效期 2 小时
const USER_TOKEN = "bj202841-e0d8-b0c8-e61a-a16be6dca37e"; 

// --- (来自 login response headers [来源 7]) ---
// cdn_token 似乎也需要
const CDN_TOKEN = "967C2F6B3FCB4B58BF8727151CF94B98#1761415563#94d2f59056699f8d6acc0c66f0acaab1a539864166147e13d4d4ba21b11e223c";

// --- (来自 checkin request headers [来源 1, 2]) ---
const USER_TRACE_ID = "WK-00EF757D-1FDC-4D50-B087-2A445E2E7403";
const USER_DEVICE_ID = "5295F639-0CA9-4B42-87CD-B75B3BEF1A77"; // 也是 'uuid'
const HWWAFSESID_COOKIE = "HWWAFSESID=eb4f23496b49710e66b"; // (来自 checkin req [来源 1])
const HWWAFSESTIME_COOKIE = "HWWAFSESTIME=1761359423922"; // (来自 checkin req [来源 1])

// --- (来自 checkin request body [来源 3]) ---
const USER_EMPLOYEE_NUMBER = "3ZGHIG5PP7YI@AD802282B91";
const USER_IP = "10.245.32.114";
const USER_MEAPIP = "198.18.129.164";

// --- (来自 checkin request body [来源 3]) ---
// 服务器很可能需要验证您是否在 *这个特定的* 办公地点。
const OFFICE_LOCATION = "江苏省苏州市虎丘区斜塘街道华为苏州研究所(北门)";
const OFFICE_CITY = "苏州市";
const OFFICE_PROVINCE = "江苏省";
const OFFICE_COUNTRY = "中国";


// ------------------------------------------------------------------
// (2) 脚本逻辑 (通常不需要修改)
// ------------------------------------------------------------------

let alertTitle = "打卡失败";
let alertMessage = "发生未知错误。";

try {
    // --- 1. 获取动态数据 (GPS 和 WiFi) ---
    console.log("正在获取当前位置...");
    // 请求高精度位置
    Location.setAccuracyToBest();
    const location = await Location.current();
    const locX = location.longitude.toString(); // 经度
    const locY = location.latitude.toString(); // 纬度
    
    console.log("正在获取 WiFi 详情...");
    const wifiName = Device.wifi.ssid() || "Huawei-Employee"; // 默认值
    const wifiMac = Device.wifi.bssid() || "48:2c:d0:2a:6e:31"; // 默认值

    // --- 2. 构建请求 ---
    const url = "https://api.welink.huaweicloud.com/mcloud/mag/ProxyForText/mattend/service/mat/punchCardService/punchcardallFront"; // [来源 1]
    let req = new Request(url);
    req.method = "POST";

    // --- 3. 设置 Headers (来自 checkin req [来源 1, 2]) ---
    
    // 构建完整的 Cookie
    const cookie = `${HWWAFSESID_COOKIE}; ${HWWAFSESTIME_COOKIE}; cdn_token=${CDN_TOKEN}; token=${USER_TOKEN}`;
    
    req.headers = {
        "lang": "zh",
        "User-Agent": "WorkPlace/7.50.10 (iPhone; iOS 26.0.1; Scale/3.00)",
        "traceId": USER_TRACE_ID,
        "Cookie": cookie,
        "x-wlk-gray": "0",
        "deviceType": "0",
        "deviceName": "iPhone15,3",
        "X-Product-Type": "0",
        "appVersion": "7.50.10",
        "uuid": USER_DEVICE_ID,
        "osTarget": "1",
        "appName": "WeLink",
        "buildCode": "703",
        "Accept-Language": "en-US;q=1, zh-Hans-US;q=0.9",
        "X-Cloud-Type": "1",
        "businessVersionCode": "703",
        "Accept": "*/*",
        "Content-Type": "application/json"
    };
    
    // --- 4. 设置 Body (来自 checkin req [来源 3]) ---
    const body = {
        "employeeNumber" : USER_EMPLOYEE_NUMBER,
        "x" : locX, // 使用动态获取的经度
        "wifiList" : [
            {
              "wifiMac" : wifiMac, // 使用动态获取的 WiFi BSSID
              "wifiName" : wifiName // 使用动态获取的 WiFi SSID
            }
        ],
        "meapip" : USER_MEAPIP,
        "y" : locY, // 使用动态获取的纬度
        "province" : OFFICE_PROVINCE,
        "deviceId" : USER_DEVICE_ID,
        "locale" : "cn",
        "deviceType" : "2",
        "verticalAccuracy" : "0", // 似乎是硬编码的
        "location" : OFFICE_LOCATION,
        "ip" : USER_IP, // 似乎是硬编码的
        "city" : OFFICE_CITY,
        "country" : OFFICE_COUNTRY
    };
    
    req.body = JSON.stringify(body);
    
    // --- 5. 发送请求 ---
    console.log("正在发送打卡请求...");
    const response = await req.loadJSON();
    console.log("收到响应:");
    console.log(response);

    // --- 6. 处理响应 (基于 checkin resp [来源 4]) ---
    if (response.status === "1" && response.msg === "打卡成功") {
        alertTitle = "打卡成功";
        alertMessage = `时间: ${response.data.sysDate}\n地点: ${response.data.location}`;
    } else {
        alertTitle = "打卡失败";
        alertMessage = response.msg || "服务器返回错误。";
    }
    
} catch (e) {
    console.error(e);
    alertMessage = e.toString();
}

// --- 7. 显示结果 ---
let alert = new Alert();
alert.title = alertTitle;
alert.message = alertMessage;
alert.addAction("OK");
await alert.present();

Script.complete();