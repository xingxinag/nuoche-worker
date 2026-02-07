# 🚗 全能挪车通知系统 (Cloudflare Workers 版)

这是一个运行在 Cloudflare Workers 上的无服务器挪车通知系统。相比原版，本版本进行了全面的重构和升级，支持多渠道通知、留言功能、可视化管理后台以及双重配置存储。

## ✨ 功能特性

*   **多渠道通知**：
    *   微信推送 (WxPusher)
    *   Server酱 (Turbo) **(新增)**
    *   钉钉机器人 (DingTalk)
    *   企业微信机器人 (WeCom)
    *   飞书机器人 (Feishu)
    *   Telegram Bot
    *   Bark (iOS 推送)
    *   直接拨打电话
*   **一键通知与留言**：
    *   点击“一键通知车主挪车”后，支持填写**联系方式**和**留言内容**。
    *   自动显示当前已启用的通知渠道，并支持手动勾选/取消。
*   **可视化管理后台**：无需修改代码，直接在网页上配置开关和参数。
    *   **全局配置**：管理后台可配置所有参数。
    *   **密码修改**：直接在后台修改管理员登录密码。
*   **双重配置机制**：
    *   **环境变量**：作为系统初始默认值。
    *   **KV 存储**：通过管理后台实时保存，优先级高于环境变量。
*   **安全与隐私**：
    *   前端按钮冷却限制（默认 60 秒）。
    *   管理后台 Basic Auth 密码保护。
    *   核心配置隐藏在服务器端。
    *   首页右下角隐藏式后台入口（点击 ⚙️ 图标）。

## 🛠️ 部署指南

### 前置条件
1.  拥有一个 Cloudflare 账号。
2.  安装 Node.js 和 npm。
3.  安装 Wrangler (Cloudflare 的 CLI 工具):
    ```bash
    npm install -g wrangler
    ```
4.  登录 Wrangler:
    ```bash
    wrangler login
    ```

### 步骤 1: 初始化 KV 存储

本系统使用 Cloudflare KV 来保存你在管理后台的配置。

1.  在项目根目录下运行以下命令创建 KV 命名空间：
    ```bash
    npx wrangler kv:namespace create nuoche-1
    ```
    *你也可以去 Cloudflare 网页控制台 -> Workers & Pages -> KV -> 创建命名空间*

2.  命令执行后，你会看到类似如下的输出：
    ```toml
    [[kv_namespaces]]
    binding = "nuoche-1"
    id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    ```

3.  复制上面的输出内容，**替换** `wrangler.toml` 文件中对应的 `[[kv_namespaces]]` 部分。

### 步骤 2: 设置初始管理员密码

为了安全起见，进入管理后台需要密码。

1.  打开 `wrangler.toml`。
2.  找到 `[vars]` 部分。
3.  修改 `ADMIN_PASSWORD` 的值为你自己设定的初始强密码。
    *部署后，你可以在管理后台修改此密码，修改后将优先使用新密码。*

### 步骤 3: 部署到 Cloudflare

运行以下命令将代码发布到 Cloudflare Workers：

```bash
npx wrangler deploy
```

部署成功后，你会获得一个访问链接，例如：`https://nuoche-worker.你的子域名.workers.dev`

## ⚙️ 配置说明

### 访问管理后台

1.  在浏览器访问：`https://你的域名/admin`
2.  或者点击首页右下角的 ⚙️ 图标。
3.  输入用户名: `admin`
4.  输入密码: (你在 `wrangler.toml` 中设置的初始密码，或在后台修改后的新密码)

### 渠道配置教程

#### 1. WxPusher (微信)
*   官网: [wxpusher.zjiecode.com](https://wxpusher.zjiecode.com)
*   创建一个应用，获取 **AppToken**。
*   关注应用，在用户列表获取你的 **UID**。

#### 2. Server酱 (Turbo)
*   官网: [sct.ftqq.com](https://sct.ftqq.com)
*   登录后获取 **SendKey**。

#### 3. Bark (iOS)
*   App Store 下载 Bark App。
*   App 内获取服务器地址，例如 `https://api.day.app/你的Key/`。

#### 4. 钉钉机器人
*   钉钉群 -> 智能群助手 -> 添加机器人 -> 自定义。
*   安全设置选择"自定义关键词"，填入 `挪车`。
*   复制 Webhook 地址。

#### 5. 企业微信机器人
*   企业微信群 -> 添加群机器人。
*   复制 Webhook 地址。

#### 6. 飞书机器人
*   飞书群 -> 设置 -> 群机器人 -> 添加机器人 -> 自定义机器人。
*   复制 Webhook 地址。

#### 7. Telegram Bot
*   找 [@BotFather](https://t.me/BotFather) 创建机器，获取 **Token**。
*   找 [@userinfobot](https://t.me/userinfobot) 获取你的 **Chat ID**。

## 📱 使用方法

1.  **生成二维码**：将部署后的首页链接（如 `https://nuoche-worker.xxx.workers.dev`）生成二维码。
2.  **粘贴**：打印二维码贴在车窗前。
3.  **挪车**：
    *   路人扫码。
    *   点击"一键通知车主挪车"。
    *   （可选）填写联系方式和留言。
    *   勾选通知渠道（默认全选）。
    *   点击发送，你配置的所有渠道都会收到包含留言的消息。

## ⚠️ 注意事项

*   **自定义域名**：Cloudflare 默认的 `workers.dev` 域名在国内部分地区无法访问，强烈建议在 Cloudflare 后台绑定一个你自己的自定义域名。
*   **KV 生效时间**：KV 存储理论上有极短的最终一致性延迟，但通常是毫秒级的。
