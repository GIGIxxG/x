// 长城汽车App - 车辆状态查看与控制小组件
// 使用方法：在Scriptable中创建新脚本，粘贴此代码
// 需要在首次运行时配置好认证信息

// ========== 配置区域 ==========
// 从抓包中提取的认证信息（需要替换成你自己的）
const GWM_CONFIG = {
  vin: "LGWEFUK69NK408870",       // 车辆识别码
  accessToken: "YOUR_ACCESS_TOKEN", // JWT访问令牌（从抓包获取）
  userId: "3551438122679631872",   // 用户ID（beanId）
  brand: "10",                     // 品牌代码
  enterpriseId: "CC01",            // 企业ID
  appId: "12345678",               // 应用ID
  btAuthAppkey: "7863128529",      // 认证密钥
  btAuthSign: "YOUR_BT_AUTH_SIGN", // 签名（从抓包获取）
  btAuthTimestamp: "0",            // 时间戳（从抓包获取）
  btAuthNonce: "YOUR_NONCE"        // 随机字符串（从抓包获取）
};

// ========== API配置 ==========
const API_GATEWAY = "https://gw-app-gateway.gwmapp-h.com/app-api";

// ========== 远程控制指令定义 ==========
const COMMANDS = {
  AIR_CONDITIONER_START: { name: "开启空调", icon: "❄️", group: "空调" },
  AIR_CONDITIONER_STOP: { name: "关闭空调", icon: "🌬️", group: "空调" },
  DOOR_LOCK: { name: "锁车", icon: "🔒", group: "车锁" },
  DOOR_UNLOCK: { name: "解锁", icon: "🔓", group: "车锁" },
  WINDOW_CLOSE: { name: "关窗", icon: "🪟", group: "车窗" },
  FIND_CAR_FLASH: { name: "闪灯寻车", icon: "💡", group: "寻车" },
  FIND_CAR_HORN: { name: "鸣笛寻车", icon: "📢", group: "寻车" },
  FIND_CAR_FLASH_HORN: { name: "闪灯鸣笛", icon: "🚨", group: "寻车" },
  SEAT_HEATING_START: { name: "座椅加热", icon: "💺", group: "座椅" },
  STEERING_WHEEL_HEATING: { name: "方向盘加热", icon: "🔥", group: "方向盘" },
  DEFROST_FRONT_START: { name: "前除霜", icon: "🌫️", group: "除霜" },
  DEFROST_BACK_START: { name: "后除霜", icon: "🌫️", group: "除霜" },
  BACK_DOOR_OPEN: { name: "开后背门", icon: "🚙", group: "后背门" },
  BACK_DOOR_CLOSE: { name: "关后背门", icon: "🚙", group: "后背门" },
  CABIN_CLEAN_START: { name: "座舱清洁", icon: "🧹", group: "座舱" },
  AC_ULTRAVIOLET: { name: "紫外线杀菌", icon: "🦠", group: "空调" }
};

// ========== 工具函数 ==========

function generateNonce() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 16; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

function getHeaders() {
  return {
    "Host": "gw-app-gateway.gwmapp-h.com",
    "appId": GWM_CONFIG.appId,
    "beanId": GWM_CONFIG.userId,
    "bt-auth-appkey": GWM_CONFIG.btAuthAppkey,
    "bt-auth-sign": GWM_CONFIG.btAuthSign,
    "bt-auth-timestamp": GWM_CONFIG.btAuthTimestamp || String(Date.now()),
    "bt-auth-nonce": GWM_CONFIG.btAuthNonce || generateNonce(),
    "accessToken": GWM_CONFIG.accessToken,
    "brand": GWM_CONFIG.brand,
    "cVer": "2.0.5",
    "sys": "iOS",
    "rs": "2",
    "terminal": "GW_APP_GWM",
    "enterpriseId": GWM_CONFIG.enterpriseId,
    "Content-Type": "application/json",
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate, br"
  };
}

function formatValue(val) {
  if (!val || val === "--") return "--";
  return String(val);
}

function parseMileage(mileage) {
  if (!mileage) return "0";
  return mileage.replace(/[^0-9.]/g, "") || "0";
}

