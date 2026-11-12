# 我的衣柜 · Wardrobe AI

[English](README.en.md)

一个静态的个人衣柜管理页：把衣服、裤子、鞋子的照片、尺码和合身情况记下来，买新衣服时让 AI 对照着给尺码建议，每天早上按天气和行程给你搭一套；支持国内与美国 / 国际购物网站。

无后端、无账号、不用注册。数据只存在你的浏览器（localStorage），打开 `index.html` 就能用，也可以部署到 GitHub Pages。

> English summary: a static personal wardrobe manager. Record clothes / pants / shoes with photos, measurements and fit notes; get AI size advice when shopping (domestic and US/international stores, inch/cm conversion, US/EU/UK/JP shoe sizes) and a daily outfit suggestion based on the weather and your schedule. No backend, no account, data stays in your browser (localStorage).

## 功能

- **衣柜看板**：按毛衣 / T恤 / 外套 / 衬衫 / 卫衣 / 裤子 / 鞋子分类筛选，每件带照片、尺码、合身备注；顶部速查条放身体数据（脚长、鞋码、裤腰、上衣常穿码）；尺寸显示可在厘米 / 英寸间切换。
- **添加单品**：应用内表单直接录入，填完即入库、即显示；照片上传后压缩存在本地，不依赖外链；价格支持 CNY / USD / EUR / GBP / JPY / KRW。
- **AI 辅助录入**：粘贴尺码表文字或商品链接，AI 解析成尺码字段自动填表，确认后再保存；解析失败时原文保留，可手动改。支持国内平台（淘宝 / 京东 / 拼多多 / 抖音）和美国 / 国际站点（Amazon / Nike / adidas / Uniqlo 美国站 / Gap 等）；国外尺码表常用英寸，解析时自动换算成厘米并注明原单位。
- **AI 尺码建议**：粘贴新商品的尺码表，AI 拿衣柜里同分类已合身单品的实测数据逐项对照，告诉你买哪个码，并提醒口径不明的地方（如胸围是半围还是全围）；可选国内 / 美国·国际来源，鞋子按脚长对照 US / EU / UK / JP 体系给建议。
- **鞋码换算**：按脚长查 US / EU / UK / JP 对照表（男款 / 女款），录入鞋子时也可一键按脚长自动填码。
- **每日穿搭**：按今天天气 + 今日行程从衣柜里搭一套。天气支持多数据源（默认 Open-Meteo 免费、无需 Key；也可配彩云 / OpenWeatherMap / 和风天气），城市留空时优先浏览器定位，定位失败手动输入城市；行程可手动选场合、粘贴文字、导入 .ics 日历或接 Google / Outlook 日历（只读）；查不到天气时可手动输入气温 / 是否下雨。
- **出差 / 旅行**：填目的地、出发 / 返回日期，按目的地未来天气和当地安排，给出每天穿搭 + 行李清单（只从衣柜里挑，尽量百搭少重复，逐件说明打包理由）；行程可从日历自动识别，也可粘贴订票文字、查航班号、上传截图识别，或从邮箱找订票确认生成。
- **邮箱找订票确认**：接 Gmail / Outlook 邮箱（只读）搜订票确认邮件，勾选后由 AI 提取行程；支持国内外机票、酒店、火车平台。
- **JSON 导入 / 导出**：一次录多件、备份、换设备迁移都在这里。
- **AI 设置**：支持任意 OpenAI 兼容接口，填自己的 Key 即可；预置 DeepSeek、OpenAI、Qwen、Kimi、GLM、Gemini、Muse。

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

## 国外 / 美国网站录入

国外站点的商品同样能录，流程和国内平台一样：粘贴商品链接或尺码表文字，让 AI 解析；解析失败就改粘贴文字，或把购买截图发给助手查官方尺码表。

### 支持的站点

