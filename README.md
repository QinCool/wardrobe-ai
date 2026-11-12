# 我的衣柜 · Wardrobe AI

[English](README.en.md)

**产品形态：聊天为前台，网站为后台。** 所有交互都在 Personal Agent 聊天里完成：加衣服、查尺码、每日穿搭、出差行李、天气提醒都直接问你的 AI 助手（Muse、豆包、DeepSeek 手机版等）。这个网站只做一件事：把衣柜可视化展示出来。

**在 Muse 上使用最适配**：Skill 原生跑在 Muse 聊天里，看板是 Muse 的 artifact 卡片、直接在聊天里打开，每日提醒走 Muse 的定时消息；其他 AI 也能用，给网站链接看同一块看板。

无后端、无账号、不用注册。数据只存在你自己的 Personal Agent 手里（Agent 能读到的衣柜 JSON 文件或存储），网站不持有数据；打开 `index.html` 就能用，也可以部署到 GitHub Pages。

> English summary: chat-first personal wardrobe. Ask your AI assistant for outfits, sizes and packing; the site is just the visual board. No backend, no account, data lives only in your own Personal Agent (the wardrobe JSON file your Agent can read); the site holds no data.

## 用法：直接在聊天里问

本项目配有一个 Skill（`skills/wardrobe-ai/`），把它装进你的 Personal Agent，就能在聊天里用：

- **看衣柜**：问“我的衣柜有哪些衣服”，用 Muse 时助手把衣柜展示成一个看板（Muse 的 artifact 看板卡片），直接在聊天里打开看；用其他 AI（豆包、DeepSeek、ChatGPT 等）时，助手直接给网站链接，你打开网页看同一块看板。
- **加衣服鞋子**：发购买截图或商品链接，或者口头说一声，助手去平台查官方尺码表，核对后写进衣柜。
- **买新衣服问尺码**：发商品链接或尺码表，助手拿你衣柜里合身单品的实测数据逐项对照，告诉你买哪个码。
- **每日穿搭**：每天早上助手直接在聊天里提醒你：今天天气、穿哪件、为什么。
- **出差 / 旅行**：说一声目的地和日期，助手按当地天气给每天穿搭 + 行李清单。

你不需要每天打开这个网站看提醒。网站只是衣柜的看板。

## 录入方式

网站上没有录入表单，录入走聊天里的 Skill：

1. **发购买截图**：把淘宝 / 京东 / 拼多多 / 抖音等订单截图或商品截图发给助手，截图里要有商品名或订单号。
2. **发商品链接**：直接粘贴商品链接。
3. **口头说一声**：告诉助手买了什么、什么码。

助手按这条链路录入：去对应平台找到商品页，查官方尺码表，取你买的那个码的数据，核对后写进衣柜。尺码只写实测数或官方尺码表上的数，没有的字段留空，不要估、不要编。尺码表是图片时，助手读出数字先给你确认再写。

网站页脚的「导入 JSON」是数据同步口：聊天里加了衣服后，让助手把最新的衣柜 JSON 发给你，导进来就能在看板上看到。

## 网站只做什么

- **衣柜看板**：按毛衣 / T恤 / 外套 / 衬衫 / 卫衣 / 裤子 / 鞋子分类筛选，每件带照片、尺码、合身备注；顶部速查条放身体数据（脚长、鞋码、裤腰、上衣常穿码）。
- **JSON 导入 / 导出**（页脚两个按钮）：把衣柜数据导进来看，或导出备份、换设备迁移。

网站只做展示，其他功能都在聊天里的 Skill 那边。

## 数据格式与同步接口

衣柜数据是一份 JSON，格式见 `data/example-wardrobe.json`。网站与 Skill 之间就用这份 JSON 同步，这是唯一的接口：

```json
{
  "app": "wardrobe-ai",
  "version": 1,
  "profile": {
    "footLength": "25.5",
    "pantsWaist": "82",
    "sizeCN": "255",
    "sizeUS": "7.5",
    "topSize": "L"
  },
  "items": [
    {
      "id": "example-1",
      "name": "示例针织毛衣",
      "category": "毛衣",
      "brand": "示例品牌",
      "price": "299",
      "priceCurrency": "CNY",
      "fit": "合身",
      "note": "版型宽松，秋冬常穿。",
      "photo": "",
      "measurements": { "length": "69", "chest": "120", "shoulder": "56", "sleeve": "84" }
    }
  ]
}
```

字段说明：

