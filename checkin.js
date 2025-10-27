// WeLink 自动签到脚本
// Scriptable 使用

// ============= 配置区域 =============
const CONFIG = {
  // 需要保存到 Keychain 的密钥名称
  KEYCHAIN_REFRESH_TOKEN: 'welink_refresh_token',
  KEYCHAIN_TENANTID: 'welink_tenantid',
  KEYCHAIN_TOKEN: 'welink_token',
  
  // API 基础 URL
  BASE_URL: 'https://api.welink.huaweicloud.com',
  
  // 用户信息（根据实际情况修改）
  USER_INFO: {
    employeeNumber: "3ZGHIG5PP7YI@AD802282B91",
    deviceId: "5295F639-0CA9-4B42-87CD-B75B3BEF1A77",
    deviceType: "2",
    deviceName: "iPhone15,3",
    uuid: "5295F639-0CA9-4B42-87CD-B75B3BEF1A77"
  }
};

// ============= 工具函数 =============

/**
 * 从 Keychain 读取数据
 */
function getKeychainValue(key) {
  const keychain = Keychain.all();
  return keychain[key] || null;
}

/**
 * 保存数据到 Keychain
 */
function setKeychainValue(key, value) {
  const keychain = Keychain.all();
  keychain[key] = value;
  Keychain.all = keychain;
}

/**
 * 将 object 转为 form-urlencoded 格式
 */
function urlEncodeObject(obj) {
  return Object.keys(obj)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
}

/**
 * 生成请求头
 */
function generateHeaders(contentType = 'application/json', token = null) {
  const headers = {
    'User-Agent': 'WorkPlace/7.50.10 (iPhone; iOS 26.0.1; Scale/3.00)',
    'lang': 'zh',
    'deviceType': '0',
    'deviceName': CONFIG.USER_INFO.deviceName,
    'X-Product-Type': '0',
    'appVersion': '7.50.10',
    'uuid': CONFIG.USER_INFO.uuid,
    'osTarget': '1',
    'appName': 'WeLink',
    'Connection': 'keep-alive',
    'buildCode': '703',
    'Accept-Language': 'en-US;q=1, zh-Hans-US;q=0.9',
    'X-Cloud-Type': '1',
    'businessVersionCode': '703',
    'Accept': '*/*',
    'Content-Type': contentType,
    'Accept-Encoding': 'gzip, deflate, br'
  };
  
  if (token) {
    headers['Cookie'] = `token=${token}`;
  }
  
  return headers;
}

// ============= 核心功能 =============

/**
 * 刷新 Token
 */
async function refreshToken() {
  console.log('开始刷新 Token...');
  
  const refreshToken = getKeychainValue(CONFIG.KEYCHAIN_REFRESH_TOKEN);
  const tenantid = getKeychainValue(CONFIG.KEYCHAIN_TENANTID);
  
  if (!refreshToken || !tenantid) {
    throw new Error('缺少必要的凭证信息，请先设置 refresh_token 和 tenantid');
  }
  
  const url = `${CONFIG.BASE_URL}/mcloud/mag/v7/refresh/LoginReg`;
  const body = {
    refresh_token: refreshToken,
    tenantid: tenantid,
    thirdAuthType: '3'
  };
  
  const headers = generateHeaders('application/x-www-form-urlencoded');
  
  const request = new Request(url);
  request.method = 'POST';
  request.headers = headers;
  request.body = urlEncodeObject(body);
  
  try {
    const response = await request.loadJSON();
    
    if (response.login === 'successed') {
      console.log('Token 刷新成功');
      
      // 保存新的 token 和 refresh_token
      if (response.access_token) {
        setKeychainValue(CONFIG.KEYCHAIN_TOKEN, response.access_token);
      }
      if (response.refresh_token) {
        setKeychainValue(CONFIG.KEYCHAIN_REFRESH_TOKEN, response.refresh_token);
      }
      
      return response.access_token;
    } else {
      throw new Error('Token 刷新失败: ' + (response.msg || '未知错误'));
    }
  } catch (error) {
    throw new Error('刷新 Token 请求失败: ' + error.message);
  }
}

