/**
 * Scriptable 小组件 - 点击运行 checkin 脚本
 * 
 * 使用方法：
 * 1. 将此脚本放入 Scriptable 的脚本目录
 * 2. 在 iOS 桌面添加 Scriptable 小组件
 * 3. 选择此脚本作为小组件内容
 * 4. 点击小组件即可运行 checkin 脚本
 */

// ========== 配置区域 ==========
const TARGET_SCRIPT = "checkin"
const WIDGET_IMAGE_URL = "https://alquantumult.pages.dev/alalalex-m/AlQuantumult/main/Pics/IMG_3542.jpeg?token=TTOAX"
const LAST_CHECKIN_KEY = "lastCheckinTime"

// ========== 颜色方案 ==========
const COLORS = {
  primary: "#00f5ff",      // 青色/氰蓝
  accent: "#00ff9d",       // 绿色辅助色
  text: "#ffffff",         // 白色文字
  overlayOpacity: 0.6      // 深色遮罩透明度
}

// ========== 运行目标脚本 ==========
function findScriptPath(scriptName) {
  const fmLocal = FileManager.local()
  const fmCloud = FileManager.iCloud()

  const localDir = typeof fmLocal.documentsDirectory === "function" 
    ? fmLocal.documentsDirectory() 
    : fmLocal.documentsDirectory
  const cloudDir = typeof fmCloud.documentsDirectory === "function" 
    ? fmCloud.documentsDirectory() 
    : fmCloud.documentsDirectory

  const tries = [
    fmLocal.joinPath ? fmLocal.joinPath(localDir, scriptName + ".js") : localDir + "/" + scriptName + ".js",
    fmCloud.joinPath ? fmCloud.joinPath(cloudDir, scriptName + ".js") : cloudDir + "/" + scriptName + ".js",
    localDir + "/" + scriptName + ".js",
    cloudDir + "/" + scriptName + ".js"
  ]

  for (const path of tries) {
    try {
      if (fmLocal.fileExists(path)) {
        return { path: path, fm: fmLocal }
      }
    } catch (e) {}
  }
  return null
}

async function runTargetScript(scriptName) {
  const result = findScriptPath(scriptName)

  if (!result) {
    throw new Error("找不到脚本: " + scriptName + ".js")
  }

  try {
    const code = result.fm.readString(result.path)
    if (!code) {
      throw new Error("脚本内容为空: " + result.path)
    }

    console.log("开始执行脚本: " + scriptName)
    
    try {
      const asyncScript = new Function("return (async () => {\n" + code + "\n})()")
      const evalResult = await asyncScript()
      console.log("脚本 " + scriptName + " 执行完成")
    } catch (e) {
      console.log("包装执行失败，尝试直接 eval: " + e)
      const evalResult = eval(code)
      if (evalResult && typeof evalResult.then === "function") {
        await evalResult
      }
      console.log("脚本 " + scriptName + " 执行完成")
    }

    saveLastCheckinTime()
  } catch (e) {
    console.log("读取或执行脚本失败: " + e)
    throw e
  }
}

// 保存打卡时间
function saveLastCheckinTime() {
  try {
    const now = new Date().toISOString()
    Keychain.set(LAST_CHECKIN_KEY, now)
  } catch (e) {
    console.log("保存打卡时间失败: " + e)
  }
}

// 获取上次打卡时间
function getLastCheckinTime() {
  try {
    const timeStr = Keychain.get(LAST_CHECKIN_KEY)
    if (timeStr) {
      const date = new Date(timeStr)
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      })
    }
  } catch (e) {
    console.log("读取打卡时间失败: " + e)
  }
  return null
}

// ========== 小组件入口 ==========
const widget = await createWidget()

if (config.runsInWidget) {
  widget.url = "scriptable:///run?scriptName=" + encodeURIComponent(Script.name())
  Script.setWidget(widget)
} else {
  try {
    await runTargetScript(TARGET_SCRIPT)
  } catch (e) {
    console.log("执行失败: " + String(e))
  }
}

Script.complete()

// ========== 创建小组件 ==========
async function createWidget() {
  const widget = new ListWidget()

  // 设置图片为背景
  let backgroundImage = null
  try {
    const req = new Request(WIDGET_IMAGE_URL)
    backgroundImage = await req.loadImage()
    widget.backgroundImage = backgroundImage
  } catch (e) {
    console.log("加载图片失败: " + e)
  }

  // 添加渐变遮罩
  widget.setPadding(4, 4, 4, 4)
  
  // 添加顶部内容区域
  const mainStack = widget.addStack()
  mainStack.layoutVertically()

  // ========== 顶部区域 ==========
  const topStack = mainStack.addStack()
  topStack.setPadding(2, 6, 0, 6)
  
  // 左侧：Logo 文字
  const logoText = topStack.addText("⚡ AlQuantumult")
  logoText.font = Font.boldSystemFont(12)
  logoText.textColor = new Color(COLORS.primary)
  logoText.shadowColor = Color.black()
  logoText.shadowOffset = new Point(0, 0)
  logoText.shadowRadius = 3
  
  // 右侧：留空
  topStack.addSpacer()

  // ========== 中间区域 ==========
  widget.addSpacer(6)
  
  // 中心图片显示（如果有背景图片）
  if (backgroundImage) {
    const centerStack = widget.addStack()
    centerStack.centerAlignContent()
    centerStack.addSpacer()
    
    // 创建一个略微缩小的图片
    const centerImage = centerStack.addImage(backgroundImage)
    centerImage.imageSize = new Size(90, 90)
    centerImage.cornerRadius = 22
    centerImage.containerRelativeSize = false
    
    centerStack.addSpacer()
  }
  
  widget.addSpacer(4)

  // ========== 底部区域 ==========
  const bottomStack = widget.addStack()
  bottomStack.layoutVertically()
  bottomStack.setPadding(6, 12, 8, 12)
  bottomStack.bottomAlignContent()

  // "LAST RUN" 标签
  const labelStack = bottomStack.addStack()
  labelStack.centerAlignContent()
  
  const labelText = labelStack.addText("⚡ LAST RUN")
  labelText.font = Font.systemFont(10)
  labelText.textColor = new Color(COLORS.primary)
  labelText.shadowColor = Color.black()
  labelText.shadowOffset = new Point(0, 0)
  labelText.shadowRadius = 2

  // 打卡时间显示
  const timeStack = bottomStack.addStack()
  timeStack.centerAlignContent()
  
  const lastCheckin = getLastCheckinTime()
  const displayTime = lastCheckin || "未打卡"
  
  const timeText = timeStack.addText(displayTime)
  timeText.font = Font.monospacedSystemFont(16, "bold")
  timeText.textColor = new Color(COLORS.text)
  timeText.shadowColor = Color.black()
  timeText.shadowOffset = new Point(0, 1)
  timeText.shadowRadius = 3

  // 提示文字
  if (!lastCheckin) {
    widget.addSpacer(2)
    const hintStack = widget.addStack()
    hintStack.centerAlignContent()
    
    const hintText = hintStack.addText("TAP TO CHECK-IN")
    hintText.font = Font.systemFont(10)
    hintText.textColor = new Color(COLORS.accent)
    hintText.shadowColor = Color.black()
    hintText.shadowOffset = new Point(0, 0)
    hintText.shadowRadius = 2
  }

  // 添加深色渐变遮罩
  widget.setPadding(0, 0, 0, 0)
  
  return widget
}