| 站点 | 链接识别 | 备注 |
| --- | --- | --- |
| Amazon 美国（amazon.com） | ✅ | 商品页常需登录看完整尺码表 |
| Nike 美国（nike.com） | ✅ | 鞋码表分男/女款，以脚长为准 |
| adidas 美国（adidas.com） | ✅ | 同上 |
| Uniqlo 美国站（uniqlo.com） | ✅ | 美版尺码常比同标称的国内版偏大 |
| Gap / Old Navy（gap.com / oldnavy.com） | ✅ | 美版偏大是常态 |
| H&M、Zara、Nordstrom、Macy's、SSENSE、Farfetch、REI、lululemon | ✅ | 国际站通用 |

国内平台（淘宝 / 天猫 / 京东 / 拼多多 / 抖音 / 小红书 / 得物）同样支持。

### 英寸换算

- 美国站的尺码表常用英寸（inch），如胸围 22″、衣长 28″、裤腰 32″。
- AI 解析时会自动按 **1 英寸 = 2.54 厘米**换算成厘米存入，并在填表后注明原单位；页面顶部也可切换厘米 / 英寸显示，切换只改显示，库里存的厘米不变。
- 如果 AI 没认出单位（例如只写了数字没写单位），请在粘贴的文字里补一句“单位是英寸”再解析。

### 鞋码 US / EU / UK / JP 对照（男款，脚长为准）

| 脚长 cm | US | EU | UK | JP | 中国码 |
| --- | --- | --- | --- | --- | --- |
| 25.0 | 7 | 40 | 6.5 | 25 | 250 |
| 25.5 | 7.5 | 40.5 | 7 | 25.5 | 255 |
| 26.0 | 8 | 41 | 7.5 | 26 | 260 |
| 26.5 | 8.5 | 42 | 8 | 26.5 | 265 |
| 27.0 | 9 | 42.5 | 8.5 | 27 | 270 |
| 27.5 | 9.5 | 43 | 9 | 27.5 | 275 |
| 28.0 | 10 | 44 | 9.5 | 28 | 280 |

完整对照表（含女款、更多码段）在应用内「鞋码换算」里按脚长查询；录入鞋子时也可点「按脚长换算填码」自动填好五个码数字段。注意：各品牌鞋楦略有差异，同一脚长在不同品牌间常差半码，**最终以品牌官方尺码表为准**；JP 可写成厘米（25.5）或毫米（255）两种形式。

### 注意事项

- 美国站商品页同样多半需登录或防跨域，应用不一定能直接读取链接；读不到时改粘贴尺码表文字。
- 美版尺码常偏大：同一品牌、同一标称码，美国站的实际尺寸可能比国内版大一档，AI 给建议时会提醒以官方尺码表为准；买之前最好拿尺码表上的实测数和你衣柜里合身的那件逐项对照。
- 价格字段支持 USD 等币种，选币种后价格按对应符号显示；不做汇率换算。
- 海淘商品的退换货、尺码偏大等风险与尺码表本身无关，下单前请确认商家退换政策。

## 日历与行程

每日穿搭除了天气，还会结合你今天的行程：下午有正式会议就搭衬衫 + 外套，晚上要运动就选方便活动的鞋子。行程有四种给法，按方便程度任选：

### 1. 手动选场合 / 写行程文字（最简单）

在「今日穿搭」里选主要场合：上班 / 开会 / 运动 / 健身 / 正式场合 / 休闲 / 约会；或在行程文字框里自由写，例如“下午 3 点开会，晚上去健身”。不填也行，那就只按天气搭配。

### 2. 导入 .ics 日历文件

点「导入日历 .ics 文件」，选从手机 / 电脑日历 App 导出的 .ics 文件，应用会解析出今日的日程（时间、标题、地点），自动推断每条的场合类型，并在下方列出来；场合下拉也会自动填上第一条的场合。文件只在浏览器本地解析，不上传。

场合推断按标题关键词：会议 / 开会 → 开会；运动 / 健身 / 跑步 / 瑜伽 → 运动；面试 / 典礼 / 正式 → 正式场合；约会 / 聚餐 → 约会；上班 / 工作 → 上班；都对不上时按休闲处理。

### 3. Google 日历（只读，需自己配置）

步骤：