function formatTime(timestamp) {
  if (!timestamp) return "未知";
  const d = new Date(timestamp);
  return d.toLocaleString("zh-CN", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

// ========== API调用 ==========

// 获取车辆最新状态
async function getVehicleStatus() {
  const url = `${API_GATEWAY}/api/v3.0/vehicle/getLastStatus?vin=${GWM_CONFIG.vin}`;
  try {
    let req = new Request(url);
    req.headers = getHeaders();
    let data = await req.loadJSON();
    if (data && data.code === "000000") {
      return data.data;
    }
    console.error("API错误: " + (data ? data.description : "无响应"));
    return null;
  } catch (e) {
    console.error("请求失败: " + e);
    return null;
  }
}

// 获取车辆功能列表
async function getVehicleFunctions() {
  const url = `${API_GATEWAY}/api/v3.0/vehicle/function/item?userRole=1&vin=${GWM_CONFIG.vin}`;
  try {
    let req = new Request(url);
    req.headers = getHeaders();
    let data = await req.loadJSON();
    if (data && data.code === "000000") {
      return data.data;
    }
    return null;
  } catch (e) {
    console.error("获取功能列表失败: " + e);
    return null;
  }
}

// 远程控制 - 执行指令
async function sendRemoteCommand(cmdType, extraParams) {
  const url = `${API_GATEWAY}/api/v3.0/vehicle/remote-ctrl/subscribe/${GWM_CONFIG.vin}`;
  try {
    let req = new Request(url);
    req.method = "POST";
    req.headers = getHeaders();
    
    let body = {
      vin: GWM_CONFIG.vin,
      commandType: cmdType,
      userID: GWM_CONFIG.userId
    };
    if (extraParams) {
      Object.assign(body, extraParams);
    }
    req.bodyString = JSON.stringify(body);
    
    let data = await req.loadJSON();
    return data;
  } catch (e) {
    console.error("控制指令失败: " + e);
    return null;
  }
}

// 订阅远程控制状态
async function subscribeRemoteStatus(commandTypes) {
  const types = commandTypes || ["AIR_CONDITIONER", "SEAT_HEAT", "WHEEL_HEATING"];
  const params = types.map(t => `commandTypes[]=${t}`).join("&");
  const url = `${API_GATEWAY}/api/v3.0/vehicle/remote-ctrl/subscribe/${GWM_CONFIG.vin}?${params}&subscribeType=2&vin=${GWM_CONFIG.vin}`;
  try {
    let req = new Request(url);
    req.headers = getHeaders();
    let data = await req.loadJSON();
    return data;
  } catch (e) {
    console.error("订阅失败: " + e);
    return null;
  }
}

// ========== 缓存管理 ==========
// 使用Scriptable的FileManager缓存数据，减少API调用

const CACHE_KEY = "gwm_vehicle_status";
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

async function getCachedStatus() {
  try {
    const fm = FileManager.local();
    const cachePath = fm.joinPath(fm.cacheDirectory(), CACHE_KEY + ".json");
    if (fm.fileExists(cachePath)) {
      const cached = JSON.parse(fm.readString(cachePath));
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }
  } catch (e) {
    // 缓存读取失败，重新获取
  }
  return null;
}

async function setCachedStatus(data) {
  try {
    const fm = FileManager.local();
    const cachePath = fm.joinPath(fm.cacheDirectory(), CACHE_KEY + ".json");
    fm.writeString(cachePath, JSON.stringify({
      timestamp: Date.now(),
      data: data
    }));
  } catch (e) {
    // 缓存写入失败
  }
}

// ========== 小组件渲染 ==========

// 创建中等大小小组件（状态查看）
async function createMediumWidget() {
  const widget = new ListWidget();
  widget.setPadding(12, 12, 12, 12);
  widget.backgroundColor = Color.dynamic(
    new Color("#FFFFFF"), new Color("#1C1C1E")
  );
  
  // 尝试获取缓存数据，无缓存则实时请求
  let vehicleData = await getCachedStatus();
  if (!vehicleData) {
    const result = await getVehicleStatus();
    if (result) {
      vehicleData = result;
      await setCachedStatus(result);
    }
  }
  
  if (!vehicleData) {
    return createErrorWidget(widget, "获取车辆状态失败");
  }
  
  const status = vehicleData.vehicleStatusInfo || vehicleData;
  const updateTime = vehicleData.updateTime || vehicleData.acquisitionTime;
  
  // === 标题行 ===
  const headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.addSpacer();
  
  const brandText = headerStack.addText("长城汽车");
  brandText.font = Font.boldSystemFont(16);
  brandText.textColor = Color.dynamic(new Color("#333333"), new Color("#FFFFFF"));
  
  headerStack.addSpacer();
  
  widget.addSpacer(8);
  
  // === 电量和续航（大字显示） ===
  const mainStack = widget.addStack();
  mainStack.layoutHorizontally();
  mainStack.addSpacer();
  
  const batteryVal = parseMileage(status.powerBatteryDisplayVal || status.powerBatteryPercent || "0");
  const batteryNum = parseInt(batteryVal) || 0;
  
  const batteryText = mainStack.addText(batteryVal + "%");
  batteryText.font = Font.boldSystemFont(36);
  batteryText.textColor = getBatteryColor(batteryNum);
  
  mainStack.addSpacer();
  widget.addSpacer(4);
  
  // 电量图标条
  const barStack = widget.addStack();
  barStack.layoutHorizontally();
  barStack.addSpacer();
  barStack.size = new Size(200, 12);
  
  // 电量条背景
  const barBg = barStack.addStack();
  barBg.layoutHorizontally();
  barBg.backgroundColor = Color.dynamic(new Color("#E0E0E0"), new Color("#333333"));
  barBg.cornerRadius = 6;
  barBg.size = new Size(200, 12);
  
  // 电量条填充
  const barFill = barBg.addStack();
  const fillWidth = Math.max(4, Math.round(200 * batteryNum / 100));
  barFill.size = new Size(fillWidth, 12);
  barFill.backgroundColor = getBatteryColor(batteryNum);
  barFill.cornerRadius = 6;
  
  barStack.addSpacer();
  widget.addSpacer(10);
  
  // === 详细信息网格 ===
  const infoGrid = widget.addStack();
  infoGrid.layoutHorizontally();
  infoGrid.spacing = 8;
  
  // 左列
  const leftCol = infoGrid.addStack();
  leftCol.layoutVertically();
  leftCol.spacing = 4;
  
  addInfoRow(leftCol, "🔋", "续航", status.batteryPreMileage || "--");
  addInfoRow(leftCol, "🛣️", "里程", parseMileage(status.mileage) + "km");
  addInfoRow(leftCol, "🌡️", "车内", status.inCarTemperature || "--");
  
  // 右列
  const rightCol = infoGrid.addStack();
  rightCol.layoutVertically();
  rightCol.spacing = 4;
  
  const isLocked = status.door && status.door.mainDrveDoorLockSts === "0";
  addInfoRow(rightCol, isLocked ? "🔒" : "🔓", "车锁", isLocked ? "已锁" : "已解锁");
  
  const isCharging = status.charge && status.charge.chargingGunStatus !== 0;
  addInfoRow(rightCol, "⚡", "充电", isCharging ? "充电中" : "未充电");
  
  const acOn = status.airConditionSts === "1";
  addInfoRow(rightCol, "❄️", "空调", acOn ? "开启" : "关闭");
  
  widget.addSpacer(6);
  
  // === 底部更新时间 ===
  const footerStack = widget.addStack();
  footerStack.layoutHorizontally();
  
  const timeText = footerStack.addText("更新: " + formatTime(updateTime));
  timeText.font = Font.systemFont(9);
  timeText.textColor = Color.systemGray();
  
  footerStack.addSpacer();
  
  const tapHint = footerStack.addText("点击打开控制面板 ▸");
  tapHint.font = Font.systemFont(9);
  tapHint.textColor = Color.systemGray();
  
  // 点击打开控制面板脚本
  widget.url = "scriptable:///run/GWM%E8%BD%A6%E8%BE%86%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF";
  
  return widget;
}

// 创建大号小组件（状态+快捷控制）
async function createLargeWidget() {
  const widget = new ListWidget();
  widget.setPadding(12, 12, 12, 12);
  widget.backgroundColor = Color.dynamic(
    new Color("#FFFFFF"), new Color("#1C1C1E")
  );
  
  let vehicleData = await getCachedStatus();
  if (!vehicleData) {
    const result = await getVehicleStatus();
    if (result) {
      vehicleData = result;
      await setCachedStatus(result);
    }
  }
  
  if (!vehicleData) {
    return createErrorWidget(widget, "获取车辆状态失败");
  }
  
  const status = vehicleData.vehicleStatusInfo || vehicleData;
  const updateTime = vehicleData.updateTime || vehicleData.acquisitionTime;
  
  // === 标题行 ===
  const headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  
  const brandText = headerStack.addText("🚗 长城汽车");
  brandText.font = Font.boldSystemFont(18);
  brandText.textColor = Color.dynamic(new Color("#333333"), new Color("#FFFFFF"));
  
  headerStack.addSpacer();
  
  const vinText = headerStack.addText(GWM_CONFIG.vin.slice(-6));
  vinText.font = Font.systemFont(10);
  vinText.textColor = Color.systemGray();
  
  widget.addSpacer(10);
  
  // === 状态区 ===
  const statusArea = widget.addStack();
  statusArea.layoutHorizontally();
  
  // 左：电量大字
  const leftArea = statusArea.addStack();
  leftArea.layoutVertically();
  leftArea.addSpacer();
  
  const batteryVal = parseMileage(status.powerBatteryDisplayVal || status.powerBatteryPercent || "0");
  const batteryNum = parseInt(batteryVal) || 0;
  
  const batteryText = leftArea.addText(batteryVal + "%");
  batteryText.font = Font.boldSystemFont(40);
  batteryText.textColor = getBatteryColor(batteryNum);
  
  const rangeLabel = leftArea.addText("续航 " + (status.batteryPreMileage || "--"));
  rangeLabel.font = Font.systemFont(12);
  rangeLabel.textColor = Color.systemGray();
  
  leftArea.addSpacer();
  
  statusArea.addSpacer(12);
  
  // 右：详细信息
  const rightArea = statusArea.addStack();
  rightArea.layoutVertically();
  rightArea.spacing = 6;
  
  addInfoRow(rightArea, "🛣️", "里程", parseMileage(status.mileage) + "km");
  addInfoRow(rightArea, "🌡️", "车内", status.inCarTemperature || "--");
  addInfoRow(rightArea, "🪟", "车窗", getWindowStatus(status.windows));
  addInfoRow(rightArea, "💨", "胎压", getTirePressureSummary(status.tirePress));
  
  widget.addSpacer(10);
  
  // === 分隔线 ===
  const divider = widget.addStack();
  divider.backgroundColor = Color.dynamic(new Color("#E0E0E0"), new Color("#333333"));
  divider.size = new Size(0, 1);
  widget.addSpacer(8);
  
  // === 快捷控制区 ===
  const controlLabel = widget.addText("快捷控制");
  controlLabel.font = Font.boldSystemFont(12);
  controlLabel.textColor = Color.systemGray();
  widget.addSpacer(4);
  
  const ctrlGrid = widget.addStack();
  ctrlGrid.layoutHorizontally();
  ctrlGrid.spacing = 6;
  
  // 添加控制按钮
  addControlButton(ctrlGrid, "🔒", "锁车", "DOOR_LOCK");
  addControlButton(ctrlGrid, "🔓", "解锁", "DOOR_UNLOCK");
  addControlButton(ctrlGrid, "❄️", "空调", "AIR_CONDITIONER_START");
  addControlButton(ctrlGrid, "💡", "寻车", "FIND_CAR_FLASH_HORN");
  
  widget.addSpacer(6);
  
  // === 底部 ===
  const footerStack = widget.addStack();
  footerStack.layoutHorizontally();
  
  const timeText = footerStack.addText("更新: " + formatTime(updateTime));
  timeText.font = Font.systemFont(9);
  timeText.textColor = Color.systemGray();
  
  footerStack.addSpacer();
  
  const tapHint = footerStack.addText("更多控制 ▸");
  tapHint.font = Font.systemFont(9);
  tapHint.textColor = Color.systemGray();
  
  widget.url = "scriptable:///run/GWM%E8%BD%A6%E8%BE%86%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF";
  
  return widget;
}

// 创建错误提示小组件
function createErrorWidget(widget, message) {
  const errorText = widget.addText("❌ " + message);
  errorText.font = Font.systemFont(14);
  errorText.textColor = Color.systemRed();
  
  widget.addSpacer(4);
  
  const helpText = widget.addText("请在脚本中配置认证信息");
  helpText.font = Font.systemFont(11);
  helpText.textColor = Color.systemGray();
  
  widget.addSpacer(4);
  
  const detailText = widget.addText("需要: accessToken, vin, btAuthSign");
  detailText.font = Font.systemFont(10);
  detailText.textColor = Color.systemGray();
  
  return widget;
}

// 辅助：添加信息行
function addInfoRow(stack, icon, label, value) {
  const row = stack.addStack();
  row.layoutHorizontally();
  row.spacing = 2;
  
  const iconText = row.addText(icon);
  iconText.font = Font.systemFont(11);
  
  const labelText = row.addText(label + ":");
  labelText.font = Font.systemFont(11);
  labelText.textColor = Color.systemGray();
  
  const valueText = row.addText(String(value || "--"));
  valueText.font = Font.boldSystemFont(11);
  valueText.textColor = Color.dynamic(new Color("#333333"), new Color("#FFFFFF"));
}

// 辅助：添加控制按钮
function addControlButton(stack, icon, label, command) {
  const btn = stack.addStack();
  btn.layoutVertically();
  btn.size = new Size(50, 44);
  btn.backgroundColor = Color.dynamic(new Color("#F0F0F0"), new Color("#2C2C2E"));
  btn.cornerRadius = 8;
  btn.addSpacer(4);
  
  const iconText = btn.addText(icon);
  iconText.font = Font.systemFont(18);
  iconText.centerAlignText();
  
  const labelText = btn.addText(label);
  labelText.font = Font.systemFont(8);
  labelText.textColor = Color.systemGray();
  labelText.centerAlignText();
  
  // 点击执行控制命令（通过URL Scheme传递参数）
  btn.url = `scriptable:///run/GWM%E8%BD%A6%E8%BE%86%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF?cmd=${command}`;
}

// 辅助：获取电量颜色
function getBatteryColor(percent) {
  if (percent > 60) return Color.green();
  if (percent > 20) return Color.orange();
  return Color.red();
}

// 辅助：获取车窗状态
function getWindowStatus(windows) {
  if (!windows) return "--";
  const positions = [windows.lfWinPosnSts, windows.rfWinPosnSts, 
                     windows.lbWinPosnSts, windows.rbWinPosnSts];
  const allClosed = positions.every(p => p === "1" || p === "0");
  return allClosed ? "已关闭" : "有开窗";
}

// 辅助：获取胎压摘要
function getTirePressureSummary(tirePress) {
  if (!tirePress) return "--";
  const vals = [tirePress.lfTirePressVal, tirePress.rfTirePressVal,
                tirePress.lbTirePressVal, tirePress.rbTirePressVal];
  const valid = vals.filter(v => v && v !== "--");
  if (valid.length === 0) return "--";
  // 简单显示左前轮胎压
  return (tirePress.lfTirePressVal || "--").replace(/[^0-9.]/g, "") + "kPa";
}

// ========== 控制面板脚本 ==========
// 当直接运行此脚本时，显示交互式控制面板

async function showControlPanel() {
  const alert = new Alert();
  alert.title = "🚗 车辆控制面板";
  alert.message = `VIN: ${GWM_CONFIG.vin.slice(-6)}\n选择要执行的操作:`;
  
  // 添加常用控制按钮
  alert.addAction("❄️ 开启空调");
  alert.addAction("🌬️ 关闭空调");
  alert.addAction("🔒 锁车");
  alert.addAction("🔓 解锁");
  alert.addAction("💡 闪灯寻车");
  alert.addAction("📢 鸣笛寻车");
  alert.addAction("💺 座椅加热");
  alert.addAction("🔥 方向盘加热");
  alert.addAction("🔄 刷新状态");
  alert.addCancelAction("取消");
  
  const choice = await alert.present();
  
  if (choice === -1) return; // 取消
  
  const commandMap = [
    "AIR_CONDITIONER_START",
    "AIR_CONDITIONER_STOP", 
    "DOOR_LOCK",
    "DOOR_UNLOCK",
    "FIND_CAR_FLASH",
    "FIND_CAR_HORN",
    "SEAT_HEATING_START",
    "STEERING_WHEEL_HEATING",
    "REFRESH"
  ];
  
  const selectedCmd = commandMap[choice];
  
  if (selectedCmd === "REFRESH") {
    // 清除缓存并刷新
    try {
      const fm = FileManager.local();
      const cachePath = fm.joinPath(fm.cacheDirectory(), CACHE_KEY + ".json");
      if (fm.fileExists(cachePath)) {
        fm.remove(cachePath);
      }
    } catch (e) {}
    
    const status = await getVehicleStatus();
    if (status) {
      await setCachedStatus(status);
      const info = status.vehicleStatusInfo || status;
      const msg = [
        `🔋 电量: ${info.powerBatteryDisplayVal || "--"}`,
        `📍 续航: ${info.batteryPreMileage || "--"}`,
        `🛣️ 里程: ${info.mileage || "--"}`,
        `🌡️ 温度: ${info.inCarTemperature || "--"}`,
        `🔒 车锁: ${info.door && info.door.mainDrveDoorLockSts === "0" ? "已锁" : "未锁"}`,
        `❄️ 空调: ${info.airConditionSts === "1" ? "开启" : "关闭"}`,
      ].join("\n");
      
      const resultAlert = new Alert();
      resultAlert.title = "📊 车辆状态";
      resultAlert.message = msg;
      resultAlert.addDefaultAction("确定");
      await resultAlert.present();
    }
  } else {
    // 执行控制命令
    const loadingAlert = new Alert();
    loadingAlert.title = "⏳ 执行中";
    loadingAlert.message = `正在执行: ${COMMANDS[selectedCmd] ? COMMANDS[selectedCmd].name : selectedCmd}`;
    loadingAlert.addCancelAction("取消");
    
    const result = await sendRemoteCommand(selectedCmd);
    
    const resultAlert = new Alert();
    if (result && result.code === "000000") {
      resultAlert.title = "✅ 执行成功";
      resultAlert.message = `${COMMANDS[selectedCmd] ? COMMANDS[selectedCmd].name : selectedCmd} 指令已发送`;
    } else {
      resultAlert.title = "❌ 执行失败";
      resultAlert.message = result ? result.description : "网络错误，请检查配置";
    }
    resultAlert.addDefaultAction("确定");
    await resultAlert.present();
  }
}

// ========== 主函数 ==========

if (config.runsInWidget) {
  // 小组件模式 - 根据尺寸显示不同内容
  let widget;
  if (config.widgetFamily === "large") {
    widget = await createLargeWidget();
  } else {
    widget = await createMediumWidget();
  }
  Script.setWidget(widget);
  Script.complete();
} else {
  // 非小组件模式 - 显示控制面板
  // 检查是否有URL参数传入（从小组件点击）
  const args = process.argv;
  const cmdArg = args.find(a => a.startsWith("cmd="));
  
  if (cmdArg) {
    const cmd = cmdArg.replace("cmd=", "");
    const result = await sendRemoteCommand(cmd);
    
    const alert = new Alert();
    if (result && result.code === "000000") {
      alert.title = "✅ 指令已发送";
      alert.message = (COMMANDS[cmd] ? COMMANDS[cmd].name : cmd) + " 执行成功";
    } else {
      alert.title = "❌ 执行失败";
      alert.message = result ? result.description : "请检查认证配置";
    }
    alert.addDefaultAction("确定");
    await alert.present();
  } else {
    // 直接运行脚本，显示控制面板
    await showControlPanel();
  }
}

// ========== 使用说明 ==========
/*
╔══════════════════════════════════════════════════════════╗
║            长城汽车 Scriptable 小组件 使用说明            ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  【文件列表】                                             ║
║  1. GWM车辆状态小组件.js - 状态查看+快捷控制（本文件）     ║
║  2. GWM车辆控制面板.js   - 独立控制面板（需另外创建）      ║
║                                                          ║
║  【配置步骤】                                             ║
║  1. 使用抓包工具抓取长城汽车App的API请求                   ║
║  2. 找到任意 gw-app-gateway 请求                          ║
║  3. 复制以下认证信息到配置区域:                            ║
║     - vin: URL中的vin参数                                 ║
║     - accessToken: 请求头中的accessToken                  ║
║     - userId/beanId: 请求头中的beanId                     ║
║     - btAuthSign: 请求头中的bt-auth-sign                  ║
║     - btAuthTimestamp: 请求头中的bt-auth-timestamp         ║
║     - btAuthNonce: 请求头中的bt-auth-nonce                ║
║  4. 保存脚本，先在Scriptable中直接运行测试                 ║
║  5. 测试通过后添加iOS桌面小组件                            ║
║                                                          ║
║  【注意事项】                                             ║
║  - accessToken有效期约7天，过期需重新抓包获取              ║
║  - bt-auth-sign签名可能需要每次请求时重新计算              ║
║  - 如果签名验证失败，需要同时更新sign/timestamp/nonce      ║
║  - 建议使用5分钟缓存避免频繁请求                           ║
║                                                          ║
║  【API接口汇总】                                          ║
║  查看状态:                                                ║
║    GET /api/v3.0/vehicle/getLastStatus?vin={VIN}          ║
║    GET /api/v3.0/vehicle/function/item?vin={VIN}          ║
║                                                          ║
║  车辆控制:                                                ║
║    POST /api/v3.0/vehicle/remote-ctrl/config/query        ║
║    GET  /api/v3.0/vehicle/remote-ctrl/subscribe/{VIN}     ║
║                                                          ║
║  【控制指令】                                             ║
║  AIR_CONDITIONER_START  - 开启空调                        ║
║  AIR_CONDITIONER_STOP   - 关闭空调                        ║
║  DOOR_LOCK              - 锁车                            ║
║  DOOR_UNLOCK            - 解锁                            ║
║  WINDOW_CLOSE           - 关窗                            ║
║  FIND_CAR_FLASH         - 闪灯寻车                        ║
║  FIND_CAR_HORN          - 鸣笛寻车                        ║
║  SEAT_HEATING_START     - 座椅加热                        ║
║  STEERING_WHEEL_HEATING - 方向盘加热                      ║
║  DEFROST_FRONT_START    - 前除霜                          ║
║  DEFROST_BACK_START     - 后除霜                          ║
║  BACK_DOOR_OPEN         - 开后背门                        ║
║  BACK_DOOR_CLOSE        - 关后背门                        ║
║  CABIN_CLEAN_START      - 座舱清洁                        ║
║                                                          ║
║  【车辆状态数据结构】                                     ║
║  vehicleStatusInfo:                                       ║
║  ├── powerBatteryPercent  - 电池电量                      ║
║  ├── powerBatteryDisplayVal - 电量显示值                  ║
║  ├── batteryPreMileage    - 剩余续航里程                  ║
║  ├── mileage              - 总里程                        ║
║  ├── inCarTemperature     - 车内温度                      ║
║  ├── airConditionSts      - 空调状态 (0=关,1=开)          ║
║  ├── steerWheelHeatdSts   - 方向盘加热状态                ║
║  ├── door                                                  ║
║  │   ├── mainDrveDoorLockSts - 主驾车锁状态               ║
║  │   ├── mainDrveDoorSts     - 主驾门状态                 ║
║  │   ├── viceDoorSts         - 副驾门状态                 ║
║  │   ├── lbDoorSts           - 左后门状态                 ║
║  │   ├── rbDoorSts           - 右后门状态                 ║
║  │   ├── backDoorSts         - 后门状态                   ║
║  │   └── tailgateOpenUpSts   - 尾门状态                   ║
║  ├── windows                                               ║
║  │   ├── lfWinPosnSts   - 左前窗位置状态                  ║
║  │   ├── rfWinPosnSts   - 右前窗位置状态                  ║
║  │   ├── lbWinPosnSts   - 左后窗位置状态                  ║
║  │   ├── rbWinPosnSts   - 右后窗位置状态                  ║
║  │   └── skyLightSts    - 天窗状态                        ║
║  ├── tirePress                                             ║
║  │   ├── lfTirePressVal - 左前轮胎压                      ║
║  │   ├── rfTirePressVal - 右前轮胎压                      ║
║  │   ├── lbTirePressVal - 左后轮胎压                      ║
║  │   └── rbTirePressVal - 右后轮胎压                      ║
║  ├── tireTemp                                              ║
║  │   ├── lfTireTempVal  - 左前轮胎温                      ║
║  │   ├── rfTireTempVal  - 右前轮胎温                      ║
║  │   ├── lbTireTempVal  - 左后轮胎温                      ║
║  │   └── rbTireTempVal  - 右后轮胎温                      ║
║  ├── seat                                                  ║
║  │   ├── mainDriverSeatHeatSts - 主驾加热状态             ║
║  │   ├── mainDriverSeatVentSts - 主驾通风状态             ║
║  │   ├── viceSeatHeatSts       - 副驾加热状态             ║
║  │   ├── viceSeatVentSts       - 副驾通风状态             ║
║  │   ├── lbSeatHeatSts         - 左后加热状态             ║
║  │   └── rbSeatHeatSts         - 右后加热状态             ║
║  ├── charge                                                ║
║  │   ├── chargeSoc           - 充电SOC                    ║
║  │   └── chargingGunStatus   - 充电枪状态                 ║
║  ├── healthDegree         - 健康度                        ║
║  ├── wirelessLevel        - 无线信号等级                   ║
║  ├── longitude / latitude - 经纬度位置                    ║
║  └── battPackVolt         - 电池包电压                    ║
║                                                          ║
╚══════════════════════════