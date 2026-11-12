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
- **Daily outfit**: picks an outfit from your wardrobe based on today's weather **and** today's schedule. Weather supports multiple sources (Open-Meteo by default — free, no API key needed; or Caiyun / OpenWeatherMap / QWeather with your own key). Leaving the city blank prefers browser geolocation, and a failed location falls back to manual city entry. Schedule can be picked by occasion, pasted as text, imported from an .ics calendar file, or read from Google / Outlook Calendar (read-only). If the weather can't be fetched, you can enter the temperature and whether it's raining manually.
- **Business trips / travel**: enter a destination and departure / return dates and get a daily outfit for each day at the destination (based on local weather and plans) plus a packing list — picked only from your wardrobe, favoring versatile pieces with minimal duplication, with a packing reason given for each item. Trips can be detected automatically from your calendar, or generated from pasted booking text, a flight-number lookup, a screenshot, or booking-confirmation emails.
- **Find booking confirmations in your mailbox**: connect Gmail / Outlook mail (read-only) to search for booking-confirmation emails and have the AI extract a trip from the ones you pick. Covers domestic and international flight, hotel, and train platforms.
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

### 4. Outlook Calendar (read-only, self-configured)

Steps:

1. Open the [Azure portal](https://portal.azure.com/) → App registrations → New registration → Authentication → Add a platform → **Single-page application**, with the redirect URI set to your page URL — for example, after deploying to GitHub Pages it is `https://<your-username>.github.io/wardrobe-ai/`.
2. API permissions → Add a permission → Microsoft Graph → Delegated permissions → check **Calendars.Read** (read calendar; if you also want to find booking confirmations in your mailbox, check **Mail.Read** too — mail and calendar share the same app).
3. Copy the **Application (client) ID**, paste it into the page's "Outlook Calendar" field, click "Connect Outlook", and approve read-only calendar access on Microsoft's authorization page.
4. Once authorized, you'll be redirected back to the page. Clicking "What to wear today" will then read today's events from your Outlook calendar, and "Detect trips from calendar" will also look for upcoming business trips / travel there.

Notes:

- Authorization uses the OAuth authorization-code + PKCE flow, with only the `Calendars.Read` scope (read-only calendar). The token and refresh token are stored only in the browser's localStorage; clicking "Disconnect" deletes them.
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

- Destination weather is fetched from the source selected in "Weather settings" (Open-Meteo by default), a multi-day forecast from the departure date (daily high / low, precipitation probability, conditions) for the destination city.
- Forecast horizons differ by source: Open-Meteo up to 16 days ahead, QWeather 7 days, OpenWeatherMap 5 days, Caiyun as returned. If the trip starts beyond the selected source's range, the app will suggest checking again closer to departure. Trips can be up to 30 days long; days beyond the forecast range should be estimated from the local seasonal climate.
- Enter only the city name for the destination (e.g. "Shanghai", "Tokyo") — no district or venue names, or the lookup may fail.

### Manual fallback

If the calendar has no trip, or nothing is detected, just fill in the destination and dates manually. If the weather lookup fails, clicking "Generate" will prompt you to try a different spelling of the city name or retry later — other features are unaffected.

## Trip sources

Besides filling in the destination and dates manually, a trip can be generated from any of these sources. All of them produce the same trip object (destination, departure / return dates, transport, hotel, notes), which then flows into the existing trip process (destination weather + daily outfits + packing list).

| Source | How to use | Notes |
| --- | --- | --- |
| Manual entry | Fill in the destination and departure / return dates in the "Business trip / travel" section | Most reliable |
| Calendar detection | Click "Detect trips from calendar" to find multi-day trips in your .ics / Google Calendar / Outlook Calendar | See "Calendar & schedule" |
| Paste booking text | In "Generate a trip from booking info", paste the booking-confirmation SMS or email text (Ctrip, Fliggy, 12306, airline apps, Skyscanner, Expedia, Booking.com, etc.) and click "AI extracts trip" | No API integration — works with any platform; fields that can't be extracted are left blank, and wrong ones can be corrected manually |
| Flight-number lookup | Enter a flight number (e.g. CA1831, BA249, UA857) + an AviationStack key and click "Look up flight" | Free tier: 100 requests/month, key from aviationstack.com; the free tier only supports HTTP, so requests from an HTTPS page (GitHub Pages) are blocked by the browser — open the page over http://localhost instead, or use pasted text / screenshot; generally only recent / same-day flights can be found |
| Screenshot recognition | Upload an order screenshot (12306, airline apps, Ctrip, Skyscanner, Expedia, etc.) and click "AI reads the screenshot and generates a trip" | Needs a vision-capable AI model (e.g. GPT-4o, Gemini); if the model doesn't support images, you'll be told to paste the text instead |
| Find booking confirmations in your mailbox | See the next section, "Find booking confirmations in your mailbox" | Gmail / Outlook, read-only |

Note: most booking platforms, domestic and international, offer no public API for individual users, so email, pasted text, and screenshots are the main paths. This app does not connect directly to any booking platform's account, does not store account passwords, and does not pretend to connect to those platforms.

## Find booking confirmations in your mailbox

In the "Find booking confirmations in your mailbox" section, connect Gmail or Outlook mail (read-only) to search for booking-confirmation emails from the last 90 days. Candidates are listed — tick the ones to use and let the AI extract a trip. If you'd rather not connect a mailbox, use "Paste booking text" or "Screenshot recognition" instead.

### Supported platforms (sender keywords)

- **Flights**: Ctrip, Fliggy, 12306, Air China, China Southern, China Eastern, Hainan Airlines, XiamenAir, Skyscanner, Expedia, Kayak, Google Flights, Trip.com, CheapOair
- **Hotels**: Booking.com, Agoda, Expedia, Hotels.com, Airbnb, Hostelworld, Ctrip, Fliggy
- **Trains**: 12306, Trainline, Amtrak, Eurail, Deutsche Bahn
- **General**: Trip.com (Ctrip's international version), MakeMyTrip

Search keywords: 机票, 酒店, 行程单, flight, hotel, booking, itinerary, confirmation. Candidates whose sender domain is on the list above are ranked first; others are still listed.

### Gmail (read-only)

Steps:

1. Open [Google Cloud Console](https://console.cloud.google.com/), create a project → enable the **Gmail API** → create credentials → **OAuth client ID** (application type: **Web application**).
2. In the client's "Authorized redirect URIs", add your page URL — for example, after deploying to GitHub Pages it is `https://<your-username>.github.io/wardrobe-ai/`.
3. Paste the Client ID into the page's "Gmail" field, click "Connect Gmail", and approve read-only mail access (`gmail.readonly`) on Google's authorization page.
4. Click "Search for booking-confirmation emails", tick the ones to use, then click "AI extracts a trip from the selected emails" and review the result.

Notes: authorization uses the OAuth authorization-code + PKCE flow, with only the `gmail.readonly` scope (read-only mail). The token and refresh token are stored only in the browser's localStorage; clicking "Disconnect" deletes them. No email is modified or deleted.

### Outlook mail (read-only, Microsoft Graph, shares authorization with Outlook Calendar)

Steps:

1. Open the [Azure portal](https://portal.azure.com/) → App registrations → New registration → Authentication → Add a platform → **Single-page application**, with the redirect URI set to your page URL, e.g. `https://<your-username>.github.io/wardrobe-ai/`.
2. API permissions → Add a permission → Microsoft Graph → Delegated permissions → check **Mail.Read** (read mail) and **Calendars.Read** (read calendar). Grant admin consent if asked (personal accounts usually work directly).
3. Copy the **Application (client) ID** and paste it into the page's "Outlook Calendar" field (mail and calendar share this one ID), then click "Connect Outlook" to authorize.
4. In the "Outlook mail" section, click "Search for booking-confirmation emails", tick the ones to use, then click "AI extracts a trip from the selected emails".

Notes: authorization uses the OAuth authorization-code + PKCE flow. The token and refresh token are stored only in the browser's localStorage; clicking "Disconnect" deletes them. No email is modified or deleted. The page must run over http(s); opening it directly with file:// makes the authorization callback URL invalid.

### Privacy & fallback

- Read-only access: no email is modified or deleted; message contents are only processed locally in the browser — never uploaded, never committed to the repo.
- If the mailbox can't be connected or nothing is found, the message will tell you to paste the booking text or use screenshot recognition instead.

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

Daily outfit and trip-forecast weather support multiple sources, switchable in the page's "Weather settings". Keys are stored only in the browser's localStorage — never uploaded, never committed to the repo.

| Source | Key required | Where to get a key | Forecast horizon | Notes |
| --- | --- | --- | --- | --- |
| Open-Meteo (default) | No | — | Up to 16 days ahead | Free, default source |
| Caiyun | Yes | caiyunapp.com (Caiyun open platform) | As returned | Realtime + daily forecast |
| OpenWeatherMap | Yes | openweathermap.org | Up to 5 days ahead | Free tier: 5-day forecast |
| QWeather | Yes | qweather.com (QWeather developer platform) | Up to 7 days ahead | No daily precipitation probability |

### Location fallback chain

Weather follows this order for location and data. Every failed step tells you plainly what happened — nothing fails silently:

1. **Use your configured source**: if you picked a source in "Weather settings" and entered its key, that source is used.
2. **No key → fall back to Open-Meteo**: if the selected source has no key configured, or its request fails, the app automatically falls back to Open-Meteo (no key needed) and says so in the result.
3. **City left blank → browser geolocation**: with the city field empty, the app first tries browser geolocation (navigator.geolocation) for coordinates, then calls Open-Meteo. Geolocation needs your permission; a denial, timeout, or unavailability produces a clear message (e.g. "Location was denied — please enter a city manually").
4. **Enter a city manually**: type a city name in the city field and the app resolves it to coordinates with Open-Meteo's geocoding API (no key needed). Use just the city name — no district or venue names.
5. **Still nothing → enter the weather manually**: tick "Enter weather manually" and fill in the temperature and whether it's raining.

### Notes per source

- Caiyun: APIs are `api.caiyunapp.com/v2.6/{key}/{lng},{lat}/realtime.json` (realtime) and `/daily.json` (daily). The daily forecast includes high / low, precipitation probability, and conditions (skycon values translated to Chinese).
- OpenWeatherMap: uses the 5-day forecast API (`api.openweathermap.org/data/2.5/forecast`), aggregated per day into high / low, maximum precipitation probability, and the most common condition. Days beyond 5 can't be fetched — the UI says so.
- QWeather: uses the 7-day forecast API (`api.qweather.com/v7/weather/7d`). It provides no daily precipitation probability, so that field is left empty.
- All sources are normalized to "high / low, precipitation probability, conditions" before the outfit logic uses them. When sources return different fields, what each source actually returned is what you get.

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
│   ├── weather.js              # Weather: Open-Meteo / Caiyun / OpenWeatherMap / QWeather, multi-source with fallback chain
│   ├── trip.js                 # Trip sources: pasted booking text, flight-number lookup, screenshot recognition
│   ├── mail.js                 # Mailbox: Gmail / Outlook mail search, Outlook Calendar (read-only OAuth)
│   └── app.js                  # Main logic: rendering, entry, AI parsing, size advice, outfits
├── data/example-wardrobe.json  # Example data (placeholder)
├── README.md                   # Chinese README
├── README.en.md                # English README
├── LICENSE                     # MIT
└── .gitignore
```

## License

MIT, see [LICENSE](LICENSE).
