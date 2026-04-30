/*
长城汽车网关 API 自动获取 Token 脚本
项目名称: GWM Gateway Auto Token
功能：自动抓取网关 API 的认证信息（accessToken, beanId, 静态签名）

[rewrite_local]
# 匹配网关 API 的车辆相关接口
^https:\/\/gw-app-gateway\.gwmapp-h\.com\/app-api\/api\/v3\.0\/(vehicle|user)\/.* url script-request-body https://raw.githubusercontent.com/你的用户名/Quantumult-X/refs/heads/main/rewrite/gwm_gateway_auto_token.js

[mitm]
hostname = *.gwmapp-h.com
*/

const $ = new Env("长城汽车网关Token抓取");

// ============================================================
// ⚙️ 配置区域
// ============================================================
const KEY_ACCESS_TOKEN = "duoxiong_gwm_access_token";
const KEY_BEAN_ID = "duoxiong_gwm_bean_id";
const KEY_BT_AUTH_SIGN = "duoxiong_gwm_bt_auth_sign";
const KEY_BT_AUTH_TIMESTAMP = "duoxiong_gwm_bt_auth_timestamp";
const KEY_BT_AUTH_NONCE = "duoxiong_gwm_bt_auth_nonce";
const KEY_VIN = "duoxiong_gwm_vin";
const KEY_UPDATE_TIME = "duoxiong_gwm_update_time";

// ============================================================
// 🚦 逻辑入口
// ============================================================
if (typeof $request !== "undefined") {
  GetGatewayToken();
  $done({});
} else {
  // 定时任务模式下显示当前保存的 Token 信息
  ShowSavedToken();
  $done();
}

// ============================================================
// 📡 抓取网关 API 认证信息
// ============================================================
function GetGatewayToken() {
  const url = $request.url;
  const headers = $request.headers;
  
  console.log("🔍 检测到网关 API 请求: " + url);
  
  // 从 URL 中提取 VIN
  let vin = "";
  const vinMatch = url.match(/[?&]vin=([^&]+)/);
  if (vinMatch && vinMatch[1]) {
    vin = vinMatch[1];
    console.log("📱 车辆 VIN: " + vin);
  }
  
  // 遍历请求头，提取认证信息
  let accessToken, beanId, btAuthSign, btAuthTimestamp, btAuthNonce;
  
  for (let key in headers) {
    const k = key.toLowerCase();
    
    if (k === "accesstoken") {
      accessToken = headers[key];
      console.log("🔑 找到 accessToken: " + accessToken.substring(0, 50) + "...");
    }
    else if (k === "beanid") {
      beanId = headers[key];
      console.log("🔑 找到 beanId: " + beanId);
    }
    else if (k === "bt-auth-sign") {
      btAuthSign = headers[key];
      console.log("🔑 找到 bt-auth-sign: " + btAuthSign.substring(0, 32) + "...");
    }
    else if (k === "bt-auth-timestamp") {
      btAuthTimestamp = headers[key];
      console.log("🔑 找到 bt-auth-timestamp: " + btAuthTimestamp);
    }
    else if (k === "bt-auth-nonce") {
      btAuthNonce = headers[key];
      console.log("🔑 找到 bt-auth-nonce: " + btAuthNonce);
    }
  }
  
  // 验证是否获取到所有必要信息
  if (accessToken && beanId && btAuthSign && btAuthTimestamp && btAuthNonce) {
    // 保存认证信息
    const updateTime = new Date().getTime();
    
    $prefs.setValueForKey(accessToken, KEY_ACCESS_TOKEN);
    $prefs.setValueForKey(beanId, KEY_BEAN_ID);
    $prefs.setValueForKey(btAuthSign, KEY_BT_AUTH_SIGN);
    $prefs.setValueForKey(btAuthTimestamp, KEY_BT_AUTH_TIMESTAMP);
    $prefs.setValueForKey(btAuthNonce, KEY_BT_AUTH_NONCE);
    
    if (vin) {
      $prefs.setValueForKey(vin, KEY_VIN);
    }
    
    $prefs.setValueForKey(updateTime.toString(), KEY_UPDATE_TIME);
    
    const updateTimeStr = new Date(updateTime).toLocaleString('zh-CN');
    
    console.log("✅ 网关 Token 抓取成功！更新时间: " + updateTimeStr);
    $notify("长城汽车", "✅ 网关 Token 已更新", "时间: " + updateTimeStr);
  } else {
    console.log("⚠️ 未能获取完整的认证信息");
    console.log("  accessToken: " + (accessToken ? "✓" : "✗"));
    console.log("  beanId: " + (beanId ? "✓" : "✗"));
    console.log("  bt-auth-sign: " + (btAuthSign ? "✓" : "✗"));
    console.log("  bt-auth-timestamp: " + (btAuthTimestamp ? "✓" : "✗"));
    console.log("  bt-auth-nonce: " + (btAuthNonce ? "✓" : "✗"));
  }
}

