// 脚本名称: ClearKeychain.js
// 功能: 删除 WeLink 打卡脚本保存的认证数据，用于重置。

const KEYCHAIN_KEY = "WeLinkAutoCheckinAuthData";

try {
    if (Keychain.contains(KEYCHAIN_KEY)) {
        Keychain.remove(KEYCHAIN_KEY);
        console.log(`✅ 成功从 Keychain 中移除了 key: ${KEYCHAIN_KEY}`);
        
        let alert = new Alert();
        alert.title = "清除成功";
        alert.message = "已成功移除旧的认证数据。请现在运行您的 checkin.js 脚本。";
        await alert.present();
    } else {
        console.log(`ℹ️ Key: ${KEYCHAIN_KEY} 在 Keychain 中未找到，无需操作。`);
        
        let alert = new Alert();
        alert.title = "无需操作";
        alert.message = "Keychain 中没有找到旧数据。";
        await alert.present();
    }
} catch (e) {
    console.error(`❌ 清除失败: ${e}`);
}

Script.complete();