/**
 * 获取当前有效的 Token
 */
async function getValidToken() {
  let token = getKeychainValue(CONFIG.KEYCHAIN_TOKEN);
  
  // 如果 token 不存在或需要刷新，则刷新 token
  if (!token) {
    console.log('Token 不存在，刷新 Token...');
    token = await refreshToken();
  }
  
  return token;
}

/**
 * 执行签到
 */
async function doCheckIn() {
  console.log('开始签到...');
  
  const token = await getValidToken();
  
  // 这里需要实际的 GPS 位置信息
  // 你可以使用 Scriptable 的 Location API 获取实际位置
  // 或者使用固定的位置信息（从抓包数据中获取）
  const location = {
    "employeeNumber": CONFIG.USER_INFO.employeeNumber,
    "x": "120.798321", // 经度
    "y": "31.275254", // 纬度
    "wifiList": [
      {
        "wifiMac": "48:2c:d0:2a:6e:31",
        "wifiName": "Huawei-Employee"
      }
    ],
    "meapip": "198.18.129.164",
    "province": "江苏省",
    "deviceId": CONFIG.USER_INFO.deviceId,
    "locale": "cn",
    "deviceType": CONFIG.USER_INFO.deviceType,
    "verticalAccuracy": "0",
    "location": "江苏省苏州市虎丘区斜塘街道华为苏州研究所(北门)",
    "ip": "10.245.32.114",
    "city": "苏州市",
    "country": "中国"
  };
  
  const url = `${CONFIG.BASE_URL}/mcloud/mag/ProxyForText/mattend/service/mat/punchCardService/punchcardallFront`;
  
  const headers = generateHeaders('application/json', token);
  headers['traceId'] = generateTraceId();
  
  const request = new Request(url);
  request.method = 'POST';
  request.headers = headers;
  request.body = JSON.stringify(location);
  
  try {
    const response = await request.loadJSON();
    
    console.log('签到响应:', response);
    
    if (response.status === "1" && response.msg === "打卡成功") {
      console.log('✅ 签到成功！');
      return {
        success: true,
        message: response.msg,
        data: response.data
      };
    } else if (response.msg) {
      // Token 可能过期，尝试刷新后重试
      if (response.msg.includes('token') || response.msg.includes('认证') || response.msg.includes('登录')) {
        console.log('Token 可能过期，重新刷新并重试...');
        const newToken = await refreshToken();
        
        // 使用新 token 重试
        headers['Cookie'] = `token=${newToken}`;
        request.headers = headers;
        const retryResponse = await request.loadJSON();
        
        if (retryResponse.status === "1" && retryResponse.msg === "打卡成功") {
          console.log('✅ 签到成功！（重试后）');
          return {
            success: true,
            message: retryResponse.msg,
            data: retryResponse.data
          };
        }
      }
      
      return {
        success: false,
        message: response.msg,
        data: response.data
      };
    } else {
      return {
        success: false,
        message: '签到失败',
        data: response
      };
    }
  } catch (error) {
    throw new Error('签到请求失败: ' + error.message);
  }
}

/**
 * 生成 Trace ID
 */
function generateTraceId() {
  const chars = 'ABCDEF0123456789';
  let traceId = 'WK-';
  for (let i = 0; i < 8; i++) traceId += chars[Math.floor(Math.random() * chars.length)];
  traceId += '-';
  for (let i = 0; i < 4; i++) traceId += chars[Math.floor(Math.random() * chars.length)];
  traceId += '-';
  for (let i = 0; i < 4; i++) traceId += chars[Math.floor(Math.random() * chars.length)];
  traceId += '-';
  for (let i = 0; i < 4; i++) traceId += chars[Math.floor(Math.random() * chars.length)];
  traceId += '-';
  for (let i = 0; i < 12; i++) traceId += chars[Math.floor(Math.random() * chars.length)];
  return traceId;
}

