# 我的衣柜 · Wardrobe AI

一个静态的个人衣柜管理页：把衣服、裤子、鞋子的照片、尺码和合身情况记下来，买新衣服时让 AI 对照着给尺码建议，每天早上按天气给你搭一套。

无后端、无账号、不用注册。数据只存在你的浏览器（localStorage），打开 `index.html` 就能用，也可以部署到 GitHub Pages。

> English summary: a static personal wardrobe manager. Record clothes / pants / shoes with photos, measurements and fit notes; get AI size advice when shopping and a daily outfit suggestion based on the weather. No backend, no account, data stays in your browser (localStorage).

## 功能

- **衣柜看板**：按毛衣 / T恤 / 外套 / 衬衫 / 卫衣 / 裤子 / 鞋子分类筛选，每件带照片、尺码、合身备注；顶部速查条放身体数据（脚长、鞋码、裤腰、上衣常穿码）。
- **添加单品**：应用内表单直接录入，填完即入库、即显示；照片上传后压缩存在本地，不依赖外链。
- **AI 辅助录入**：粘贴尺码表文字或商品链接，AI 解析成尺码字段自动填表，确认后再保存；解析失败时原文保留，可手动改。
- **AI 尺码建议**：粘贴新商品的尺码表，AI 拿衣柜里同分类已合身单品的实测数据逐项对照，告诉你买哪个码，并提醒口径不明的地方（如胸围是半围还是全围）。
- **每日穿搭**：按今天天气从衣柜里搭一套。天气默认走 Open-Meteo（免费、无需 Key）；查不到时可手动输入气温 / 是否下雨。
- **JSON 导入 / 导出**：一次录多件、备份、换设备迁移都在这里。
- **AI 设置**：支持任意 OpenAI 兼容接口，填自己的 Key 即可；预置 DeepSeek 和 Muse（Meta Model API）。

## 录入方式

### 1. 手动录入（最稳）

打开「添加单品」，填名称、分类、上传照片、按字段填尺码、写合身备注，点保存，立即显示在衣柜里。尺码只写实测数或官方尺码表上的数，没有的字段留空，不要估、不要编。

### 2. AI 辅助录入：粘贴尺码表文字

在「添加单品」里展开「AI 辅助录入」，把商品页里的尺码表文字粘贴进去，点「AI 解析并填表」，AI 会把数字填到对应的尺码字段里。**保存前请逐项核对**，拿不准的字段 AI 会留空。

### 3. AI 辅助录入：粘贴商品链接

同样在「AI 辅助录入」里粘贴淘宝 / 京东 / 拼多多 / 抖音等商品链接，应用会先尝试直接读取该商品页；多数电商页需登录或防跨域，读不到时会提示你改粘贴尺码表文字。

### 4. 截图 → 平台查尺码表 → 自动填数（助手协助链路）

买完衣服后，你发购买截图（淘宝 / 京东 / 拼多多 / 抖音等订单截图或商品截图）给助手，助手按下面这条链路帮你录入：

1. 从截图里认出商品名、订单号或商品链接；
2. 去对应平台找到商品页，查官方尺码表；
3. 把尺码表上的数字填进衣柜对应单品，保存前由你确认。

注意：

- 部分平台商品页需登录才能看完整尺码表，助手看不到时会直接说、请你补发尺码表截图或文字；
- 尺码表经常是图片，图片上的数字需要人工再核对一遍，不要只信 OCR / AI 的一次识别；
- 不同平台、不同店铺的同款商品尺码表可能不一样，以你下单那家店铺页面上的表为准；
- 订单号只用来定位商品，不要把订单号、收货地址等个人信息发到公开场合。

### 5. 批量导入 JSON

点顶部「导入 JSON」，按 `data/example-wardrobe.json` 的格式准备文件（`{ profile, items: [...] }`），一次导入多件。导入前会提示先导出备份。

## AI 设置

在页面底部「AI 设置」里配置，Key 只存在你浏览器的 localStorage，**不会上传、不会进仓库**：

| 服务商 | Base URL | 模型名 | Key 去哪申请 |
| --- | --- | --- | --- |
| 自定义 OpenAI 兼容接口 | 服务商给的地址 | 服务商给的模型名 | 各服务商官网 |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` | platform.deepseek.com |
| Muse（Meta Model API） | `https://api.meta.ai/v1` | `muse-spark-1.3` | dev.meta.ai |

说明：

- Muse 没有独立的「Muse API」产品，调用走 Meta 的 Model API（`https://api.meta.ai/v1`），接口与 OpenAI Chat Completions 兼容，模型为 `muse-spark-1.3`。Key 开通可能有地区与审核要求，以 dev.meta.ai 官方页面为准。
- 若暂无 Muse Key，用 DeepSeek 或其他 OpenAI 兼容接口即可，尺码建议、穿搭、辅助录入的功能完全一样。
- 配好后点「测试连接」验证，成功再使用。

## 天气

每日穿搭的天气默认调用 Open-Meteo（`open-meteo.com`，免费、无需 Key）：先按城市名查经纬度，再取当日最高 / 最低温、降水概率和天气状况。网络不通或查不到城市时，勾选「手动输入天气」填气温和有无雨即可。

## 本地运行 / 部署

```bash
# 直接打开
open index.html

# 或起一个静态服务器
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

GitHub Pages：仓库 Settings → Pages → Branch 选 `main`、目录选 `/ (root)`，保存后访问 `https://<你的用户名>.github.io/wardrobe-ai/`。

## 数据与隐私

- 所有数据（衣物、照片、身体数据、AI Key）默认只存在浏览器 localStorage，不上传到任何服务器。
- 照片上传后会压缩成 JPEG data URL 存在本地；localStorage 一般上限约 5MB，照片很多时建议定期用「导出 JSON」备份，必要时清理不用的照片。
- **不要把真实个人信息提交到公开仓库**：示例数据（`data/example-wardrobe.json`）是占位内容；你自己的数据只留在本地浏览器和你自己的备份文件里。
- `.gitignore` 已排除 `.env`、以 `*-private.json` / `*-backup-*.json` 结尾的备份文件；导出的备份文件不要直接放进仓库。

## 目录结构

```
wardrobe-ai/
├── index.html                  # 页面
├── css/style.css               # 样式
├── js/
│   ├── store.js                # 数据层：localStorage、导入导出、图片压缩
│   ├── ai.js                   # AI 客户端：OpenAI 兼容调用、服务商预置、测试连接
│   ├── weather.js              # 天气：Open-Meteo
│   └── app.js                  # 主逻辑：渲染、录入、尺码建议、穿搭
├── data/example-wardrobe.json  # 示例数据（占位）
├── README.md
├── LICENSE                     # MIT
└── .gitignore
```

## License

MIT，见 [LICENSE](LICENSE)。
