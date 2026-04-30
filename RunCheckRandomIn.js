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
const TARGET_SCRIPT = "checkrandomin"  // 要运行的目标脚本名称
const WIDGET_TITLE = "随机签到"        // 小组件标题
const WIDGET_ICON = "🎲"              // 小组件图标
const WIDGET_SUBTITLE = "点击运行签到"  // 小组件副标题
const BG_COLOR_DARK = "#1a1a2e"       // 深色背景
const BG_COLOR_LIGHT = "#f0f0f5"      // 浅色背景
const ACCENT_COLOR = "#e94560"        // 强调色
const TEXT_COLOR_DARK = "#ffffff"      // 深色模式文字颜色
const TEXT_COLOR_LIGHT = "#16213e"     // 浅色模式文字颜色

// ========== 小组件入口 ==========
const widget = await createWidget()

// 判断运行环境：如果是小组件则显示，否则预览
if (config.runsInWidget) {
  Script.setWidget(widget)
} else {
  // 在 Scriptable app 中直接运行时，弹出提示并运行目标脚本
  const alert = new Alert()
  alert.title = "运行目标脚本"
  alert.message = `即将运行脚本: ${TARGET_SCRIPT}`
  alert.addAction("运行")
  alert.addCancelAction("取消")
  
  const result = await alert.present()
  if (result === 0) {
    // 用户点击"运行"，打开目标脚本
    runTargetScript()
  } else {
    // 预览小组件
    widget.presentMedium()
  }
}

Script.complete()

// ========== 创建小组件 ==========
async function createWidget() {
  const widget = new ListWidget()
  
  // 设置点击跳转 - 使用 Scriptable URL Scheme 运行目标脚本
  widget.url = `scriptable:///run?scriptName=${encodeURIComponent(TARGET_SCRIPT)}`
  
  // 判断深色/浅色模式
  const isDark = Device.isUsingDarkAppearance()
  const bgColor = isDark ? BG_COLOR_DARK : BG_COLOR_LIGHT
  const textColor = isDark ? TEXT_COLOR_DARK : TEXT_COLOR_LIGHT
  
  // 设置背景
  const gradient = new LinearGradient()
  gradient.colors = [
    new Color(bgColor),
    new Color(isDark ? "#16213e" : "#e8e8f0")
  ]
  gradient.locations = [0, 1]
  widget.backgroundGradient = gradient
  
  // 设置内边距
  widget.setPadding(16, 16, 16, 16)
  
  // 图标行
  const iconRow = widget.addStack()
  iconRow.layoutHorizontally()
  iconRow.centerAlignContent()
  
  // 图标
  const iconText = iconRow.addText(WIDGET_ICON)
  iconText.font = Font.largeTitle()
  
  iconRow.addSpacer(8)
  
  // 标题
  const titleText = iconRow.addText(WIDGET_TITLE)
  titleText.font = Font.headline()
  titleText.textColor = new Color(isDark ? ACCENT_COLOR : "#c23152")
  titleText.textOpacity = 1
  
  iconRow.addSpacer()
  
  // 状态指示点
  const statusDot = iconRow.addText("●")
  statusDot.font = Font.caption2()
  statusDot.textColor = new Color("#4ecca3")
  
  // 间隔
  widget.addSpacer(8)
  
  // 副标题
  const subtitleText = widget.addText(WIDGET_SUBTITLE)
  subtitleText.font = Font.body()
  subtitleText.textColor = new Color(textColor)
  subtitleText.textOpacity = 0.7
  
  widget.addSpacer(8)
  
  // 目标脚本名称
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
  
  // 底部间隔
  widget.addSpacer()
  
  // 底部时间
  const timeText = widget.addText(new Date().toLocaleString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  }))
  timeText.font = Font.caption2()
  timeText.textColor = new Color(textColor)
  timeText.textOpacity = 0.5
  
  return widget
}

// ========== 运行目标脚本 ==========
function runTargetScript() {
  const url = `scriptable:///run?scriptName=${encodeURIComponent(TARGET_SCRIPT)}`
  Safari.openInApp(url)
}