/**
 * 设置初始凭证
 * 首次使用时需要调用此函数设置 refresh_token 和 tenantid
 */
function setCredentials(refreshToken, tenantid) {
  setKeychainValue(CONFIG.KEYCHAIN_REFRESH_TOKEN, refreshToken);
  setKeychainValue(CONFIG.KEYCHAIN_TENANTID, tenantid);
  console.log('凭证已保存');
}

// ============= 主函数 =============

async function main() {
  try {
    console.log('开始执行签到流程...');
    
    // 如果是首次使用，需要先设置凭证
    // 取消下面的注释并填入你的 refresh_token 和 tenantid
    /*
    setCredentials(
      'qWTB3obvCBSlW9HdMkONzQ%3D%3D9lZfJZYNBixj%2B6sFORKyfiVM0nHJzR3qaQFic4W9snIfmHTLeAANWIXC36xQL/%2B/4UQzMeNhe7v6a348NOX3vGjIRaYnn/uo80mEcq/xaZ9V3%2BMiQW1J5B9s8jhHLFCJgQTaQ2K5qpAJA%2BJ3IC9mSm/5scDLT6l%2BD2UhdE9sRZAxcoWxpbpM8v0bvdHqVtdRWLeWqzRxqYiSPScNZuCqvDb7XKBq1or94gi/RTqfsR2Z3SrslOCPoe/zTCp6z0FgmCZk1m5KKtU3Tao09C40QYJlIxOLfhgUJtiFibNr%2B66U',
      'nT8N5Q2pSqKqWKqFyyBEtN1lT7vfxVejb7QFCBndHLwYDRbkbztWtWsS8oDyUavX9LZ9W/MKKnofbRiF6RSZF4TD61bc8qMZhzXkkm6UXzBXRHQlgYELHcwIPH2jI1Qi3pkj3TQ0F3H7FLaAY8Opzqju3FoBOiz3J5KEBHGsV%2BzVjphWZttUgdT%2BpwZ5h97olHOC2dD/MhutMFlULdsQc8kXWys0iFallpJ/9FMPLNXQpuRzcLLOutSs9hcOtnScecp8j2xHebqbpeRomq7hvyifZhhf5BGyTt3i/Hf6SYzV/9uRZGVzpDuIbrZDVnpEHu7MwT%2BBv6EC2PG0T8GxrNLreIketmyz31oTVlzgc6kCBMQ4T6gLzXuoReHHaPYg6qcQBi2yYO5mh23OiYYoRGxEpwZ6znrw2tBJd0FNijaV%2BD0BVg%2BAd2BfvSRPWJY1bJTLysGzuiklb2pbFIvlJGJTaQmy%2BDl46EK6MWmooviS135GSXcEUm8W5WmluD/l'
    );
    */
    
    const result = await doCheckIn();
    
    if (result.success) {
      // 签到成功，发送通知
      if (config.runsWithSiri || config.runsFromApp) {
        const notification = new Notification();
        notification.title = 'WeLink 签到成功';
        notification.body = result.message;
        await notification.schedule();
      }
      
      console.log('签到完成:', result.message);
    } else {
      console.log('签到失败:', result.message);
    }
    
    return result;
  } catch (error) {
    console.log('发生错误:', error.message);
    if (config.runsWithSiri || config.runsFromApp) {
      const notification = new Notification();
      notification.title = 'WeLink 签到失败';
      notification.body = error.message;
      await notification.schedule();
    }
    throw error;
  }
}

// 导出函数供外部调用
module.exports = {
  checkIn: doCheckIn,
  refreshToken: refreshToken,
  setCredentials: setCredentials,
  getValidToken: getValidToken
};

// 如果直接运行此脚本，执行主函数
if (typeof require === 'undefined' || require.main === module) {
  main();
}

