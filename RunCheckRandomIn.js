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
const TARGET_SCRIPT = "checkrandomin"  // 要运行的目标脚本名称
const WIDGET_TITLE = "随机签到"        // 小组件标题
const WIDGET_ICON = "🎲"              // 小组件图标
const WIDGET_SUBTITLE = "点击运行签到"  // 小组件副标题
const BG_COLOR_DARK = "#1a1a2e"       // 深色背景
const BG_COLOR_LIGHT = "#f0f0f5"      // 浅色背景
const ACCENT_COLOR = "#e94560"        // 强调色
const TEXT_COLOR_DARK = "#ffffff"      // 深色模式文字颜色
const TEXT_COLOR_LIGHT = "#16213e"     // 浅色模式文字颜色

// ========== Surge/QX 环境变量 Polyfill ==========
function setupPolyfills() {
  // $prefs - 键值存储 (模拟 Surge 的偏好设置)
  if (typeof $prefs === 'undefined') {
    globalThis.$prefs = {
      get: (key) => {
        try {
          return Keychain.get(key)
        } catch (e) {
          return null
        }
      },
      set: (key, value) => {
        try {
          Keychain.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
        } catch (e) {
          console.log(`$prefs.set error: ${e}`)
        }
      },
      remove: (key) => {
        try {
          Keychain.remove(key)
        } catch (e) {
          console.log(`$prefs.remove error: ${e}`)
        }
      }
    }
  }

  // $notify - 发送通知
  if (typeof $notify === 'undefined') {
    globalThis.$notify = (title, subtitle, body) => {
      console.log(`[通知] ${title}: ${subtitle || ''} - ${body || ''}`)
      const notification = new Notification()
      notification.title = title || ""
      notification.body = subtitle ? `${subtitle}\n${body || ""}` : (body || "")
      notification.schedule()
    }
  }

  // $done - 完成回调
  if (typeof $done === 'undefined') {
    globalThis.$done = (result) => {
      console.log("[完成] $done 被调用")
      if (result) {
        console.log(`$done result: ${JSON.stringify(result)}`)
      }
    }
  }

  // $httpClient - HTTP 请求
  if (typeof $httpClient === 'undefined') {
    globalThis.$httpClient = {
      get: (request, callback) => {
        _httpRequest("GET", request, callback)
      },
      post: (request, callback) => {
        _httpRequest("POST", request, callback)
      },
      put: (request, callback) => {
        _httpRequest("PUT", request, callback)
      },
      delete: (request, callback) => {
        _httpRequest("DELETE", request, callback)
      }
    }
  }

  // $task - 异步任务 (兼容 Surge fetch)
  if (typeof $task === 'undefined') {
    globalThis.$task = {
      fetch: (request) => {
        return new Promise((resolve, reject) => {
          _httpRequest(request.method || "GET", request, (error, response, data) => {
            if (error) {
              reject(error)
            } else {
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
  if (typeof $persistentStore === 'undefined') {
    globalThis.$persistentStore = {
      read: (key) => {
        try {
          return Keychain.get(key)
        } catch (e) {
          return null
        }
      },
      write: (key, value) => {
        try {
          Keychain.set(key, value)
          return true
        } catch (e) {
          return false
        }
      }
    }
  }

  // $env - 环境信息
  if (typeof $env === 'undefined') {
    globalThis.$env = {
      appName: "Scriptable",
      appVersion: Device.systemVersion,
      platform: "ios"
    }
  }

  // $script - 脚本信息
  if (typeof $script === 'undefined') {
    globalThis.$script = {
      name: TARGET_SCRIPT,
      startTime: new Date().getTime()
    }
  }

  // $argument - 参数
  if (typeof $argument === 'undefined') {
    globalThis.$argument = ""
  }

  // $surge - Surge 版本信息
  if (typeof $surge === 'undefined') {
    globalThis.$surge = {
      build: "0",
      version: "0"
    }
  }

  // console.write 某些脚本可能使用
  if (typeof console.write === 'undefined') {
    console.write = (msg) => console.log(msg)
  }
}

// ========== HTTP 请求封装 ==========
function _httpRequest(method, request, callback) {
  // 兼容两种参数格式: (url, callback) 或 (options, callback)
  let url, headers, body
  
  if (typeof request === 'string') {
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
    req.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  req.loadString()
    .then((data) => {
      callback(null, {
        status: req.response.statusCode,
        headers: req.response.headers
      }, data)
    })
    .catch((error) => {
      callback(error, null, null)
    })
}

// ========== 读取目标脚本内容 ==========
function findScriptPath(scriptName) {
  const fm = FileManager.local()
  
  // 可能的脚本目录
  const scriptDirs = [
    fm.joinPath(fm.documentsDirectory(), scriptName + ".js"),
    fm.joinPath(fm.cloudDirectory(), scriptName + ".js"),
    fm.joinPath(fm.libraryDirectory(), scriptName + ".js")
  ]
  
  for (const path of scriptDirs) {
    if (fm.fileExists(path)) {
      return path
    }
  }
  return null
}

async function runTargetScript(scriptName) {
  const fm = FileManager.local()
  const scriptPath = findScriptPath(scriptName)
  
  if (!scriptPath) {
    throw new Error(`找不到脚本: ${scriptName}.js\n已搜索目录:\n- ${fm.documentsDirectory()}\n- ${fm.cloudDirectory()}`)
  }
  
  console.log(`找到脚本: ${scriptPath}`)
  const scriptContent = fm.readString(scriptPath)
  
  if (!scriptContent) {
    throw new Error(`脚本内容为空: ${scriptPath}`)
  }
  
  // 在当前上下文中 eval 执行，使 polyfill 生效
  console.log(`开始执行脚本: ${scriptName}`)
  await eval(scriptContent)
  console.log(`脚本 ${scriptName} 执行完成`)
}

// ========== 小组件入口 ==========
const widget = await createWidget()

if (config.runsInWidget) {
  // 小组件模式：设置 URL 触发自身运行（非 widget 模式）
  widget.url = `scriptable:///run?scriptName=${encodeURIComponent(Script.name())}`
  Script.setWidget(widget)
} else {
  // 非小组件模式（点击小组件后触发或手动运行）
  // 安装 polyfills
  setupPolyfills()
  
  // 运行目标脚本
  try {
    await runTargetScript(TARGET_SCRIPT)
    
    // 发送完成通知
    const notification = new Notification()
    notification.title = "✅ 签到完成"
    notification.body = `${TARGET_SCRIPT} 已成功运行`
    notification.schedule()
  } catch (e) {
    console.log(`脚本运行出错: ${e}`)
    
    // 发送错误通知
    const notification = new Notification()
    notification.title = "❌ 签到失败"
    notification.body = `错误: ${String(e)}`
    notification.schedule()
  }
}

Script.complete()

// ========== 创建小组件 ==========
async function createWidget() {
  const widget = new ListWidget()
  
  // 判断深色/浅色模式
  const isDark = Device.isUsingDarkAppearance()
  const bgColor = isDark ? BG_COLOR_DARK : BG_COLOR_LIGHT
  const textColor = isDark ? TEXT_COLOR_DARK : TEXT_COLOR_LIGHT
  
  // 设置背景渐变
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
  
  // 目标脚本名称标签
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