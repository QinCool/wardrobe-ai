[中文](README.md)

# My Wardrobe · Wardrobe AI

A static personal wardrobe manager: record your clothes, pants, and shoes with photos, measurements, and fit notes; get AI size advice when buying new clothes, and a daily outfit suggestion each morning based on the weather and your schedule. Supports both domestic (Chinese) and US / international shopping sites.

No backend, no account, no sign-up. All data lives in your browser (localStorage). Open `index.html` and it works, or deploy it to GitHub Pages.

> 中文摘要：一个静态的个人衣柜管理页：把衣服、裤子、鞋子的照片、尺码和合身情况记下来，买新衣服时让 AI 对照着给尺码建议，每天早上按天气和行程给你搭一套；支持国内与美国 / 国际购物网站。无后端、无账号、不用注册，数据只存在你的浏览器（localStorage）。

## Features

- **Wardrobe board**: filter by sweater / T-shirt / jacket / shirt / hoodie / pants / shoes. Each item has a photo, measurements, and fit notes; the quick-reference bar at the top holds your body data (foot length, shoe size, pants waist, usual top size). Display units can switch between centimeters and inches.
- **Add items**: an in-app form — fill it in and the item is saved and shown immediately. Uploaded photos are compressed and stored locally, no external links. Prices support CNY / USD / EUR / GBP / JPY / KRW.
- **AI-assisted entry**: paste size-chart text or a product link and the AI parses it into the size fields automatically; review and save. If parsing fails, the original text is kept so you can edit it manually. Supports domestic Chinese platforms (Taobao / JD.com / Pinduoduo / Douyin) and US / international sites (Amazon / Nike / adidas / Uniqlo US / Gap, and more). Overseas size charts are often in inches — the AI converts them to centimeters automatically and notes the original unit.
- **AI size advice**: paste a new product's size chart and the AI compares it, measurement by measurement, against well-fitting items of the same category in your wardrobe, tells you which size to buy, and flags ambiguous conventions (e.g. whether a chest measurement is half-circumference or full circumference). You can choose a domestic or US/international source; for shoes it recommends across the US / EU / UK / JP systems based on foot length.
- **Shoe-size converter**: look up the US / EU / UK / JP conversion table (men's / women's) by foot length; when adding shoes you can also auto-fill all five size fields from your foot length with one click.
- **Daily outfit**: picks an outfit from your wardrobe based on today's weather **and** today's schedule. Weather comes from Open-Meteo by default (free, no API key needed). Schedule can be picked by occasion, pasted as text, imported from an .ics calendar file, or read from Google Calendar (read-only). If the weather can't be fetched, you can enter the temperature and whether it's raining manually.
- **Business trips / travel**: enter a destination and departure / return dates and get a daily outfit for each day at the destination (based on local weather and plans) plus a packing list — picked only from your wardrobe, favoring versatile pieces with minimal duplication, with a packing reason given for each item. Trips can also be detected automatically from your calendar.
- **JSON import / export**: add many items at once, back up, or migrate to another device.
- **AI settings**: works with any OpenAI-compatible API — just paste your own key. Presets for DeepSeek, OpenAI, Qwen, Kimi, GLM, Gemini, and Muse.

## How to add items

### 1. Manual entry (most reliable)

Open "Add item", fill in the name, category, upload a photo, enter measurements field by field, add fit notes, and save — the item appears in your wardrobe immediately. Only enter measured numbers or numbers from the official size chart. Leave fields blank when you don't have the data — don't estimate, don't make numbers up.

### 2. AI-assisted entry: paste size-chart text

In "Add item", expand "AI-assisted entry", paste the size-chart text from the product page, and click "Parse with AI and fill the form". The AI fills the numbers into the matching size fields. **Check every field before saving** — fields the AI is unsure about are left blank.

### 3. AI-assisted entry: paste a product link

In the same "AI-assisted entry" section, paste a product link from Taobao / JD.com / Pinduoduo / Douyin, etc. The app first tries to read the product page directly; most shopping pages require login or block cross-origin reads, in which case it will prompt you to paste the size-chart text instead.

### 4. Screenshot → look up the size chart on the platform → auto-fill (assistant-assisted flow)

After buying clothes, send your purchase screenshot (an order screenshot or product screenshot from Taobao / JD.com / Pinduoduo / Douyin, etc.) to the assistant, who follows this flow to enter it for you:

