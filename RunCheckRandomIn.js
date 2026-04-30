/**
 * Scriptable 小组件 - 点击运行 checkrandomin 脚本
 * 
 * 使用方法：
 * 1. 将此脚本放入 Scriptable 的脚本目录
 * 2. 在 iOS 桌面添加 Scriptable 小组件
 * 3. 选择此脚本作为小组件内容
 * 4. 点击小组件即可运行 checkrandomin 脚本
 * 
 * 兼容性：内置 Surge/Quantumult X 环境变量 polyfill ($prefs, $notify, $done 等)
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

// ========== Surge/QX 环境变量 Polyfill ==========
function setupPolyfills() {
  // $prefs - 兼容 Surge 偏好设置 (支持 get/set/valueForKey/setValueForKey 等)
  if (typeof $prefs === "undefined") {
    globalThis.$prefs = {
      get(key) {
        try { return Keychain.get(String(key)) } catch(e) { return null }
      },
      set(key, value) {
        try { Keychain.set(String(key), typeof value === "object" ? JSON.stringify(value) : String(value)) } catch(e) { console.log("$prefs.set error: " + e) }
      },
      remove(key) {
        try { Keychain.remove(String(key)) } catch(e) {}
      },
      valueForKey(key) {
        try { return Keychain.get(String(key)) } catch(e) { return null }
      },
      setValueForKey(value, key) {
        try { Keychain.set(String(key), typeof value === "object" ? JSON.stringify(value) : String(value)) } catch(e) { console.log("$prefs.setValueForKey error: " + e) }
      },
      removeValueForKey(key) {
        try { Keychain.remove(String(key)) } catch(e) {}
      }
    }
  }

  // $notify - 发送通知
  if (typeof $notify === "undefined") {
    globalThis.$notify = (title, subtitle, body) => {
      console.log("[通知] " + title + ": " + (subtitle || "") + " - " + (body || ""))
      const n = new Notification()
      n.title = title || ""
      n.body = subtitle ? subtitle + "\n" + (body || "") : (body || "")
      n.schedule()
    }
  }

  // $done - 完成回调
  if (typeof $done === "undefined") {
    globalThis.$done = (result) => {
      console.log("[$done] 被调用")
      if (result) console.log("$done result: " + JSON.stringify(result))
    }
  }

  // $httpClient - HTTP 请求
  if (typeof $httpClient === "undefined") {
    globalThis.$httpClient = {
      get(request, callback) { _httpRequest("GET", request, callback) },
      post(request, callback) { _httpRequest("POST", request, callback) },
      put(request, callback) { _httpRequest("PUT", request, callback) },
      delete(request, callback) { _httpRequest("DELETE", request, callback) },
      head(request, callback) { _httpRequest("HEAD", request, callback) }
    }
  }

  // $task - 异步任务
  if (typeof $task === "undefined") {
    globalThis.$task = {
      fetch(request) {
        return new Promise((resolve, reject) => {
          _httpRequest(request.method || "GET", request, (error, response, data) => {
            if (error) { reject(error) }
            else {
              resolve({
                statusCode: response.status,
                headers: response.headers,
                body: data
              })
            }
          })
        })
      }
    }
  }

  // $persistentStore - 持久化存储
  if (typeof $persistentStore === "undefined") {
    globalThis.$persistentStore = {
      read(key) { try { return Keychain.get(String(key)) } catch(e) { return null } },
      write(value, key) {
        try { Keychain.set(String(key), String(value)); return true } catch(e) { return false }
      }
    }
  }

  // $env
  if (typeof $env === "undefined") {
    globalThis.$env = { appName: "Scriptable", appVersion: Device.systemVersion, platform: "ios" }
  }

  // $script
  if (typeof $script === "undefined") {
    globalThis.$script = { name: TARGET_SCRIPT, startTime: new Date().getTime() }
  }

  // $argument
  if (typeof $argument === "undefined") {
    globalThis.$argument = ""
  }

  // $surge
  if (typeof $surge === "undefined") {
    globalThis.$surge = { build: "0", version: "0" }
  }

  // $utils (某些脚本使用)
  if (typeof $utils === "undefined") {
    globalThis.$utils = {
      notify: globalThis.$notify
    }
  }
}

// ========== HTTP 请求封装 ==========
function _httpRequest(method, request, callback) {
  let url, headers, body

  if (typeof request === "string") {
    url = request
    headers = {}
    body = null
  } else {
    url = request.url
    headers = request.headers || {}
    body = request.body || null
  }

  const req = new Request(url)
  req.method = method
  req.headers = headers
  if (body) {
    req.body = typeof body === "string" ? body : JSON.stringify(body)
  }

  req.loadString()
    .then((data) => {
      callback(null, { status: req.response.statusCode, headers: req.response.headers }, data)
    })
    .catch((error) => {
      callback(error, null, null)
    })
}

// ========== 读取并执行目标脚本 ==========
function findScriptPath(scriptName) {
  const fmLocal = FileManager.local()
  const fmCloud = FileManager.iCloud()

  const scriptPaths = [
    fmLocal.joinPath(fmLocal.documentsDirectory, scriptName + ".js"),
    fmCloud.joinPath(fmCloud.documentsDirectory, scriptName + ".js")
  ]

  for (const path of scriptPaths) {
    if (fmLocal.fileExists(path)) {
      return path
    }
  }
  return null
}

async function runTargetScript(scriptName) {
  const scriptPath = findScriptPath(scriptName)

  if (!scriptPath) {
    const fmLocal = FileManager.local()
    const fmCloud = FileManager.iCloud()
    throw new Error(
      "找不到脚本: " + scriptName + ".js\n已搜索:\n- " + fmLocal.documentsDirectory + "\n- " + fmCloud.documentsDirectory
    )
  }

  console.log("找到脚本: " + scriptPath)
  const fm = FileManager.local()
  const scriptContent = fm.readString(scriptPath)

  if (!scriptContent) {
    throw new Error("脚本内容为空: " + scriptPath)
  }

  // 用 async 函数包装执行，polyfill 已挂载到 globalThis 可被访问
  console.log("开始执行脚本: " + scriptName)
  const asyncFn = new Function("return (async () => {\n" + scriptContent + "\n})()")
  await asyncFn()
  console.log("脚本 " + scriptName + " 执行完成")
}

// ========== 小组件入口 ==========
const widget = await createWidget()

if (config.runsInWidget) {
  widget.url = "scriptable:///run?scriptName=" + encodeURIComponent(Script.name())
  Script.setWidget(widget)
} else {
  setupPolyfills()

  try {
    await runTargetScript(TARGET_SCRIPT)
    const n = new Notification()
    n.title = "✅ 签到完成"
    n.body = TARGET_SCRIPT + " 已成功运行"
    n.schedule()
  } catch (e) {
    console.log("脚本运行出错: " + e)
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