- `profile`：身体速查数据，脚长（cm）、长裤腰围（cm）、鞋子中国码 / 美国码、上衣常穿码。
- `items[].category`：毛衣 / T恤 / 外套 / 衬衫 / 卫衣 / 裤子 / 鞋子。
- `items[].measurements`：尺码，单位一律厘米；上衣是衣长 `length`、胸围 `chest`、肩宽 `shoulder`、袖长 `sleeve`（衬衫另有领围 `collar`）；裤子是腰围 `waist`、裤长 `pantsLength`、臀围 `hip`、大腿围 `thigh`、裤脚围 `hem`、上裆长 `rise`、下裆长 `inseam`；鞋子是脚长 `footLength` 与中国码 `sizeCN`、EU `sizeEU`、US `sizeUS`、UK `sizeUK`、JP `sizeJP`。
- `items[].photo`：照片 data URL 或空字符串；`priceCurrency` 不填时默认 CNY；没有的字段留空字符串，不要编数字。

同步方式：

- **网站 → 备份**：页脚点「导出 JSON」，下载 `wardrobe-backup-<日期>.json`。
- **聊天 → 网站**：让助手把最新的衣柜 JSON 发给你，页脚点「导入 JSON」导进来；导入前会提示先导出备份，导入会替换当前全部数据。
- 网站上没有其他接口，不调任何外部服务。

## 天气、日历、邮箱走 Agent 的权限

天气、日历、邮箱不再由网站接，改走你自己的 Personal Agent 已经接通的权限：

- 天气用 Agent 已接的天气服务（如彩云）。
- 日历用 Agent 已接的日历（Google 日历、Outlook 日历）。
- 邮箱用 Agent 已接的邮箱（Gmail、Outlook）。
- 行程识别也一样：能读日历和邮件就直接读，读不到再用粘贴订票文字或截图识别。

用 Skill 时，你不需要再为天气、日历、邮箱单独申请 Key 或注册 OAuth 应用：Agent 里有什么权限就用什么。Agent 没接的，助手会提示你去接，或者改用粘贴文字、截图识别这些不用权限的路子。

## 配置与调用都走 Agent

- 所有配置（城市、天气偏好、提醒时间、其他设置）都走 Skill，存在你自己的 Personal Agent 里，不存在网站、不存浏览器。网站没有任何配置项，不用在网站上设置任何东西；想改配置直接在聊天里跟 Agent 说一声。
- 所有调用（查天气、读日历、读邮箱、给尺码建议、给穿搭）也都由你自己的 AI 发起和执行，不走网站、不走第三方服务。
- 网站只做一件事：把衣柜可视化展示出来。

## 展示分两种：Muse 看板，其他 AI 给网站链接

- 用 Muse 时：助手把衣柜展示成一个看板（Muse 的 artifact 看板卡片），直接在聊天里打开看。
- 用其他 AI（豆包、DeepSeek、ChatGPT 等）时：助手直接给网站链接，你打开网页看同一块看板，链接就是 GitHub Pages 地址（`https://<你的用户名>.github.io/wardrobe-ai/`）。
- 两种展示看到的内容是一样的（同一套衣柜数据、同一套卡片信息），只是载体不同：Muse 有看板卡片，其他 AI 用网页看同一块看板。

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

- **数据只存在你自己的 Personal Agent 手里**（Agent 能读到的衣柜 JSON 文件或存储）；网站不持有数据，浏览器 localStorage 只是打开网站时用于展示的临时副本，换设备、清缓存就没了，网站本身不保存、不同步、不备份用户数据；Agent 与网站之间需要看板时，由你把 JSON 导进网站看，看完即走，数据归属不变。
- 照片存在本地 data URL；localStorage 一般上限约 5MB，照片很多时展示用的副本可能放不下，以 Agent 手里的 JSON 为准。
- **不要把真实个人信息提交到公开仓库**：示例数据（`data/example-wardrobe.json`）是占位内容；你自己的数据只留在你自己的 Personal Agent 手里和你自己的备份文件里。
- `.gitignore` 已排除 `.env`、以 `*-private.json` / `*-backup-*.json` 结尾的备份文件以及本地真实衣柜数据文件；导出的备份文件不要直接放进仓库。

## 目录结构

```
wardrobe-ai/
├── index.html                  # 展示页：衣柜看板
├── css/style.css               # 样式
├── js/
│   ├── store.js                # 展示缓存：localStorage、导入导出
│   └── app.js                  # 主逻辑：渲染、筛选
├── data/example-wardrobe.json  # 示例数据（占位）
├── skills/wardrobe-ai/         # Skill：聊天里的交互逻辑
│   ├── SKILL.md                # 聊天前台：展示、加衣服、尺码建议、穿搭提醒、出差行李
│   └── skill.yaml
├── README.md
├── README.en.md                # 英文版说明
├── LICENSE                     # MIT
└── .gitignore
```

## License

MIT，见 [LICENSE](LICENSE)。
