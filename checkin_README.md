# WeLink 自动签到脚本使用说明

这是一个适用于 iOS Scriptable 应用的自动签到脚本，用于在 WeLink 上进行自动签到。

## 📋 功能特点

1. ✅ 自动签到功能
2. 🔄 自动刷新 Token（每 2 小时更新）
3. 🔒 使用 Keychain 安全存储凭证
4. 📱 支持 iOS 通知提醒
5. 🔁 失败自动重试机制

## 🚀 安装步骤

### 1. 安装 Scriptable

从 App Store 下载并安装 [Scriptable](https://apps.apple.com/app/scriptable/id1405459188)

### 2. 导入脚本

1. 打开 Scriptable 应用
2. 点击右上角的 `+` 创建新脚本
3. 复制 `checkin.js` 的内容到新脚本中
4. 将脚本命名为 `checkin` 或你喜欢的名称

### 3. 配置凭证

首次使用前，需要设置你的 `refresh_token` 和 `tenantid`：

1. 打开脚本编辑页面
2. 找到 `main()` 函数中的配置部分
3. 取消注释以下代码：

```javascript
setCredentials(
  '你的_refresh_token',
  '你的_tenantid'
);
```

4. 从抓包数据中提取这两个值（参考下面的说明）

### 4. 提取凭证信息

#### 获取 refresh_token 和 tenantid

从 `refresh.txt` 文件中的 **request body** 部分提取：

```
refresh_token=qWTB3obvCBSlW9HdMkONzQ%3D%3D...（完整的值）
tenantid=nT8N5Q2pSqKqWKqFyyBEtN1lT7vfxVejb7QFCBndHLwYDRbkbztWtWsS8oDyUavX9LZ9W/MKKnofbRiF6RSZF4TD61bc8qMZhzXkkm6UXzBXRHQlgYELHcwIPH2jI1Qi3pkj3TQ0F3H7FLaAY8Opzqju3FoBOiz3J5KEBHGsV%2BzVjphWZttUgdT%2BpwZ5h97olHOC2dD/MhutMFlULdsQc8kXWys0iFallpJ/9FMPLNXQpuRzcLLOutSs9hcOtnScecp8j2xHebqbpeRomq7hvyifZhhf5BGyTt3i/Hf6SYzV/9uRZGVzpDuIbrZDVnpEHu7MwT%2BBv6EC2PG0T8GxrNLreIketmyz31oTVlzgc6kCBMQ4T6gLzXuoReHHaPYg6qcQBi2yYO5mh23OiYYoRGxEpwZ6znrw2tBJd0FNijaV%2BD0BVg%2BAd2BfvSRPWJY1bJTLysGzuiklb2pbFIvlJGJTaQmy%2BDl46EK6MWmooviS135GSXcEUm8W5WmluD/l
```

#### 配置个人信息

在脚本顶部的 `CONFIG.USER_INFO` 中修改你的信息：

```javascript
USER_INFO: {
  employeeNumber: "3ZGHIG5PP7YI@AD802282B91",  // 改为你的员工编号
  deviceId: "5295F639-0CA9-4B42-87CD-B75B3BEF1A77",  // 你的设备 ID
  deviceType: "2",
  deviceName: "iPhone15,3",
  uuid: "5295F639-0CA9-4B42-87CD-B75B3BEF1A77"
}
```

#### 修改签到位置信息

在 `doCheckIn()` 函数中修改位置信息（如果需要）：

```javascript
const location = {
  "x": "120.798321",  // 经度
  "y": "31.275254",   // 纬度
  "location": "江苏省苏州市虎丘区斜塘街道华为苏州研究所(北门)",
  "city": "苏州市",
  "province": "江苏省",
  // ... 其他信息
};
```

## 🔧 使用方法

### 方式一：手动运行

1. 打开 Scriptable 应用
2. 找到并点击 `checkin` 脚本
3. 点击运行按钮

### 方式二：通过快捷指令自动化

1. 打开 iOS 的"快捷指令"应用
2. 创建新自动化
3. 选择触发器（如：特定时间、位置等）
4. 添加"运行快捷指令"操作
5. 选择 Scriptable
6. 选择运行 `checkin` 脚本

### 方式三：通过 Siri 运行

1. 在 Scriptable 中设置脚本的 Siri 短语
2. 对 Siri 说："运行 checkin"

## 📝 脚本说明

### 主要函数

- `checkIn()` - 执行签到操作
- `refreshToken()` - 刷新访问令牌
- `getValidToken()` - 获取有效的访问令牌
- `setCredentials()` - 设置初始凭证

### 数据存储

脚本使用 iOS Keychain 安全存储以下信息：
- `welink_refresh_token` - 刷新令牌
- `welink_tenantid` - 租户 ID
- `welink_token` - 当前访问令牌

### 自动 Token 刷新

脚本会自动管理 Token 的生命周期：
1. 首次使用会调用刷新接口获取新 Token
2. 如果签到失败且疑似 Token 过期，会自动刷新并重试
3. 刷新后的新 Token 会自动保存

## 🛠️ 故障排除

### 问题：提示"缺少必要的凭证信息"

**解决方案：**
1. 确保已调用 `setCredentials()` 设置了凭证
2. 检查 Keychain 中是否有保存的数据

### 问题：签到失败

**解决方案：**
1. 检查网络连接
2. 验证位置信息是否正确
3. 确认设备信息和员工编号是否正确
4. 检查 Token 是否有效（脚本会自动刷新）

### 问题：Token 刷新失败

**解决方案：**
1. `refresh_token` 可能已过期（7天有效期）
2. 重新抓包获取最新的 `refresh_token` 和 `tenantid`
3. 调用 `setCredentials()` 更新凭证

## ⚠️ 注意事项

1. **安全提醒**：此脚本包含敏感凭证信息，请不要分享给他人
2. **Token 有效期**：`refresh_token` 有效期为 7 天，需要定期更新
3. **位置信息**：确保填写的位置信息与你实际签到位置一致
4. **使用规范**：请遵守公司考勤制度，合理使用自动签到功能

## 📅 建议使用场景

- 🕐 定时签到（通过快捷指令设置自动化）
- 📍 到达公司时自动签到（基于位置触发）
- 🎵 Siri 语音签到
- 📱 快速签到（通过小组件运行）

## 🔐 隐私说明

所有敏感信息均存储在 iOS Keychain 中，不会上传到任何服务器。Token 仅在 WeLink 官方 API 中使用。

---

**最后更新：** 2025-10-25

