/**
 * Scriptable 小组件 - 点击运行 checkrandomin 脚本
 * 
 * 使用方法：
 * 1. 将此脚本放入 Scriptable 的脚本目录
 * 2. 在 iOS 桌面添加 Scriptable 小组件
 * 3. 选择此脚本作为小组件内容
 * 4. 点击小组件即可运行 checkrandomin 脚本
 */

// ========== 配置区域 ==========
const TARGET_SCRIPT = "checkrandomin"
const WIDGET_TITLE = "随机签到"
const WIDGET_ICON = "🎲"
const WIDGET_SUBTITLE = "点击运行签到"
const BG_COLOR_DARK = "#1a1a2e"
const BG_COLOR_LIGHT = "#f0f0f5"
const ACCENT_COLOR = "#e94560"
const TEXT_COLOR_DARK = "#ffffff"
const TEXT_COLOR_LIGHT = "#16213e"

// ========== 运行目标脚本 ==========
function findScriptPath(scriptName) {
  const fm = FileManager.local()
  // 优先查找本地目录，再查找 iCloud 目录
  const dirs = [
    fm.documentsDirectory,
    FileManager.iCloud().documentsDirectory
  ]
  for (const dir of dirs) {
    const path = fm.joinPath(dir, scriptName + ".js")
    if (fm.fileExists(path)) {
      return path
    }
  }
  return null
}

async function runTargetScript(scriptName) {
  const path = findScriptPath(scriptName)

  if (!path) {
    throw new Error("找不到脚本: " + scriptName + ".js")
  }

  const fm = FileManager.local()
  const code = fm.readString(path)
  if (!code) {
    throw new Error("脚本内容为空: " + path)
  }

  console.log("开始执行脚本: " + scriptName)
  const result = eval(code)
  // 如果脚本返回 Promise，则等待它
  if (result && typeof result.then === "function") {
    await result
  }
  console.log("脚本 " + scriptName + " 执行完成")
}

// ========== 小组件入口 ==========
const widget = await createWidget()

if (config.runsInWidget) {
  widget.url = "scriptable:///run?scriptName=" + encodeURIComponent(Script.name())
  Script.setWidget(widget)
} else {
  try {
    await runTargetScript(TARGET_SCRIPT)
    const n = new Notification()
    n.title = "✅ 签到完成"
    n.body = TARGET_SCRIPT + " 已成功运行"
    n.schedule()
  } catch (e) {
    const n = new Notification()
    n.title = "❌ 签到失败"
    n.body = "错误: " + String(e)
    n.schedule()
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

  const timeText = widget.addText(new Date().toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" }))
  timeText.font = Font.caption2()
  timeText.textColor = new Color(textColor)
  timeText.textOpacity = 0.5

  return widget
}