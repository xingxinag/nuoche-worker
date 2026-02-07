import { PUBLIC_HTML, ADMIN_HTML } from './html.js';

// 默认配置
const DEFAULT_CONFIG = {
    phoneNumber: "",
    showPhoneNumber: false,
    enableWxPusher: false,
    wxpusherAppToken: "",
    wxpusherUids: "",
    enableBark: false,
    barkUrl: "",
    enableTelegram: false,
    tgBotToken: "",
    tgChatId: "",
    enableDingTalk: false,
    dingTalkWebhook: "",
    enableWeCom: false,
    weComWebhook: "",
    enableFeishu: false,
    feishuWebhook: "",
    enableServerChan: false,
    serverChanKey: ""
};

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // 加载配置：优先 KV，其次 Env，最后默认值
        let config = await loadConfig(env);

        // 1. 首页 (挪车页面)
        if (path === '/') {
            return new Response(PUBLIC_HTML(config), {
                headers: { 'Content-Type': 'text/html;charset=UTF-8' }
            });
        }

        // 2. 接口: 发送通知
        if (path === '/api/notify' && request.method === 'POST') {
            return await handleNotify(config, request);
        }

        // 3. 管理后台
        if (path === '/admin') {
            return await handleAdmin(request, env, config);
        }

        // 4. 接口: 保存配置 (仅限管理员)
        if (path === '/api/settings' && request.method === 'POST') {
            return await handleSaveSettings(request, env);
        }

        // 5. 接口: 修改密码 (仅限管理员)
        if (path === '/api/change-password' && request.method === 'POST') {
            return await handleChangePassword(request, env);
        }

        return new Response('Not Found', { status: 404 });
    }
};

/**
 * 加载配置逻辑
 * 优先级: KV > Env > Default
 */
async function loadConfig(env) {
    let kvConfig = {};
    try {
        if (env['nuoche-1']) {
            const val = await env['nuoche-1'].get("config");
            if (val) kvConfig = JSON.parse(val);
        }
    } catch (e) {
        console.error("KV Read Error:", e);
    }

    const envConfig = {};
    // 读取环境变量中的配置 (如果存在)
    for (const key of Object.keys(DEFAULT_CONFIG)) {
        if (env[key] !== undefined) {
            // 转换布尔值
            if (env[key] === 'true') envConfig[key] = true;
            else if (env[key] === 'false') envConfig[key] = false;
            else envConfig[key] = env[key];
        }
    }

    return { ...DEFAULT_CONFIG, ...envConfig, ...kvConfig };
}

async function getAdminPassword(env) {
    let password = env.ADMIN_PASSWORD;
    try {
        if (env['nuoche-1']) {
            const kvPassword = await env['nuoche-1'].get("admin_password");
            if (kvPassword) password = kvPassword;
        }
    } catch (e) {
        console.error("KV Read Password Error:", e);
    }
    return password;
}

/**
 * 处理管理后台请求 (包含 Basic Auth)
 */