1. Identify the product name, order number, or product link from the screenshot;
2. Find the product page on the corresponding platform and check the official size chart;
3. Fill the numbers from the size chart into the matching wardrobe item, with you confirming before saving.

Notes:

- Some platform product pages require login to see the full size chart. If the assistant can't see it, they'll say so and ask you to send a screenshot or the text of the size chart.
- Size charts are often images — numbers in images need a second manual check; don't rely on a single OCR / AI read.
- The same product can have different size charts across platforms and shops — use the chart from the shop you actually ordered from.
- Order numbers are only used to locate the product. Don't post order numbers, delivery addresses, or other personal information in public.

### 5. Bulk JSON import

Click "Import JSON" at the top and prepare a file in the format of `data/example-wardrobe.json` (`{ profile, items: [...] }`) to import many items at once. You'll be prompted to export a backup first.

## US / international store entry

Products from overseas stores can be entered the same way as domestic ones: paste the product link or the size-chart text and let the AI parse it; if parsing fails, paste the text instead, or send the purchase screenshot to the assistant to look up the official size chart.

### Supported stores

| Store | Link recognition | Notes |
| --- | --- | --- |
| Amazon US (amazon.com) | ✅ | Product pages often require login for the full size chart |
| Nike US (nike.com) | ✅ | Shoe size charts differ for men / women — foot length is the reference |
| adidas US (adidas.com) | ✅ | Same as above |
| Uniqlo US (uniqlo.com) | ✅ | US sizes often run larger than the same nominal size in the domestic version |
| Gap / Old Navy (gap.com / oldnavy.com) | ✅ | US sizes running large is the norm |
| H&M, Zara, Nordstrom, Macy's, SSENSE, Farfetch, REI, lululemon | ✅ | International stores, general support |

Domestic Chinese platforms (Taobao / Tmall / JD.com / Pinduoduo / Douyin / Xiaohongshu / Dewu) are supported as well.

### Inch conversion

- US size charts commonly use inches, e.g. chest 22″, length 28″, waist 32″.
- The AI converts inches to centimeters automatically at **1 inch = 2.54 cm** when parsing, stores centimeters, and notes the original unit after filling the form. You can also switch the page display between cm and inches at the top — switching only changes the display; the stored values stay in centimeters.
- If the AI doesn't recognize the unit (e.g. the pasted text has bare numbers with no unit), add a line like "units are inches" to the pasted text and parse again.

### Shoe sizes US / EU / UK / JP (men's, by foot length)

| Foot length (cm) | US | EU | UK | JP | CN |
| --- | --- | --- | --- | --- | --- |
| 25.0 | 7 | 40 | 6.5 | 25 | 250 |
| 25.5 | 7.5 | 40.5 | 7 | 25.5 | 255 |
| 26.0 | 8 | 41 | 7.5 | 26 | 260 |
| 26.5 | 8.5 | 42 | 8 | 26.5 | 265 |
| 27.0 | 9 | 42.5 | 8.5 | 27 | 270 |
| 27.5 | 9.5 | 43 | 9 | 27.5 | 275 |
| 28.0 | 10 | 44 | 9.5 | 28 | 280 |

