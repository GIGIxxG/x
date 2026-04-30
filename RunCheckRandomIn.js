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
const WIDGET_IMAGE_URL = "https://raw.githubusercontent.com/alalalex-m/AlQuantumult/refs/heads/main/Pics/IMG_3542.jpeg?token=TTOAX"
const BG_COLOR = "#1a1a2e"
const TEXT_COLOR = "#4ecca3"
const LAST_CHECKIN_KEY = "lastCheckinTime"

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

  // 背景
  widget.backgroundColor = new Color(BG_COLOR)
  widget.setPadding(12, 12, 12, 12)

  // 加载并显示图片
  try {
    const req = new Request(WIDGET_IMAGE_URL)
    const img = await req.loadImage()
    widget.backgroundImage = img
  } catch (e) {
    console.log("加载图片失败: " + e)
  }

  // 显示上次打卡时间
  const lastCheckin = getLastCheckinTime()
  if (lastCheckin) {
    widget.addSpacer()
    const checkinText = widget.addText("上次打卡: " + lastCheckin)
    checkinText.font = Font.caption()
    checkinText.textColor = new Color(TEXT_COLOR)
    checkinText.textOpacity = 0.9
  }

  return widget
}