async function handleAdmin(request, env, config) {
    // 检查密码配置
    const adminPassword = await getAdminPassword(env);
    
    // 如果没有设置密码，提示用户设置
    if (!adminPassword) {
        return new Response("请先在 Cloudflare 后台设置环境变量 'ADMIN_PASSWORD'", { status: 500 });
    }

    // 检查登出
    if (new URL(request.url).searchParams.has('logout')) {
        return new Response("已退出登录", { status: 401 });
    }

    // Basic Auth 验证
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Basic ${btoa('admin:' + adminPassword)}`) {
        return new Response('需要登录', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Nuoche Admin"' }
        });
    }

    // 渲染管理页面
    return new Response(ADMIN_HTML(JSON.stringify(config)), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
}

/**
 * 保存设置到 KV
 */
async function handleSaveSettings(request, env) {
    const adminPassword = await getAdminPassword(env);
    const authHeader = request.headers.get('Authorization');
    if (!adminPassword || !authHeader || authHeader !== `Basic ${btoa('admin:' + adminPassword)}`) {
         return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { 
             status: 401, 
             headers: { 'Content-Type': 'application/json' }
         });
    }

    if (!env['nuoche-1']) {
        return new Response(JSON.stringify({ success: false, message: "未绑定 KV 存储，无法保存设置" }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const newConfig = await request.json();
        // 简单的验证，防止保存垃圾数据
        const sanitizedConfig = {};
        for (const key of Object.keys(DEFAULT_CONFIG)) {
            if (newConfig[key] !== undefined) {
                sanitizedConfig[key] = newConfig[key];
            }
        }
        
        await env['nuoche-1'].put("config", JSON.stringify(sanitizedConfig));
        
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ success: false, message: e.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 修改密码
 */
async function handleChangePassword(request, env) {
    const adminPassword = await getAdminPassword(env);
    const authHeader = request.headers.get('Authorization');
    if (!adminPassword || !authHeader || authHeader !== `Basic ${btoa('admin:' + adminPassword)}`) {
         return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { 
             status: 401, 
             headers: { 'Content-Type': 'application/json' }
         });
    }

    if (!env['nuoche-1']) {
        return new Response(JSON.stringify({ success: false, message: "未绑定 KV 存储，无法修改密码" }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { newPassword } = await request.json();
        if (!newPassword) {
            return new Response(JSON.stringify({ success: false, message: "密码不能为空" }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        await env['nuoche-1'].put("admin_password", newPassword);
        
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ success: false, message: e.message }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/**
 * 执行通知发送逻辑
 */
async function handleNotify(config, request) {
    const body = await request.json().catch(() => ({}));
    const { contact, message, channels } = body;
    
    // 构建通知内容
    let notifyText = "🚗 挪车提醒：您好，有人需要您挪车，请及时处理。";
    if (message) {
        notifyText += `\n\n留言: ${message}`;
    }
    if (contact) {
        notifyText += `\n联系方式: ${contact}`;
    }

    const results = [];
    const promises = [];
    
    // 检查是否指定了渠道，如果没有指定，默认全部启用（兼容旧逻辑，虽然前端会传）
    const useChannel = (name) => {
        if (channels && Array.isArray(channels)) {
            return channels.includes(name);
        }
        return true; // 默认启用
    };

    // 1. WxPusher
    if (config.enableWxPusher && config.wxpusherAppToken && config.wxpusherUids && useChannel('WxPusher')) {
        promises.push(
            fetch("https://wxpusher.zjiecode.com/api/send/message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appToken: config.wxpusherAppToken,
                    content: notifyText,
                    contentType: 1,
                    uids: config.wxpusherUids.split(',').map(id => id.trim())
                })
            }).then(r => r.json()).then(d => ({ channel: 'WxPusher', success: d.code === 1000, msg: d.msg }))
              .catch(e => ({ channel: 'WxPusher', success: false, msg: e.message }))
        );
    }

    // 2. Bark (iOS)
    if (config.enableBark && config.barkUrl && useChannel('Bark')) {
        let url = config.barkUrl;
        if (!url.endsWith('/')) url += '/';
        const title = encodeURIComponent("挪车提醒");
        const body = encodeURIComponent(notifyText);
        url += `${title}/${body}`;
        
        promises.push(
            fetch(url).then(r => r.json()).then(d => ({ channel: 'Bark', success: d.code === 200, msg: d.message }))
              .catch(e => ({ channel: 'Bark', success: false, msg: e.message }))
        );
    }

    // 3. Telegram
    if (config.enableTelegram && config.tgBotToken && config.tgChatId && useChannel('Telegram')) {
        const tgUrl = `https://api.telegram.org/bot${config.tgBotToken}/sendMessage`;
        promises.push(
            fetch(tgUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: config.tgChatId,
                    text: "<b>" + notifyText + "</b>",
                    parse_mode: "HTML"
                })
            }).then(r => r.json()).then(d => ({ channel: 'Telegram', success: d.ok, msg: d.description }))
              .catch(e => ({ channel: 'Telegram', success: false, msg: e.message }))
        );
    }

    // 4. 钉钉 (DingTalk)
    if (config.enableDingTalk && config.dingTalkWebhook && useChannel('DingTalk')) {
        promises.push(
            fetch(config.dingTalkWebhook, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    msgtype: "text",
                    text: { content: notifyText }
                })
            }).then(r => r.json()).then(d => ({ channel: 'DingTalk', success: d.errcode === 0, msg: d.errmsg }))
              .catch(e => ({ channel: 'DingTalk', success: false, msg: e.message }))
        );
    }

    // 5. 企业微信 (WeCom)
    if (config.enableWeCom && config.weComWebhook && useChannel('WeCom')) {
        promises.push(
            fetch(config.weComWebhook, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    msgtype: "text",
                    text: { content: notifyText }
                })
            }).then(r => r.json()).then(d => ({ channel: 'WeCom', success: d.errcode === 0, msg: d.errmsg }))
              .catch(e => ({ channel: 'WeCom', success: false, msg: e.message }))
        );
    }

    // 6. 飞书 (Feishu)
    if (config.enableFeishu && config.feishuWebhook && useChannel('Feishu')) {
        promises.push(
            fetch(config.feishuWebhook, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    msg_type: "text",
                    content: { text: notifyText }
                })
            }).then(r => r.json()).then(d => ({ channel: 'Feishu', success: d.code === 0, msg: d.msg }))
              .catch(e => ({ channel: 'Feishu', success: false, msg: e.message }))
        );
    }

    // 7. ServerChan
    if (config.enableServerChan && config.serverChanKey && useChannel('ServerChan')) {
        const scUrl = `https://sctapi.ftqq.com/${config.serverChanKey}.send`;
        const params = new URLSearchParams();
        params.append('title', '挪车提醒');
        params.append('desp', notifyText);
        
        promises.push(
            fetch(scUrl, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params
            }).then(r => r.json()).then(d => ({ channel: 'ServerChan', success: d.code === 0, msg: d.message || d.error }))
              .catch(e => ({ channel: 'ServerChan', success: false, msg: e.message }))
        );
    }

    if (promises.length === 0) {
        return new Response(JSON.stringify({ success: false, message: "未选择或启用任何通知渠道" }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const resList = await Promise.all(promises);
    const successCount = resList.filter(r => r.success).length;

    return new Response(JSON.stringify({
        success: successCount > 0,
        message: `发送成功 ${successCount}/${promises.length} 个渠道`,
        details: resList
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