1. 打开 [Google Cloud Console](https://console.cloud.google.com/)，新建项目 → 启用 **Google Calendar API** → 创建凭据 → **OAuth 客户端 ID**（应用类型选 **Web 应用**）。
2. 在客户端的“已获授权的重定向 URI”里加上你的页面地址，例如部署到 GitHub Pages 后是 `https://<你的用户名>.github.io/wardrobe-ai/`。
3. 把 Client ID（形如 `xxx.apps.googleusercontent.com`）填进页面「Google 日历」一栏，点「连接 Google 日历」，在 Google 授权页同意只读日历权限。
4. 授权成功后跳回页面，之后点「今天穿什么」时会自动读取主日历的今日日程。

说明：

- 授权走 OAuth 授权码 + PKCE 流程，权限只有 `calendar.readonly`（只读日历）；token 与 refresh_token 只存浏览器 localStorage，点「断开」即删。
- API Key 方式只支持公开日历，读不到私人日程，所以这里不用 API Key，改走 OAuth。
- 需要页面跑在 http(s) 上（如 GitHub Pages 或本地 `python3 -m http.server`），直接用 file:// 打开时授权回调地址无效，连不上是正常的。

### 4. Outlook 日历（只读，需自己配置）

步骤：

1. 打开 [Azure 门户](https://portal.azure.com/) → 应用注册 → 新注册一个应用 → 身份验证 → 添加平台 → 选 **单一页面应用程序**，重定向 URI 填你的页面地址，例如部署到 GitHub Pages 后是 `https://<你的用户名>.github.io/wardrobe-ai/`。
2. API 权限 → 添加权限 → Microsoft Graph → 委托的权限 → 勾选 **Calendars.Read**（读日历；如同时要用邮箱找订票确认，再勾选 **Mail.Read**，与邮箱共用同一个应用）。
3. 复制 **应用程序（客户端）ID**，填进页面「Outlook 日历」一栏，点「连接 Outlook」，在 Microsoft 授权页同意只读日历权限。
4. 授权成功后跳回页面，之后点「今天穿什么」时会自动读取 Outlook 日历的今日日程；点「从日历识别出行」时也会从 Outlook 日历里找未来的出差 / 旅行。

说明：

- 授权走 OAuth 授权码 + PKCE 流程，权限只有 `Calendars.Read`（只读日历）；token 与 refresh_token 只存浏览器 localStorage，点「断开」即删。
- 需要页面跑在 http(s) 上（如 GitHub Pages 或本地 `python3 -m http.server`），直接用 file:// 打开时授权回调地址无效，连不上是正常的。

### 隐私

行程、日历事件、Google 凭证默认只存在浏览器 localStorage，不上传到任何服务器、不进仓库；换设备、清浏览器数据后需要重新导入或重新连接。

## 出差 / 旅行

在「出差 / 旅行」一节填一次出行，应用按目的地天气和当地安排，给出两类建议：

1. **目的地每天穿搭**：按目的地城市未来每天的天气（不是出发城市）+ 当地场合，从衣柜里每天搭一套，注明日期。
2. **行李清单**：从衣柜里挑出该带哪些衣服，考虑行程天数、目的地天气变化、当地场合，尽量多功能百搭、少带重复，并逐件说明打包理由（例如“这件外套三天都能穿，省一件行李空间”“这双鞋既能开会又能逛街”）。

### 使用方式

- **手动填**：目的地城市、出发日期、返回日期必填；当地场合（上班 / 开会 / 运动 / 正式 / 休闲 / 观光 / 约会）和行程说明可选，填了搭配更贴合。
- **从日历识别出行**：点「从日历识别出行」，应用会从已导入的 .ics 日历和已连接的 Google 日历里找未来的出差 / 旅行，自动填好日期和目的地。识别规则：跨 2 个自然日及以上的日程，或标题 / 地点 / 备注含“出差、旅行、旅游、度假、trip、travel”等词的事件；地点字段当作目的地城市；已结束的行程跳过；有多个时填最近的一次。

### 天气与范围

- 目的地天气按「天气设置」里选的数据源查（默认 Open-Meteo），从出发日起连续多日的预报（最高 / 最低温、降水概率、天气状况）。
- 各源预报天数不同：Open-Meteo 最多未来 16 天、和风天气 7 天、OpenWeatherMap 5 天，彩云按返回天数；如果出行日期超出所选源的预报范围，应用会提示临近出发再查；行程本身最长支持 30 天，超出预报天数的部分请按当地季节气候估算。
- 目的地城市请只写城市名（如“上海”“Tokyo”），不要带区县或场馆名，否则可能查不到。

### 手动输入兜底

日历里没有行程、或识别不到时，直接手动填目的地和日期即可；天气查不到时，点「生成」会提示换个城市写法或稍后重试，不影响其他功能。

## 出差 / 旅行：行程来源

除了手动填目的地和日期，行程还可以从下面这些来源生成；所有来源统一生成同一个行程对象（目的地、出发/返回日期、交通、住宿、备注），再进入已有的出差 / 旅行流程（目的地天气 + 每天穿搭 + 行李清单）。

| 来源 | 怎么用 | 备注 |
| --- | --- | --- |
| 手动填写 | 在「出差 / 旅行」一节填目的地、出发/返回日期 | 最稳 |
| 日历识别 | 点「从日历识别出行」，从 .ics / Google 日历 / Outlook 日历里找多日行程 | 见「日历与行程」 |
| 粘贴订票文字 | 在「从订票信息生成行程」里粘贴携程、飞猪、12306、航司 App、Skyscanner、Expedia、Booking.com 等的订单确认短信或邮件文字，点「AI 提取行程」 | 不接任何接口，哪个平台都行；提取不到的字段留空，提取错的请手动改 |
| 航班号查询 | 填航班号（如 CA1831、BA249、UA857）+ AviationStack Key，点「查航班」 | 免费档每月 100 次，Key 去 aviationstack.com 申请；免费档只支持 HTTP，从 HTTPS 页面（GitHub Pages）访问会被浏览器拦截，请改本地 http://localhost 打开，或改粘贴文字 / 截图识别；一般只查得到近期 / 当日航班 |
| 截图识别 | 上传 12306、航旅纵横、携程、Skyscanner、Expedia 等订单截图，点「AI 识别截图并生成行程」 | 需要支持 vision 的 AI 模型（如 GPT-4o、Gemini）；模型不支持时会明确提示改粘贴文字 |
| 邮箱找订票确认 | 见下一节「邮箱找订票确认」 | Gmail / Outlook，只读 |

注意：国内外订票平台大多没有面向个人的公开 API，所以邮箱、粘贴文字、截图这三条是主路子；本应用不直连任何订票平台的账号、不保存账号密码、不假装能直连这些平台。

## 邮箱找订票确认

在「邮箱找订票确认」一节接 Gmail 或 Outlook 邮箱（只读），按关键词搜近 90 天的订票确认邮件，列出候选，勾选后由 AI 提取行程。不想接邮箱时，直接用「粘贴订票文字」或「截图识别」代替。

### 支持的平台（发件人关键词）

- **机票**：携程、飞猪、12306、中国国航、南方航空、东方航空、海南航空、厦门航空、Skyscanner、Expedia、Kayak、Google Flights、Trip.com、CheapOair
- **酒店**：Booking.com、Agoda、Expedia、Hotels.com、Airbnb、Hostelworld、携程、飞猪
- **火车**：12306、Trainline、Amtrak、Eurail、Deutsche Bahn（德国铁路）
- **综合**：Trip.com（携程国际版）、MakeMyTrip

搜索关键词：机票、酒店、行程单、flight、hotel、booking、itinerary、confirmation；发件域名在上面列表里的候选排前面，不在列表里的也会列出。

### Gmail（只读）

步骤：

1. 打开 [Google Cloud Console](https://console.cloud.google.com/)，新建项目 → 启用 **Gmail API** → 创建凭据 → **OAuth 客户端 ID**（应用类型选 **Web 应用**）。
2. 在客户端的“已获授权的重定向 URI”里加上你的页面地址，例如部署到 GitHub Pages 后是 `https://<你的用户名>.github.io/wardrobe-ai/`。
3. 把 Client ID 填进页面「Gmail」一栏，点「连接 Gmail」，在 Google 授权页同意只读邮件权限（`gmail.readonly`）。
4. 点「搜订票确认邮件」，勾选要用的邮件，点「AI 提取选中邮件的行程」，核对后生成行程。

说明：授权走 OAuth 授权码 + PKCE 流程，权限只有 `gmail.readonly`（只读邮件）；token 与 refresh_token 只存浏览器 localStorage，点「断开」即删；不改、不删任何邮件。

### Outlook 邮箱（只读，Microsoft Graph，与 Outlook 日历共用授权）

步骤：

1. 打开 [Azure 门户](https://portal.azure.com/) → 应用注册 → 新注册一个应用 → 身份验证 → 添加平台 → 选 **单一页面应用程序**，重定向 URI 填你的页面地址，例如 `https://<你的用户名>.github.io/wardrobe-ai/`。
2. API 权限 → 添加权限 → Microsoft Graph → 委托的权限 → 勾选 **Mail.Read**（读邮件）与 **Calendars.Read**（读日历）→ 授予管理员同意（个人账号一般直接可用）。
3. 复制 **应用程序（客户端）ID**，填进页面「Outlook 日历」一栏（邮箱与日历共用这一个 ID），点「连接 Outlook」授权。
4. 在「Outlook 邮箱」一节里点「搜订票确认邮件」，勾选后点「AI 提取选中邮件的行程」。

说明：授权走 OAuth 授权码 + PKCE 流程；token 与 refresh_token 只存浏览器 localStorage，点「断开」即删；不改、不删任何邮件。需要页面跑在 http(s) 上，直接用 file:// 打开时授权回调无效。

### 隐私与兜底

- 只读权限：不改、不删邮件；邮件内容只在浏览器本地处理，不上传、不进仓库。
- 邮箱接不上或搜不到时，提示会告诉你改用粘贴订票文字或截图识别。

## AI 设置

在页面底部「AI 设置」里配置，Key 只存在你浏览器的 localStorage，**不会上传、不会进仓库**：

| 服务商 | Base URL | 模型名 | Key 去哪申请 |
| --- | --- | --- | --- |
| 自定义 OpenAI 兼容接口 | 服务商给的地址 | 服务商给的模型名 | 各服务商官网 |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` | platform.deepseek.com |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini`（可改成 `gpt-4o`） | platform.openai.com |
| Qwen 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` | 阿里云百炼控制台（bailian.console.aliyun.com） |
| Kimi / Moonshot | `https://api.moonshot.cn/v1` | `kimi-k3.1-pro` | platform.moonshot.cn |
| GLM 智谱 | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-plus` | open.bigmodel.cn |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-2.5-flash` | Google AI Studio（aistudio.google.com） |
| Muse（Meta Model API） | `https://api.meta.ai/v1` | `muse-spark-1.3` | dev.meta.ai |

说明：

- 选预置后 Base URL 与模型名会自动填好，你只需要粘贴自己的 Key，点「保存设置」再点「测试连接」。
- Kimi 说明：K2 系列将于 2026 年底退役，新用户请用 `kimi-k3.1-pro`（当前官方推荐）；海外用户可用 `https://api.moonshot.ai/v1`。`moonshot-v1` 系列已退役，不要再填。
- Gemini 说明：走 Google 的 OpenAI 兼容端点（`/v1beta/openai/`），不是原生 Gemini API 地址；模型名以 Google AI Studio 页面为准。
- Muse 说明：Muse 没有独立的「Muse API」产品，调用走 Meta 的 Model API（`https://api.meta.ai/v1`），接口与 OpenAI Chat Completions 兼容，模型为 `muse-spark-1.3`。Key 开通可能有地区与审核要求，以 dev.meta.ai 官方页面为准。
- **Claude 不支持直连**：Anthropic Claude 官方 API 不是 OpenAI 兼容格式，不能直接填进本应用；如需用 Claude，请经支持 OpenAI 兼容格式的中转服务，再选「自定义 OpenAI 兼容接口」填中转地址。
- 若暂无某个服务商的 Key，用其他预置即可，尺码建议、穿搭、辅助录入的功能完全一样。
- 配好后点「测试连接」验证，成功再使用。

## 天气

每日穿搭与出差预报的天气支持多数据源，在页面「天气设置」里切换；Key 只存浏览器 localStorage，不会上传、不进仓库。

| 数据源 | 是否需要 Key | Key 去哪申请 | 预报天数 | 备注 |
| --- | --- | --- | --- | --- |
| Open-Meteo（默认） | 不需要 | — | 最多未来 16 天 | 免费，默认源 |
| 彩云天气 Caiyun | 需要 | caiyunapp.com（彩云开放平台） | 按返回天数 | 实时 + 逐日预报 |
| OpenWeatherMap | 需要 | openweathermap.org | 最多未来 5 天 | 免费套餐 5 日预报 |
| 和风天气 QWeather | 需要 | qweather.com（和风天气开发平台） | 最多未来 7 天 | 不含逐日降水概率 |

### 定位回退链

天气按这个顺序拿位置与数据，每一步失败都会明确提示，不会静默失败：

1. **用你配的天气源**：在「天气设置」里选了数据源且填了 Key，就用该源查天气。
2. **没配 Key → 回退 Open-Meteo**：所选源未配 Key 或请求失败时，自动回退到 Open-Meteo（免 Key），并在结果里注明“已回退”。
3. **城市留空 → 浏览器定位**：城市框留空时优先用浏览器定位（navigator.geolocation）拿经纬度，再调 Open-Meteo；定位要你授权，被拒、超时或不可用时会明确提示（例如“定位被拒绝，已切换为手动输入城市”），请手动输入城市名。
4. **手动输入城市**：在城市框填城市名，应用用 Open-Meteo 的 geocoding 接口（免 Key）转经纬度再查天气；城市请只写城市名，不要带区县或场馆名。
5. **还查不到 → 手动输入天气**：勾选「手动输入天气」填气温和有无雨即可。

### 各源说明

- 彩云天气：API 为 `api.caiyunapp.com/v2.6/{key}/{lng},{lat}/realtime.json`（实时）与 `/daily.json`（逐日）；逐日预报含最高/最低温、降水概率、天气状况（skycon 换算成中文）。
- OpenWeatherMap：用 5 日预报接口（`api.openweathermap.org/data/2.5/forecast`）按日汇总最高/最低温、最大降水概率与最常见天气状况；超过 5 天的部分查不到，界面会提示。
- 和风天气：用 7 日预报接口（`api.qweather.com/v7/weather/7d`）；不提供逐日降水概率，该字段显示为空。
- 所有源统一换算成“最高/最低温、降水概率、天气状况”再交给穿搭逻辑；各源返回字段不同时，以该源实际返回的为准。

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
│   ├── units.js                # 单位换算：英寸/厘米、鞋码 US/EU/UK/JP 对照、币种、站点识别
│   ├── calendar.js             # 日历：.ics 解析、场合推断、Google 日历 OAuth（只读）
│   ├── ai.js                   # AI 客户端：OpenAI 兼容调用、服务商预置、测试连接
│   ├── weather.js              # 天气：Open-Meteo / 彩云 / OpenWeatherMap / 和风天气，多数据源与回退链
│   ├── trip.js                 # 出差行程来源：粘贴订票文字、航班号查询、截图识别
│   ├── mail.js                 # 邮箱：Gmail / Outlook 邮件搜索、Outlook 日历（只读 OAuth）
│   └── app.js                  # 主逻辑：渲染、录入、AI 解析、尺码建议、穿搭
├── data/example-wardrobe.json  # 示例数据（占位）
├── README.md
├── README.en.md                # 英文版说明
├── LICENSE                     # MIT
└── .gitignore
```

## License

MIT，见 [LICENSE](LICENSE)。
