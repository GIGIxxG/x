// 长城汽车 iOS 桌面小组件 - 2025版
// 参考特斯拉 Tesla App 小组件设计
// 使用方法：在 Scriptable 中创建新脚本，粘贴此代码

// ========== ========== ========== ========== ==========
// 第1部分：配置与常量定义
// ========== ========== ========== ========== ==========

// 从抓包中提取的认证信息（需要替换成你自己的）
const GWM_CONFIG = {
  vin: "LGWEFUK69NK408870",           // 车辆识别码
  accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJnd21CcmFuZCI6IkNDRzAwMSIsImd3SWQiOiIzNTUxNDM0MTIyNjc5NjMxODcyIiwiaWF0IjoxNzczMDc4NDU0LCJiZWFuSWQiOiIzNTUxNDM0MTIyNjc5NjMxODcyIiwiZXhwIjoxNzc3NDg2NTQwLCJrZXkiOiJiZWFuX2FwcF91c2VyX2tleSIsImp3dFR5cGUiOjAsImp3c1R5cGUiOjAsImd3bVN0IjoiMiIsInN1bklkIjoiVTE0ODI2NzQ3NDM1NjkwNzUyIiwicm9sZUNvZGUiOiJhZG1pbiIsImNoYW5uZWwiOiI3QTlCODUzRjA0RkQxLTQzMzQtQjJDNS0zODUyNTFEMUMzRVciLCJpc3MiOiJnd20yU2VydmVyIn0.An5htRRLZlm19dqzj8L2u0Hq_sPxf1AfU83q47ULsGuvJewAyrOZwn18bJVcBDPWqtF4YMmXCNtFaiKHL6ggWU9XceKudpuFKQty_E19p2hd7Tc2KNc5F-FDBP7OacuZTNGSx52F_RvOL1e-Ixjaoa0T6n6NBc8ETLPHgJL2yRRjplYMdWz63uhOjGkCOCqViDZT99BLvLkdpeDubfLYEBmCVRFIWqRIcnYUFjT3YgCxDOE63KMbdrPPb9KjVyJavJjPzFWJRtSc1FHv5ROItk4647CektrRgE0yvyHI6Un8-7s_3srAPGxpx14n0TVmtgOfsCeK5Q-TjHbgauMGgej4BILnjWI",
  userId: "3551434122679631872",       // 用户ID (beanId)
  brand: "10",                         // 品牌代码
  enterpriseId: "CC01",                // 企业ID
  appId: "12345678",                   // 应用ID
  btAuthAppkey: "7863128529",          // 认证密钥
  btAuthSign: "3bdc313d3a5d653cf0b00753fd26bb079d6cb43864159151766a6ccab0b310d1",
  btAuthTimestamp: "1777366348468",     // 时间戳
  btAuthNonce: "h1onireqpcngb6q0"      // 随机数
};

// API网关地址
const API_GATEWAY = "https://gw-app-gateway.gwmapp-h.com/app-api";

// ========== ========== ========== ========== ==========
// 第2部分：样式规范（符合设计文档）
// ========== ========== ========== ========== ==========

// 颜色方案
const COLORS = {
  // 背景
  background: '#1C1C1E',          // 深色背景
  backgroundLight: '#2C2C2E',     // 浅色背景（按钮）
  
  // 文字
  textPrimary: '#FFFFFF',         // 主文字
  textSecondary: '#8E8E93',       // 次级文字
  
  // 状态色
  batteryHigh: '#34C759',         // 高电量绿色
  batteryMed: '#FF9500',          // 中电量橙色
  batteryLow: '#FF3B30',          // 低电量红色
  accent: '#0A84FF',              // 强调色
  
  // 边框
  border: '#38383A',              // 边框/分隔线
};

// 缓存配置
const CACHE_CONFIG = {
  statusCacheDuration: 5 * 60 * 1000,    // 5分钟缓存
  imageCacheDuration: 60 * 60 * 1000,   // 1小时图片缓存
};

// ========== ========== ========== ========== ==========
// 第3部分：工具函数
// ========== ========== ========== ========== ==========

// 生成随机nonce
function generateNonce() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let i = 0; i < 16; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

// 获取请求头
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

// 格式化数值
function parseMileage(mileage) {
  if (!mileage) return "0";
  return mileage.replace(/[^0-9.]/g, "") || "0";
}

// 格式化时间显示为"X min ago"
function formatTimeAgo(timestamp) {
  if (!timestamp) return "刚刚";
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return minutes + " min ago";
  if (minutes < 1440) return Math.floor(minutes / 60) + " hr ago";
  return Math.floor(minutes / 1440) + " day ago";
}

