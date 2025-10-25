// WeLinkAutoCheckin.js
// 在 Scriptable 中运行

class WeLinkAutoCheckin {
  constructor() {
    this.baseURL = "https://api.welink.huaweicloud.com"
    this.deviceId = "5295F639-0CA9-4B42-87CD-B75B3BEF1A77"
  }
  
  // 登录获取 token
  async login() {
    const loginURL = `${this.baseURL}/mcloud/mag/ProxyForText/weaccess/strategy/api/v3/login`
    
    const loginBody = {
      "os_ver": "26.0.1",
      "lang": "en", 
      "device_id": this.deviceId,
      "client_policy_ver": 39,
      "app_key": "com.huawei.mobile.weaccess",
      "os_type": "iOS",
      "app_sec": "593fc2b133794427baffd11b0456dbb9",
      "sdk_ver": "1.0.0001"
    }
    
    const loginHeaders = {
      "Content-Type": "application/json",
      "X-Weaccess-Trace-ID": this.generateUUID(),
      "X-Weaccess-Authorization": "bj750fec-bdb5-5c7d-bdac-9ea73ac6836e",
      "X-User-Agent": "WeAccess-IOS",
      "X-Weaccess-Org-Schema": "https",
      "User-Agent": "WeLink/703 CFNetwork/3860.100.1 Darwin/25.0.0",
      "X-Weaccess-Auth-Ver": "v3"
    }
    
    try {
      const loginRequest = new Request(loginURL)
      loginRequest.method = "POST"
      loginRequest.headers = loginHeaders
      loginRequest.body = JSON.stringify(loginBody)
      
      const loginResponse = await loginRequest.loadJSON()
      
      if (loginResponse.code === 0) {
        return loginResponse.data.token
      } else {
        throw new Error(`登录失败: ${loginResponse.msg}`)
      }
    } catch (error) {
      throw new Error(`登录请求失败: ${error}`)
    }
  }
  
  // 执行打卡
  async checkin(accessToken) {
    const checkinURL = `${this.baseURL}/mcloud/mag/ProxyForText/mattend/service/mat/punchCardService/punchcardallFront`
    
    // 获取当前位置信息
    const location = await this.getCurrentLocation()
    
    const checkinBody = {
      "employeeNumber": "3ZGHIG5PP7YI@AD802282B91",
      "x": location.longitude.toString(),
      "y": location.latitude.toString(),
      "wifiList": [
        {
          "wifiMac": "48:2c:d0:2a:6e:31",
          "wifiName": "Huawei-Employee"
        }
      ],
      "meapip": "198.18.129.164",
      "province": location.province,
      "deviceId": this.deviceId,
      "locale": "cn",
      "deviceType": "2",
      "verticalAccuracy": "0",
      "location": location.address,
      "ip": "10.245.32.114",
      "city": location.city,
      "country": "中国"
    }
    
    const checkinHeaders = {
      "Cookie": `token=${accessToken}`,
      "lang": "zh",
      "User-Agent": "WorkPlace/7.50.10 (iPhone; iOS 26.0.1; Scale/3.00)",
      "traceId": this.generateUUID(),
      "deviceType": "0",
      "deviceName": "iPhone15,3",
      "X-Product-Type": "0",
      "appVersion": "7.50.10",
      "uuid": this.deviceId,
      "osTarget": "1",
      "appName": "WeLink",
      "buildCode": "703",
      "Accept-Language": "en-US;q=1, zh-Hans-US;q=0.9",
      "X-Cloud-Type": "1",
      "businessVersionCode": "703",
      "Content-Type": "application/json"
    }
    
    try {
      const checkinRequest = new Request(checkinURL)
      checkinRequest.method = "POST"
      checkinRequest.headers = checkinHeaders
      checkinRequest.body = JSON.stringify(checkinBody)
      
      const checkinResponse = await checkinRequest.loadJSON()
      
      if (checkinResponse.status === "1") {
        return {
          success: true,
          message: checkinResponse.msg,
          location: checkinResponse.data.location,
          time: checkinResponse.data.sysDate
        }
      } else {
        return {
          success: false,
          message: checkinResponse.msg || "打卡失败"
        }
      }
    } catch (error) {
      throw new Error(`打卡请求失败: ${error}`)
    }
  }
  
  // 获取当前位置
  async getCurrentLocation() {
    try {
      // 使用 iOS 定位服务
      const location = await Location.current()
      
      // 逆地理编码获取地址信息
      const geocoder = new Geocoder()
      const places = await geocoder.reverseGeocode(location.latitude, location.longitude)
      
      if (places.length > 0) {
        const place = places[0]
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          province: place.administrativeArea || "江苏省",
          city: place.locality || "苏州市",
          address: place.name || "江苏省苏州市虎丘区斜塘街道华为苏州研究所(北门)"
        }
      }
      
      // 默认位置（华为苏州研究所）
      return {
        latitude: 31.275254,
        longitude: 120.798321,
        province: "江苏省",
        city: "苏州市", 
        address: "江苏省苏州市虎丘区斜塘街道华为苏州研究所(北门)"
      }
    } catch (error) {
      // 如果定位失败，使用默认位置
      return {
        latitude: 31.275254,
        longitude: 120.798321,
        province: "江苏省",
        city: "苏州市",
        address: "江苏省苏州市虎丘区斜塘街道华为苏州研究所(北门)"
      }
    }
  }
  
  // 生成 UUID
  generateUUID() {
    return 'WK-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
  }
  
  // 主执行函数
  async run() {
    try {
      // 1. 登录获取 token
      const alert = new Alert()
      alert.title = "WeLink 自动打卡"
      alert.message = "正在登录..."
      await alert.present()
      
      const accessToken = await this.login()
      
      // 2. 执行打卡
      alert.message = "登录成功，正在打卡..."
      await alert.present()
      
      const result = await this.checkin(accessToken)
      
      // 3. 显示结果
      if (result.success) {
        alert.title = "打卡成功"
        alert.message = `位置: ${result.location}\n时间: ${result.time}`
      } else {
        alert.title = "打卡失败" 
        alert.message = result.message
      }
      
      await alert.present()
      
      return result
      
    } catch (error) {
      const alert = new Alert()
      alert.title = "打卡错误"
      alert.message = error.message
      await alert.present()
      return { success: false, message: error.message }
    }
  }
}

// 执行脚本
if (typeof config !== 'undefined' && config.runsInWidget) {
  // 小组件模式
  const widget = new ListWidget()
  widget.addText("WeLink 打卡")
  Script.setWidget(widget)
} else {
  // 直接运行模式
  const checker = new WeLinkAutoCheckin()
  await checker.run()
}