The full table (including women's sizes and more size ranges) is in the app's "Shoe-size converter", where you can query by foot length. When adding shoes you can also click "Auto-fill sizes from foot length" to fill all five size fields at once. Note: lasts vary slightly by brand, and the same foot length often differs by half a size between brands — **always go by the brand's official size chart**. JP sizes can be written in centimeters (25.5) or millimeters (255).

### Notes

- US store product pages also usually require login or block cross-origin reads, so the app may not be able to read a link directly. If it can't, paste the size-chart text instead.
- US sizes often run large: for the same brand and the same nominal size, the actual measurements on the US site may be one step larger than the domestic version. The AI will remind you to go by the official size chart when advising; before buying, compare the chart's measured numbers against the well-fitting item in your wardrobe, field by field.
- The price field supports USD and other currencies; the price is shown with the corresponding symbol after you pick a currency. No currency conversion is done.
- Return / exchange policies and sizing risks for cross-border purchases are unrelated to the size chart itself — check the seller's return policy before ordering.

## Calendar & schedule

The daily outfit suggestion considers not only the weather but also what you have on today: a formal meeting in the afternoon means a shirt + jacket, an evening workout means shoes that are easy to move in. There are four ways to provide your schedule, pick whichever is easiest:

### 1. Pick an occasion / write schedule text (simplest)

In "Today's outfit", pick the main occasion: work / meeting / exercise / gym / formal / casual / date; or write freely in the schedule text box, e.g. "meeting at 3pm, gym in the evening". You can also leave it blank — then the outfit is picked by weather alone.

### 2. Import an .ics calendar file

Click "Import calendar (.ics file)" and select an .ics file exported from your phone / computer calendar app. The app parses today's events (time, title, location) locally in the browser, infers the occasion for each, lists them below, and auto-fills the occasion dropdown with the first event's occasion. The file is only parsed locally — nothing is uploaded.

Occasion inference is keyword-based on the event title: meeting → meeting; exercise / gym / running / yoga → exercise; interview / ceremony / formal → formal; date / dinner → date; work → work; anything else → casual.

### 3. Google Calendar (read-only, self-configured)

Steps:

1. Open [Google Cloud Console](https://console.cloud.google.com/), create a project → enable the **Google Calendar API** → create credentials → **OAuth client ID** (application type: **Web application**).
2. In the client's "Authorized redirect URIs", add your page URL — for example, after deploying to GitHub Pages it is `https://<your-username>.github.io/wardrobe-ai/`.
3. Paste the Client ID (looks like `xxx.apps.googleusercontent.com`) into the page's "Google Calendar" field, click "Connect Google Calendar", and approve read-only calendar access on Google's authorization page.
4. Once authorized, you'll be redirected back to the page. Clicking "What to wear today" will then read today's events from your primary calendar automatically.

Notes:

- Authorization uses the OAuth authorization-code + PKCE flow, with only the `calendar.readonly` scope (read-only calendar). The token and refresh token are stored only in the browser's localStorage; clicking "Disconnect" deletes them.
- API-key access only works for public calendars and can't read private schedules, so this app uses OAuth instead of an API key.
- The page must run over http(s) (e.g. GitHub Pages or a local `python3 -m http.server`). Opening it directly with file:// makes the authorization callback URL invalid, so connection failing in that case is expected.

### Privacy

Schedule, calendar events, and Google credentials are stored only in the browser's localStorage by default — never uploaded to any server, never committed to the repo. After switching devices or clearing browser data, you'll need to import or reconnect again.

## Business trips / travel

In the "Business trip / travel" section, enter one trip and the app gives two kinds of advice based on the destination weather and local plans:

1. **Daily outfits at the destination**: one outfit per day, based on each day's weather at the destination (not the departure city) + the local occasion, with the date noted.
2. **Packing list**: which clothes to bring, picked only from your wardrobe, considering trip length, weather changes at the destination, and local occasions — favoring versatile, multi-use pieces with minimal duplication, with a packing reason for each item (e.g. "this jacket works for all three days, saving one slot in the suitcase" or "these shoes work for both meetings and sightseeing").

### How to use

- **Manual entry**: destination city, departure date, and return date are required; local occasions (work / meeting / exercise / formal / casual / sightseeing / date) and trip notes are optional — filling them in makes the suggestions fit better.
- **Detect from calendar**: click "Detect trips from calendar" and the app searches your imported .ics calendar and connected Google Calendar for upcoming business trips / travel, auto-filling the dates and destination. Detection rules: events spanning 2 or more calendar days, or events whose title / location / notes contain words like "business trip, travel, trip, vacation, holiday"; the location field is used as the destination city; past trips are skipped; if there are several, the nearest one is filled in.

### Weather & range

- Destination weather comes from Open-Meteo: a multi-day forecast from the departure date (daily high / low, precipitation probability, conditions) for the destination city.
- Forecasts go up to 16 days ahead: if the trip starts beyond that, the app will suggest checking again closer to departure. Trips can be up to 30 days long; days beyond the forecast range should be estimated from the local seasonal climate.
- Enter only the city name for the destination (e.g. "Shanghai", "Tokyo") — no district or venue names, or the lookup may fail.

### Manual fallback

If the calendar has no trip, or nothing is detected, just fill in the destination and dates manually. If the weather lookup fails, clicking "Generate" will prompt you to try a different spelling of the city name or retry later — other features are unaffected.

## AI settings

Configure at the bottom of the page under "AI settings". Keys are stored only in your browser's localStorage and **are never uploaded or committed to the repo**:

| Provider | Base URL | Model | Where to get a key |
| --- | --- | --- | --- |
| Custom OpenAI-compatible API | The provider's URL | The provider's model name | Each provider's website |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` | platform.deepseek.com |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` (can change to `gpt-4o`) | platform.openai.com |
| Qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` | Alibaba Cloud Bailian console (bailian.console.aliyun.com) |
| Kimi / Moonshot | `https://api.moonshot.cn/v1` | `kimi-k3.1-pro` | platform.moonshot.cn |
| GLM (Zhipu AI) | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-plus` | open.bigmodel.cn |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-2.5-flash` | Google AI Studio (aistudio.google.com) |
| Muse (Meta Model API) | `https://api.meta.ai/v1` | `muse-spark-1.3` | dev.meta.ai |

Notes:

- Picking a preset auto-fills the Base URL and model name — you only need to paste your own key, click "Save settings", then "Test connection".
- Kimi note: the K2 series will retire by the end of 2026; new users should use `kimi-k3.1-pro` (the current official recommendation). Overseas users can use `https://api.moonshot.ai/v1`. The `moonshot-v1` series has retired — don't use it anymore.
- Gemini note: this uses Google's OpenAI-compatible endpoint (`/v1beta/openai/`), not the native Gemini API URL. Check the model name on the Google AI Studio page.
- Muse note: there is no standalone "Muse API" product. Calls go through Meta's Model API (`https://api.meta.ai/v1`), which is compatible with the OpenAI Chat Completions interface; the model is `muse-spark-1.3`. Key availability may involve regional and review requirements — see the official dev.meta.ai page.
- **Claude does not support direct connection**: Anthropic Claude's official API is not OpenAI-compatible, so it can't be entered directly into this app. To use Claude, go through a relay service that supports the OpenAI-compatible format, then pick "Custom OpenAI-compatible API" and enter the relay URL.
- If you don't have a key for a given provider yet, any other preset works the same — size advice, outfits, and assisted entry are identical across providers.
- Click "Test connection" after configuring to verify before use.

## Weather

Daily outfit weather comes from Open-Meteo (`open-meteo.com`, free, no API key needed): the city name is resolved to coordinates first, then the day's high / low, precipitation probability, and conditions are fetched. If the network is down or the city can't be found, tick "Enter weather manually" and fill in the temperature and whether it's raining.

## Run locally / deploy

```bash
# Open directly
open index.html

# Or start a static server
python3 -m http.server 8080
# Open http://localhost:8080 in your browser
```

GitHub Pages: repo Settings → Pages → Branch: `main`, directory: `/ (root)`. Save, then visit `https://<your-username>.github.io/wardrobe-ai/`.

## Data & privacy

- All data (clothes, photos, body measurements, AI keys) is stored only in the browser's localStorage by default — never uploaded to any server.
- Uploaded photos are compressed to JPEG data URLs and stored locally. localStorage is typically capped around 5 MB — if you have many photos, export a JSON backup regularly and remove photos you no longer need.
- **Don't commit real personal information to a public repo**: the example data (`data/example-wardrobe.json`) is placeholder content. Your own data should stay in your local browser and your own backup files.
- `.gitignore` already excludes `.env` and backup files ending in `*-private.json` / `*-backup-*.json`. Don't put exported backup files into the repo.

## Directory structure

```
wardrobe-ai/
├── index.html                  # Page
├── css/style.css               # Styles
├── js/
│   ├── store.js                # Data layer: localStorage, import/export, image compression
│   ├── units.js                # Unit conversion: inch/cm, shoe sizes US/EU/UK/JP, currencies, store detection
│   ├── calendar.js             # Calendar: .ics parsing, occasion inference, Google Calendar OAuth (read-only)
│   ├── ai.js                   # AI client: OpenAI-compatible calls, provider presets, connection test
│   ├── weather.js              # Weather: Open-Meteo
│   └── app.js                  # Main logic: rendering, entry, AI parsing, size advice, outfits
├── data/example-wardrobe.json  # Example data (placeholder)
├── README.md                   # Chinese README
├── README.en.md                # English README
├── LICENSE                     # MIT
└── .gitignore
```

## License

MIT, see [LICENSE](LICENSE).
