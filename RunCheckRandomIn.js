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
const WIDGET_TITLE = "随机签到"
const WIDGET_ICON = "🎲"
const WIDGET_SUBTITLE = "点击运行签到"
const BG_COLOR_DARK = "#1a1a2e"
const BG_COLOR_LIGHT = "#f0f0f5"
const ACCENT_COLOR = "#e94560"
const TEXT_COLOR_DARK = "#ffffff"
const TEXT_COLOR_LIGHT = "#16213e"
const LAST_CHECKIN_KEY = "lastCheckinTime"

// ========== 运行目标脚本 ==========
function findScriptPath(scriptName) {
  const fmLocal = FileManager.local()
  const fmCloud = FileManager.iCloud()

  // 获取文档目录（可能是函数也可能是属性）
  const localDir = typeof fmLocal.documentsDirectory === "function" 
    ? fmLocal.documentsDirectory() 
    : fmLocal.documentsDirectory
  const cloudDir = typeof fmCloud.documentsDirectory === "function" 
    ? fmCloud.documentsDirectory() 
    : fmCloud.documentsDirectory

  // 尝试不同的路径拼接方式
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
    
    // 用 new Function 包装执行，避免 eval 的作用域问题
    try {
      const asyncScript = new Function("return (async () => {\n" + code + "\n})()")
      const evalResult = await asyncScript()
      console.log("脚本 " + scriptName + " 执行完成")
    } catch (e) {
      // 如果包装后失败，尝试直接 eval
      console.log("包装执行失败，尝试直接 eval: " + e)
      const evalResult = eval(code)
      if (evalResult && typeof evalResult.then === "function") {
        await evalResult
      }
      console.log("脚本 " + scriptName + " 执行完成")
    }

    // 记录打卡时间
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
  const isDark = Device.isUsingDarkAppearance()
  const bgColor = isDark ? BG_COLOR_DARK : BG_COLOR_LIGHT
  const textColor = isDark ? TEXT_COLOR_DARK : TEXT_COLOR_LIGHT

  // 背景渐变
  const gradient = new LinearGradient()
  gradient.colors = [new Color(bgColor), new Color(isDark ? "#16213e" : "#e8e8f0")]
  gradient.locations = [0, 1]
  widget.backgroundGradient = gradient
  widget.setPadding(16, 16, 16, 16)

  // 图标行
  const iconRow = widget.addStack()
  iconRow.layoutHorizontally()
  iconRow.centerAlignContent()

  const iconText = iconRow.addText(WIDGET_ICON)
  iconText.font = Font.largeTitle()

  iconRow.addSpacer(8)

  const titleText = iconRow.addText(WIDGET_TITLE)
  titleText.font = Font.headline()
  titleText.textColor = new Color(isDark ? ACCENT_COLOR : "#c23152")

  iconRow.addSpacer()

  const statusDot = iconRow.addText("●")
  statusDot.font = Font.caption2()
  statusDot.textColor = new Color("#4ecca3")

  widget.addSpacer(8)

  const subtitleText = widget.addText(WIDGET_SUBTITLE)
  subtitleText.font = Font.body()
  subtitleText.textColor = new Color(textColor)
  subtitleText.textOpacity = 0.7

  widget.addSpacer(8)

  // 脚本名称标签
  const scriptStack = widget.addStack()
  scriptStack.layoutHorizontally()
  scriptStack.centerAlignContent()
  scriptStack.size = new Size(0, 28)
  scriptStack.cornerRadius = 14
  scriptStack.backgroundColor = new Color(isDark ? "#0f3460" : "#d8d8e8")
  scriptStack.setPadding(4, 12, 4, 12)

  const scriptIcon = scriptStack.addText("▶")
  scriptIcon.font = Font.caption1()
  scriptIcon.textColor = new Color(ACCENT_COLOR)

  scriptStack.addSpacer(4)

  const scriptName = scriptStack.addText(TARGET_SCRIPT)
  scriptName.font = Font.caption1()
  scriptName.textColor = new Color(textColor)
  scriptName.textOpacity = 0.8

  widget.addSpacer()

  // 显示当前时间
  const now = new Date().toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  const timeText = widget.addText(now)
  timeText.font = Font.caption2()
  timeText.textColor = new Color(textColor)
  timeText.textOpacity = 0.5

  // 显示上次打卡时间
  const lastCheckin = getLastCheckinTime()
  if (lastCheckin) {
    widget.addSpacer(2)
    const checkinText = widget.addText("上次打卡: " + lastCheckin)
    checkinText.font = Font.caption2()
    checkinText.textColor = new Color("#4ecca3")
    checkinText.textOpacity = 0.8
  }

  return widget
}