// 获取电量颜色
function getBatteryColor(percent) {
  if (percent > 60) return new Color(COLORS.batteryHigh);
  if (percent > 20) return new Color(COLORS.batteryMed);
  return new Color(COLORS.batteryLow);
}

// 获取字号
function getBoldFont(size) {
  return Font.boldSystemFont(size);
}

function getRegularFont(size) {
  return Font.systemFont(size);
}

// 获取动态颜色（适配深浅色模式）
function dynamic(lightColor, darkColor) {
  return Color.dynamic(
    new Color(lightColor),
    new Color(darkColor)
  );
}

// ========== ========== ========== ========== ==========
// 第4部分：API调用
// ========== ========== ========== ========== ==========

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

// 发送远程控制指令
async function sendRemoteCommand(cmdType) {
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
    req.bodyString = JSON.stringify(body);
    
    let data = await req.loadJSON();
    return data;
  } catch (e) {
    console.error("控制指令失败: " + e);
    return null;
  }
}

// ========== ========== ========== ========== ==========
// 第5部分：缓存管理
// ========== ========== ========== ========== ==========

const CACHE_KEY = "gwm_vehicle_status";

async function getCachedStatus() {
  try {
    const fm = FileManager.local();
    const cachePath = fm.joinPath(fm.cacheDirectory(), CACHE_KEY + ".json");
    if (fm.fileExists(cachePath)) {
      const cached = JSON.parse(fm.readString(cachePath));
      if (Date.now() - cached.timestamp < CACHE_CONFIG.statusCacheDuration) {
        return cached.data;
      }
    }
  } catch (e) {
    // 缓存读取失败
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

// ========== ========== ========== ========== ==========
// 第6部分：小组件渲染 - 中等尺寸
// ========== ========== ========== ========== ==========

// 创建中等尺寸小组件 (2x2)
// 布局：顶部栏 + 电量续航区 + 状态栏 + 控制按钮栏
async function createMediumWidget() {
  const widget = new ListWidget();
  widget.setPadding(12, 12, 12, 12);
  widget.backgroundColor = new Color(COLORS.background);
  
  // 获取车辆数据
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
  
  // ===== 顶部栏 (Header) =====
  // 布局：行驶里程: XXXXXX        [车辆图标]
  const headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.size = new Size(0, 40);
  
  // 左侧：行驶里程
  const mileageLeft = headerStack.addStack();
  mileageLeft.layoutVertically();
  mileageLeft.addSpacer();
  
  const mileageLabel = mileageLeft.addText("行驶里程:");
  mileageLabel.font = getRegularFont(12);
  mileageLabel.textColor = dynamic('#8E8E93', '#8E8E93');
  
  mileageLeft.addSpacer(2);
  
  const mileageValue = mileageLeft.addText(parseMileage(status.mileage) + " km");
  mileageValue.font = getBoldFont(16);
  mileageValue.textColor = dynamic('#FFFFFF', '#FFFFFF');
  
  mileageLeft.addSpacer();
  
  // 右侧：车辆图标
  headerStack.addSpacer();
  const carIconStack = headerStack.addStack();
  carIconStack.size = new Size(60, 40);
  carIconStack.cornerRadius = 8;
  carIconStack.backgroundColor = dynamic('#F0F0F0', '#2C2C2E');
  
  const carIcon = carIconStack.addText("🚗");
  carIcon.font = Font.systemFont(24);
  carIcon.centerAlignText();
  
  widget.addSpacer(8);
  
  // ===== 电量续航区 (Battery & Range) =====
  // 布局：[██████░░░░]  140 mi
  const batteryStack = widget.addStack();
  batteryStack.layoutHorizontally();
  batteryStack.size = new Size(0, 32);
  
  // 电量百分比
  const batteryVal = parseMileage(status.powerBatteryDisplayVal || status.powerBatteryPercent || "0");
  const batteryNum = parseInt(batteryVal) || 0;
  
  // 电量条背景
  const barWidth = 180;
  const barHeight = 8;
  const barBg = batteryStack.addStack();
  barBg.size = new Size(barWidth, barHeight);
  barBg.cornerRadius = 4;
  barBg.backgroundColor = dynamic('#333333', '#333333');
  
  // 电量条填充
  const fillWidth = Math.max(4, Math.round(barWidth * batteryNum / 100));
  const barFill = barBg.addStack();
  barFill.size = new Size(fillWidth, barHeight);
  barFill.cornerRadius = 4;
  barFill.backgroundColor = getBatteryColor(batteryNum);
  
  batteryStack.addSpacer(8);
  
  // 续航里程
  const rangeText = batteryStack.addText(status.batteryPreMileage || "--");
  rangeText.font = getRegularFont(18);
  rangeText.textColor = dynamic('#FFFFFF', '#FFFFFF');
  
  widget.addSpacer(8);
  
  // ===== 状态栏 (Status Bar) =====
  // 布局：📍 位置信息        1 min ago
  const statusBar = widget.addStack();
  statusBar.layoutHorizontally();
  
  // 位置图标和文字
  const locationText = statusBar.addText("📍 停车中");
  locationText.font = getRegularFont(12);
  locationText.textColor = dynamic('#8E8E93', '#8E8E93');
  
  statusBar.addSpacer();
  
  // 更新时间
  const timeText = statusBar.addText(formatTimeAgo(updateTime));
  timeText.font = getRegularFont(12);
  timeText.textColor = dynamic('#8E8E93', '#8E8E93');
  
  widget.addSpacer(6);
  
  // ===== 控制按钮栏 (Control Bar) =====
  // 布局：[🔒]  [🌬️]  [⚡]  [🚙]
  const controlBar = widget.addStack();
  controlBar.layoutHorizontally();
  controlBar.spacing = 6;
  
  // 根据当前状态决定按钮显示
  const isLocked = status.door && status.door.mainDrveDoorLockSts === "0";
  const acStatus = status.airConditionSts === "1";
  
  addControlButton(controlBar, isLocked ? "🔒" : "🔓", isLocked ? "已锁" : "未锁", "LOCK");
  addControlButton(controlBar, acStatus ? "❄️" : "🌬️", acStatus ? "空调开" : "空调关", "AC");
  addControlButton(controlBar, "⚡", "充电", "CHARGE");
  addControlButton(controlBar, "🚙", "后背门", "TRUNK");
  
  widget.addSpacer(4);
  
  // 电量条可点击刷新
  barBg.url = "scriptable:///run/GWM%E8%BD%A6%E8%BE%86%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF?refresh=true";
  barFill.url = "scriptable:///run/GWM%E8%BD%A6%E8%BE%86%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF?refresh=true";
  
  // 整个小组件点击打开控制面板
  widget.url = "scriptable:///run/GWM%E8%BD%A6%E8%BE%86%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF";
  
  return widget;
}

// 添加控制按钮（中等尺寸 - 小按钮）
function addControlButton(stack, icon, label, type) {
  const btn = stack.addStack();
  btn.layoutVertically();
  btn.size = new Size(60, 50);
  btn.backgroundColor = dynamic('#F0F0F0', COLORS.backgroundLight);
  btn.cornerRadius = 8;
  
  btn.addSpacer(4);
  
  const iconText = btn.addText(icon);
  iconText.font = Font.systemFont(20);
  iconText.centerAlignText();
  
  const labelText = btn.addText(label);
  labelText.font = Font.systemFont(10);
  labelText.textColor = dynamic('#8E8E93', '#8E8E93');
  labelText.centerAlignText();
  
  btn.addSpacer(2);
  
  // 点击执行控制命令
  btn.url = `scriptable:///run/GWM%E8%BD%A6%E8%BE%86%E6%8E%A7%E5%88%B6%E9%9D%A2%E6%9D%BF?cmd=${type}`;
}

// ========== ========== ========== ========== ==========
// 第7部分：小组件渲染 - 大号尺寸
// ========== ========== ========== ========== ==========

// 创建大号小组件 (2x3)
// 在中等尺寸基础上增加更多信息和控制
async function createLargeWidget() {
  const widget = new ListWidget();
  widget.setPadding(12, 12, 12, 12);
  widget.backgroundColor = new Color(COLORS.background);
  
  // 获取车辆数据
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
  
  // ===== 顶部栏 (Header) =====
  const headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.size = new Size(0, 40);
  
  const mileageLeft = headerStack.addStack();
  mileageLeft.layoutVertically();
  mileageLeft.addSpacer();
  
  const mileageLabel = mileageLeft.addText("行驶里程:");
  mileageLabel.font = getRegularFont(12);
  mileageLabel.textColor = dynamic('#8E8E93', '#8E8E93');
  
  mileageLeft.addSpacer(2);
  
  const mileageValue = mileageLeft.addText(parseMileage(status.mileage) + " km");
  mileageValue.font = getBoldFont(16);
  mileageValue.textColor = dynamic('#FFFFFF', '#FFFFFF');
  
  mileageLeft.addSpacer();
  
  headerStack.addSpacer();
  const carIconStack = headerStack.addStack();
  carIconStack.size = new Size(60, 40);
  carIconStack.cornerRadius = 8;
  carIconStack.backgroundColor = dynamic('#F0F0F0', '#2C2C2E');
  
  const carIcon = carIconStack.addText("🚗");
  carIcon.font = Font.systemFont(24);
  carIcon.centerAlignText();
  
  widget.addSpacer(8);
  
  // ===== 电量续航区 =====
  const batteryStack = widget.addStack();
  batteryStack.layoutHorizontally();
  
  // 左侧：电量大字
  const batteryVal = parseMileage(status.powerBatteryDisplayVal || status.powerBatteryPercent || "0");
  const batteryNum = parseInt(batteryVal) || 0;
  
  const batteryLeft = batteryStack.addStack();
  batteryLeft.layoutVertically();
  batteryLeft.addSpacer();
  
  const batteryBigText = batteryLeft.addText(batteryVal + "%");
  batteryBigText.font = getBoldFont(32);
  batteryBigText.textColor = getBatteryColor(batteryNum);
  
  const rangeSmallText = batteryLeft.addText(status.batteryPreMileage || "--");
  rangeSmallText.font = getRegularFont(12);
  rangeSmallText.textColor = dynamic('#8E8E93', '#8E8E93');
  
  batteryLeft.addSpacer();
  
  batteryStack.addSpacer(12);
  
  // 右侧：详细信息
  const batteryRight = batteryStack.addStack();
  batteryRight.layoutVertically();
  batteryRight.spacing = 6;
  
  addInfoRow(batteryRight, "🛣️", "里程", parseMileage(status.mileage) + "km");
  addInfoRow(batteryRight, "🌡️", "车内", status.inCarTemperature || "--");
  addInfoRow(batteryRight, "🪟", "车窗", getWindowStatus(status.windows));
  addInfoRow(batteryRight, "💨", "胎压", getTirePressureSummary(status.tirePress));
  
  widget.addSpacer(8);
  
  // ===== 分隔线 =====
  const divider = widget.addStack();
  divider.backgroundColor = dynamic(COLORS.border, COLORS.border);
  divider.size = new Size(0, 1);
  widget.addSpacer(8);
  
  // ===== 状态栏 =====
  const statusBar = widget.addStack();
  statusBar.layoutHorizontally();
  
  const locationText = statusBar.addText("📍 停车中");
  locationText.font = getRegularFont(12);
  locationText.textColor = dynamic('#8E8E93', '#8E8E93');
  
  statusBar.addSpacer();
  
  const timeText = statusBar.addText(formatTimeAgo(updateTime));
  timeText.font = getRegularFont(12);
  timeText.textColor = dynamic('#8E8E93', '#8E8E93');
  
  widget.addSpacer(8);
  
  // ===== 扩展控制按钮区 =====
  // 第一行
  const controlRow1 = widget.addStack();
  controlRow1.layoutHorizontally();
  controlRow1.spacing = 6;
  
  const isLocked = status.door && status.door.mainDrveDoorLockSts === "0";
  const acStatus = status.airConditionSts === "1";
  
  addControlButton(controlRow1, isLocked ? "🔒" : "🔓", isLocked ? "已锁" : "未锁", "LOCK");
  addControlButton(controlRow1, acStatus ? "❄️" : "🌬️", acStatus ? "空调开" : "空调关", "AC");
  addControlButton(controlRow1, "⚡", "充电", "CHARGE");
  addControlButton(controlRow1, "🚙", "后背门", "TRUNK");
  
  widget.addSpacer(6);
  
  // 第二行
  const controlRow2 = widget.addStack();
  controlRow2.layoutHorizontally();
  controlRow2.spacing = 6;
  
  addControlButton(controlRow2, "💺", "座椅加热", "SEAT");
  addControlButton(controlRow2, "🔥", "方向盘", "WHEEL");
  addControlButton(controlRow2, "🌫️", "前除霜", "DEFROST_F");
  addControlButton(controlRow2, "🧹", "座舱清洁", "CLEAN");
  
  widget.addSpacer(4);
  
  return widget;
}

// 添加信息行
function addInfoRow(stack, icon, label, value) {
  const row = stack.addStack();
  row.layoutHorizontally();
  row.spacing = 2;
  
  const iconText = row.addText(icon);
  iconText.font = Font.systemFont(11);
  
  const labelText = row.addText(label + ":");
  labelText.font = Font.systemFont(11);
  labelText.textColor = dynamic('#8E8E93', '#8E8E93');
  
  const valueText = row.addText(String(value || "--"));
  valueText.font = getBoldFont(11);
  valueText.textColor = dynamic('#FFFFFF', '#FFFFFF');
}

// 获取车窗状态
function getWindowStatus(windows) {
  if (!windows) return "--";
  const positions = [windows.lfWinPosnSts, windows.rfWinPosnSts, 
                     windows.lbWinPosnSts, windows.rbWinPosnSts];
  const allClosed = positions.every(p => p === "1" || p === "0");
  return allClosed ? "已关闭" : "有开窗";
}

// 获取胎压摘要
function getTirePressureSummary(tirePress) {
  if (!tirePress) return "--";
  const vals = [tirePress.lfTirePressVal, tirePress.rfTirePressVal,
                tirePress.lbTirePressVal, tirePress.rbTirePressVal];
  const valid = vals.filter(v => v && v !== "--");
  if (valid.length === 0) return "--";
  return (tirePress.lfTirePressVal || "--").replace(/[^0-9.]/g, "") + "kPa";
}

// ========== ========== ========== ========== ==========
// 第8部分：错误处理小组件
// ========== ========== ========== ========== ==========

// 创建错误提示小组件
function createErrorWidget(widget, message) {
  const errorText = widget.addText("❌ " + message);
  errorText.font = getRegularFont(14);
  errorText.textColor = Color.red();
  
  widget.addSpacer(4);
  
  const helpText = widget.addText("请在脚本中配置认证信息");
  helpText.font = getRegularFont(11);
  helpText.textColor = dynamic('#8E8E93', '#8E8E93');
  
  widget.addSpacer(4);
  
  const detailText = widget.addText("需要: accessToken, vin, btAuthSign");
  detailText.font = getRegularFont(10);
  detailText.textColor = dynamic('#8E8E93', '#8E8E93');
  
  return widget;
}

// ========== ========== ========== ========== ==========
// 第9部分：控制面板（直接运行脚本时显示）
// ========== ========== ========== ========== ==========

async function showControlPanel() {
  const alert = new Alert();
  alert.title = "🚗 长城汽车控制面板";
  alert.message = `VIN: ${GWM_CONFIG.vin.slice(-6)}\n选择要执行的操作:`;
  
  // 添加控制选项
  alert.addAction("❄️ 开启空调");
  alert.addAction("🌬️ 关闭空调");
  alert.addAction("🔒 锁车");
  alert.addAction("🔓 解锁");
  alert.addAction("⚡ 充电控制");
  alert.addAction("🚙 开后背门");
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
    "CHARGE",
    "BACK_DOOR_OPEN",
    "SEAT_HEATING_START",
    "STEERING_WHEEL_HEATING",
    "REFRESH"
  ];
  
  const selectedCmd = commandMap[choice];
  
  if (selectedCmd === "REFRESH") {
    // 刷新状态
    await refreshAndShowStatus();
  } else {
    // 执行控制命令
    await executeCommand(selectedCmd);
  }
}

// 刷新并显示状态
async function refreshAndShowStatus() {
  // 清除缓存
  try {
    const fm = FileManager.local();
    const cachePath = fm.joinPath(fm.cacheDirectory(), CACHE_KEY + ".json");
    if (fm.fileExists(cachePath)) {
      fm.remove(cachePath);
    }
  } catch (e) {}
  
  // 获取新状态
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
  } else {
    const errorAlert = new Alert();
    errorAlert.title = "❌ 刷新失败";
    errorAlert.message = "无法获取车辆状态，请检查网络配置";
    errorAlert.addDefaultAction("确定");
    await errorAlert.present();
  }
}

// 执行控制命令
async function executeCommand(cmdType) {
  const COMMANDS = {
    AIR_CONDITIONER_START: { name: "开启空调" },
    AIR_CONDITIONER_STOP: { name: "关闭空调" },
    DOOR_LOCK: { name: "锁车" },
    DOOR_UNLOCK: { name: "解锁" },
    CHARGE: { name: "充电控制" },
    BACK_DOOR_OPEN: { name: "开后背门" },
    SEAT_HEATING_START: { name: "座椅加热" },
    STEERING_WHEEL_HEATING: { name: "方向盘加热" },
  };
  
  const result = await sendRemoteCommand(cmdType);
  
  const resultAlert = new Alert();
  if (result && result.code === "000000") {
    resultAlert.title = "✅ 执行成功";
    resultAlert.message = `${COMMANDS[cmdType] ? COMMANDS[cmdType].name : cmdType} 指令已发送`;
  } else {
    resultAlert.title = "❌ 执行失败";
    resultAlert.message = result ? result.description : "网络错误，请检查配置";
  }
  resultAlert.addDefaultAction("确定");
  await resultAlert.present();
}

// ========== ========== ========== ========== ==========
// 第10部分：主入口
// ========== ========== ========== ========== ==========

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
  await showControlPanel();
}