// ============================================================
// 📋 显示已保存的 Token 信息
// ============================================================
function ShowSavedToken() {
  const accessToken = $prefs.valueForKey(KEY_ACCESS_TOKEN);
  const beanId = $prefs.valueForKey(KEY_BEAN_ID);
  const btAuthSign = $prefs.valueForKey(KEY_BT_AUTH_SIGN);
  const btAuthTimestamp = $prefs.valueForKey(KEY_BT_AUTH_TIMESTAMP);
  const btAuthNonce = $prefs.valueForKey(KEY_BT_AUTH_NONCE);
  const vin = $prefs.valueForKey(KEY_VIN);
  const updateTime = $prefs.valueForKey(KEY_UPDATE_TIME);
  
  console.log("\n" + "=".repeat(60));
  console.log("📋 已保存的网关认证信息:");
  console.log("=".repeat(60));
  
  if (accessToken) {
    console.log("✅ accessToken: " + accessToken.substring(0, 50) + "...");
  } else {
    console.log("❌ accessToken: 未保存");
  }
  
  if (beanId) {
    console.log("✅ beanId: " + beanId);
  } else {
    console.log("❌ beanId: 未保存");
  }
  
  if (btAuthSign) {
    console.log("✅ bt-auth-sign: " + btAuthSign.substring(0, 32) + "...");
  } else {
    console.log("❌ bt-auth-sign: 未保存");
  }
  
  if (btAuthTimestamp) {
    console.log("✅ bt-auth-timestamp: " + btAuthTimestamp);
  } else {
    console.log("❌ bt-auth-timestamp: 未保存");
  }
  
  if (btAuthNonce) {
    console.log("✅ bt-auth-nonce: " + btAuthNonce);
  } else {
    console.log("❌ bt-auth-nonce: 未保存");
  }
  
  if (vin) {
    console.log("✅ VIN: " + vin);
  } else {
    console.log("⚠️ VIN: 未保存");
  }
  
  if (updateTime) {
    const updateTimeStr = new Date(parseInt(updateTime)).toLocaleString('zh-CN');
    console.log("🕐 更新时间: " + updateTimeStr);
    
    // 计算 Token 年龄
    const now = new Date().getTime();
    const ageMinutes = Math.floor((now - parseInt(updateTime)) / 60000);
    console.log("⏱️ Token 年龄: " + ageMinutes + " 分钟");
    
    if (ageMinutes > 1440) {
      console.log("⚠️ 警告: Token 可能已过期（超过24小时）");
    }
  } else {
    console.log("❌ 更新时间: 未保存");
  }
  
  console.log("=".repeat(60));
  console.log("\n💡 提示:");
  console.log("  1. 打开长城汽车 App");
  console.log("  2. 执行登录");
  console.log("  3. 查看车辆状态");
  console.log("  4. 脚本会自动抓取并保存认证信息");
  console.log("=".repeat(60) + "\n");
}

// ============================================================
// 🌍 环境类
// ============================================================
function Env(t) {
  return new class {
    constructor(t) {
      this.name = t
    }
    msg(t, e, s) {
      if ("undefined" != typeof $notify) $notify(t, e, s);
      console.log(`[${t}] ${e} - ${s}`)
    }
    setdata(t, e) {
      return "undefined" != typeof $prefs ?
        $prefs.setValueForKey(t, e) :
        "undefined" != typeof $persistentStore ?
        $persistentStore.write(t, e) :
        void 0
    }
    getdata(t) {
      return "undefined" != typeof $prefs ?
        $prefs.valueForKey(t) :
        "undefined" != typeof $persistentStore ?
        $persistentStore.read(t) :
        void 0
    }
    done() {
      "undefined" != typeof $done && $done({})
    }
  }(t)
}