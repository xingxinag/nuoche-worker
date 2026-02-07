export const PUBLIC_HTML = (config) => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>通知车主挪车</title>
    <style>
        :root { --primary-color: #007bff; --bg-color: #f4f7f6; --card-bg: #ffffff; --text-color: #333; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--bg-color); color: var(--text-color); padding: 20px; position: relative; }
        .container { text-align: center; padding: 30px; width: 100%; max-width: 420px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); background: var(--card-bg); transition: transform 0.2s; position: relative; z-index: 1; }
        h1 { font-size: 24px; margin-bottom: 10px; color: var(--primary-color); font-weight: 600; }
        .subtitle { color: #666; font-size: 14px; margin-bottom: 30px; }
        .car-icon { font-size: 48px; margin-bottom: 20px; display: inline-block; }
        .btn-grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
        button { width: 100%; padding: 16px; font-size: 16px; font-weight: 600; color: #fff; border: none; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        button:active { transform: scale(0.98); }
        button:disabled { background-color: #ccc !important; cursor: not-allowed; }
        
        /* Button Colors */
        .btn-notify { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); }
        .btn-call { background: linear-gradient(135deg, #007bff 0%, #6610f2 100%); }
        .footer { margin-top: 30px; font-size: 12px; color: #999; }
        
        .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: white; padding: 10px 20px; border-radius: 50px; font-size: 14px; opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 1000; }
        .toast.show { opacity: 1; }

        /* Admin Link */
        .admin-link { position: absolute; bottom: 20px; right: 20px; opacity: 0.05; font-size: 24px; text-decoration: none; color: #000; transition: opacity 0.3s; z-index: 0; }
        .admin-link:hover { opacity: 0.8; }

        /* Modal */
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 100; align-items: center; justify-content: center; padding: 20px; }
        .modal.show { display: flex; }
        .modal-content { background: white; padding: 25px; border-radius: 12px; width: 100%; max-width: 400px; text-align: left; box-shadow: 0 5px 15px rgba(0,0,0,0.2); animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-header { font-size: 18px; font-weight: bold; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .close-btn { background: none; border: none; font-size: 24px; color: #999; padding: 0; width: auto; box-shadow: none; cursor: pointer; }
        .close-btn:hover { color: #333; }
        .form-item { margin-bottom: 15px; }
        .form-item label { display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px; color: #555; }
        .form-item input, .form-item textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; transition: border-color 0.3s; font-family: inherit; }
        .form-item input:focus, .form-item textarea:focus { border-color: var(--primary-color); outline: none; }
        .channel-list { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
        .channel-item { display: flex; align-items: center; gap: 6px; font-size: 13px; background: #f8f9fa; padding: 8px 12px; border-radius: 20px; border: 1px solid #eee; cursor: pointer; transition: all 0.2s; }
        .channel-item:hover { background: #e9ecef; }
        .channel-item input { width: auto; margin: 0; }
        .channel-item label { margin: 0; cursor: pointer; font-weight: normal; color: #333; }
    </style>
</head>
<body>
    <div class="container">
        <div class="car-icon">🚗</div>
        <h1>临时停靠 请多关照</h1>
        <p class="subtitle">如需挪车，请点击下方按钮通知我</p>
        
        <div class="btn-grid">
            <button class="btn-notify" onclick="openModal()">
                <span>🔔</span> 一键通知车主挪车
            </button>
            
            ${config.showPhoneNumber ? `
            <button class="btn-call" onclick="callOwner()">
                <span>📞</span> 拨打车主电话
            </button>
            ` : ''}
        </div>

        <div class="footer">
            <p>即便短暂亦是打扰，感谢您的理解</p>
        </div>
    </div>
    
    <a href="/admin" class="admin-link">⚙️</a>

    <div id="notifyModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <span>通知详情</span>
                <button class="close-btn" onclick="closeModal()">×</button>
            </div>
            <div class="form-item">
                <label>您的联系方式 (选填)</label>
                <input type="text" id="contact" placeholder="手机号/微信号">
            </div>
            <div class="form-item">
                <label>留言内容 (选填)</label>
                <textarea id="message" rows="3" placeholder="例如：您的车挡住了路，请麻烦挪一下..."></textarea>
            </div>
            <div class="form-item">
                <label>通知渠道 (已开启)</label>
                <div class="channel-list" id="channelList">
                    <!-- Channels will be injected here -->
                </div>
            </div>
            <button class="btn-notify" onclick="sendNotification()" id="confirmBtn">
                <span>🚀</span> 确认发送
            </button>
        </div>
    </div>

    <div id="toast" class="toast"></div>

    <script>
        const phone = "${config.phoneNumber || ''}";
        const config = ${JSON.stringify(config)};
        const coolDownTime = 60 * 1000; 

        function showToast(msg) {
            const toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }

        function callOwner() {
            if(phone) window.location.href = "tel:" + phone;
            else showToast("未配置手机号");
        }

        function openModal() {
            const lastNotify = localStorage.getItem('lastNotifyTime');
            const now = Date.now();
            if (lastNotify && (now - lastNotify < coolDownTime)) {
                const remaining = Math.ceil((coolDownTime - (now - lastNotify)) / 1000);
                showToast("请等待 " + remaining + " 秒后再通知");
                return;
            }

            // Populate channels
            const list = document.getElementById('channelList');
            list.innerHTML = '';
            const channels = [
                { key: 'enableWxPusher', name: 'WxPusher', label: '微信推送' },
                { key: 'enableBark', name: 'Bark', label: 'Bark' },
                { key: 'enableTelegram', name: 'Telegram', label: 'Telegram' },
                { key: 'enableDingTalk', name: 'DingTalk', label: '钉钉' },
                { key: 'enableWeCom', name: 'WeCom', label: '企业微信' },
                { key: 'enableFeishu', name: 'Feishu', label: '飞书' },
                { key: 'enableServerChan', name: 'ServerChan', label: 'Server酱' }
            ];
            
            let hasEnabled = false;
            channels.forEach(c => {
                if (config[c.key]) {
                    hasEnabled = true;
                    const div = document.createElement('div');
                    div.className = 'channel-item';
                    div.innerHTML = \`<input type="checkbox" id="ch_\${c.name}" value="\${c.name}" checked> <label for="ch_\${c.name}">\${c.label}</label>\`;
                    div.onclick = function(e) {
                         if (e.target.tagName !== 'INPUT') {
                             const cb = this.querySelector('input');
                             cb.checked = !cb.checked;
                         }
                    };
                    list.appendChild(div);
                }
            });

            if (!hasEnabled) {
                list.innerHTML = '<span style="color:#999;font-size:13px;">暂无可用通知渠道</span>';
            }

            document.getElementById('notifyModal').classList.add('show');
        }

        function closeModal() {
            document.getElementById('notifyModal').classList.remove('show');
        }

        function sendNotification() {
            const btn = document.getElementById('confirmBtn');
            const contact = document.getElementById('contact').value;
            const message = document.getElementById('message').value;
            
            // Get selected channels
            const channels = [];
            document.querySelectorAll('#channelList input[type="checkbox"]:checked').forEach(cb => {
                channels.push(cb.value);
            });

            if (channels.length === 0) {
                showToast("请至少选择一个通知渠道");
                return;
            }

            btn.disabled = true;
            btn.innerHTML = "<span>⏳</span> 发送中...";

            fetch("/api/notify", { 
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contact, message, channels })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    closeModal();
                    showToast("✅ 通知已发送！");
                    localStorage.setItem('lastNotifyTime', Date.now());
                    // Clear inputs
                    document.getElementById('contact').value = '';
                    document.getElementById('message').value = '';
                } else {
                    showToast("❌ " + (data.message || "发送失败"));
                }
            })
            .catch(err => {
                showToast("❌ 网络错误");
                console.error(err);
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = "<span>🚀</span> 确认发送";
            });
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('notifyModal');
            if (event.target == modal) {
                closeModal();
            }
        }
    </script>
</body>
</html>
`;

export const ADMIN_HTML = (configStr) => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>挪车通知 - 配置后台</title>
    <style>
        :root { --primary: #2c3e50; --accent: #3498db; --bg: #ecf0f1; }
        body { font-family: sans-serif; background: var(--bg); padding: 20px; max-width: 800px; margin: 0 auto; color: #333; }
        .card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 20px; }
        h2 { border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 20px; color: var(--primary); font-size: 1.2rem; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 14px; color: #555; }
        input[type="text"], input[type="password"], input[type="email"], select, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        .checkbox-group { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; background: #f9f9f9; padding: 10px; border-radius: 4px; }
        .checkbox-group input { width: auto; }
        .checkbox-group label { margin: 0; cursor: pointer; }
        button { background: var(--accent); color: white; border: none; padding: 12px 25px; border-radius: 4px; cursor: pointer; font-size: 16px; transition: background 0.2s; }
        button:hover { background: #2980b9; }
        button.save { background: #27ae60; width: 100%; margin-top: 20px; }
        button.save:hover { background: #219150; }
        button.danger { background: #e74c3c; width: 100%; }
        button.danger:hover { background: #c0392b; }
        .logout { float: right; color: #e74c3c; text-decoration: none; font-size: 14px; }
        .section-desc { font-size: 12px; color: #888; margin-bottom: 10px; }
        hr { border: 0; border-top: 1px solid #eee; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="card">
        <a href="?logout" class="logout">退出登录</a>
        <h2>⚙️ 全局设置</h2>
        <form id="configForm">
            <div class="form-group">
                <label>车主手机号 (用于拨号功能)</label>
                <input type="text" name="phoneNumber" placeholder="13800138000">
            </div>
            <div class="checkbox-group">
                <input type="checkbox" id="showPhoneNumber" name="showPhoneNumber">
                <label for="showPhoneNumber">在首页显示"拨打车主电话"按钮</label>
            </div>
    </div>

    <div class="card">
        <h2>📢 通知渠道配置</h2>
        <p class="section-desc">勾选启用的渠道，并填写对应的配置信息。</p>

        <!-- WxPusher -->
        <div class="checkbox-group">
            <input type="checkbox" id="enableWxPusher" name="enableWxPusher">
            <label for="enableWxPusher">启用 WxPusher (微信推送)</label>
        </div>
        <div class="form-group" data-dep="enableWxPusher">
            <label>App Token</label>
            <input type="text" name="wxpusherAppToken" placeholder="AT_...">
        </div>
        <div class="form-group" data-dep="enableWxPusher">
            <label>UIDs (多个用英文逗号分隔)</label>
            <input type="text" name="wxpusherUids" placeholder="UID_...">
        </div>
        <hr>

        <!-- Bark -->
        <div class="checkbox-group">
            <input type="checkbox" id="enableBark" name="enableBark">
            <label for="enableBark">启用 Bark (iOS 推送)</label>
        </div>
        <div class="form-group" data-dep="enableBark">
            <label>Bark URL (例如 https://api.day.app/你的Key/)</label>
            <input type="text" name="barkUrl" placeholder="https://api.day.app/DxEz...">
        </div>
        <hr>

        <!-- Telegram -->
        <div class="checkbox-group">
            <input type="checkbox" id="enableTelegram" name="enableTelegram">
            <label for="enableTelegram">启用 Telegram Bot</label>
        </div>
        <div class="form-group" data-dep="enableTelegram">
            <label>Bot Token</label>
            <input type="text" name="tgBotToken" placeholder="123456:ABC-DEF...">
        </div>
        <div class="form-group" data-dep="enableTelegram">
            <label>Chat ID</label>
            <input type="text" name="tgChatId" placeholder="-100123456789">
        </div>
        <hr>

        <!-- 钉钉 -->
        <div class="checkbox-group">
            <input type="checkbox" id="enableDingTalk" name="enableDingTalk">
            <label for="enableDingTalk">启用 钉钉机器人</label>
        </div>
        <div class="form-group" data-dep="enableDingTalk">
            <label>Webhook 地址</label>
            <input type="text" name="dingTalkWebhook" placeholder="https://oapi.dingtalk.com/robot/send?access_token=...">
        </div>
        <hr>

        <!-- 企业微信 -->
        <div class="checkbox-group">
            <input type="checkbox" id="enableWeCom" name="enableWeCom">
            <label for="enableWeCom">启用 企业微信机器人</label>
        </div>
        <div class="form-group" data-dep="enableWeCom">
            <label>Webhook 地址</label>
            <input type="text" name="weComWebhook" placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...">
        </div>
        <hr>

        <!-- 飞书 -->
        <div class="checkbox-group">
            <input type="checkbox" id="enableFeishu" name="enableFeishu">
            <label for="enableFeishu">启用 飞书机器人</label>
        </div>
        <div class="form-group" data-dep="enableFeishu">
            <label>Webhook 地址</label>
            <input type="text" name="feishuWebhook" placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/...">
        </div>
        <hr>

        <!-- ServerChan -->
        <div class="checkbox-group">
            <input type="checkbox" id="enableServerChan" name="enableServerChan">
            <label for="enableServerChan">启用 Server酱 (Turbo)</label>
        </div>
        <div class="form-group" data-dep="enableServerChan">
            <label>SendKey</label>
            <input type="text" name="serverChanKey" placeholder="SCTxxxxx...">
        </div>
        
        <button type="button" class="save" onclick="saveConfig()">💾 保存配置</button>
        </form>
    </div>

    <div class="card">
        <h2>🔒 修改后台密码</h2>
        <div class="form-group">
            <label>新密码</label>
            <input type="password" id="newPassword" placeholder="输入新密码">
        </div>
        <button type="button" class="danger" onclick="changePassword()">修改密码</button>
    </div>

    <script>
        // 初始化表单数据
        const currentConfig = ${configStr};
        
        function init() {
            for (const key in currentConfig) {
                const el = document.getElementsByName(key)[0];
                if (el) {
                    if (el.type === 'checkbox') {
                        el.checked = currentConfig[key];
                    } else {
                        el.value = currentConfig[key] || '';
                    }
                }
            }
            toggleInputs();
        }

        // 简单的依赖显示/隐藏
        function toggleInputs() {
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                const name = cb.name;
                const deps = document.querySelectorAll('[data-dep="' + name + '"]');
                deps.forEach(div => {
                    div.style.display = cb.checked ? 'block' : 'none';
                });
            });
        }

        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', toggleInputs);
        });

        function saveConfig() {
            const formData = new FormData(document.getElementById('configForm'));
            const data = {};
            
            // 处理所有输入框
            document.querySelectorAll('#configForm input').forEach(input => {
                if (input.type === 'checkbox') {
                    data[input.name] = input.checked;
                } else {
                    data[input.name] = input.value;
                }
            });

            fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(res => {
                if(res.success) alert('保存成功！');
                else alert('保存失败: ' + res.message);
            })
            .catch(err => alert('错误: ' + err));
        }

        function changePassword() {
            const newPassword = document.getElementById('newPassword').value;
            if(!newPassword) {
                alert('请输入新密码');
                return;
            }
            if(!confirm('确定要修改密码吗？修改后需要重新登录。')) return;

            fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            })
            .then(res => res.json())
            .then(res => {
                if(res.success) {
                    alert('密码修改成功，请重新登录');
                    location.reload();
                } else {
                    alert('修改失败: ' + res.message);
                }
            })
            .catch(err => alert('错误: ' + err));
        }

        init();
    </script>
</body>
</html>
`;
