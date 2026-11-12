# My Wardrobe · Wardrobe AI

[中文](README.md)

**Product form: chat first, website second.** All interaction happens in your Personal Agent chat: add clothes, check sizes, get daily outfits, pack for trips, and get weather reminders by asking your AI assistant (Muse, Doubao, DeepSeek mobile, and others). This website does one thing only: show your wardrobe as a visual board.

No backend, no account, no sign-up. Data lives only in your own Personal Agent (the wardrobe JSON file or storage your Agent can read); the site holds no data. Open `index.html` to use it, or deploy it to GitHub Pages.

> 中文摘要：聊天为前台、网站为后台的个人衣柜。加衣服、问尺码、穿搭提醒、出差行李都在 Personal Agent 聊天里完成；网站只做衣柜展示看板。无后端、无账号，数据只存在你自己的 Personal Agent 手里；网站不持有数据。

## How to use: just ask in chat

This project ships a Skill (`skills/wardrobe-ai/`). Install it in your Personal Agent and use it in chat:

- **Show the wardrobe**: ask "what clothes do I have". With Muse, the assistant shows the wardrobe as a board (a Muse artifact board card) right in the chat. With other AIs (Doubao, DeepSeek, ChatGPT, and others), the assistant gives you the website link and you open the page to see the same board.
- **Add clothes and shoes**: send a purchase screenshot or a product link, or just say it in words. The assistant looks up the official size chart on the platform, checks the numbers with you, then records the item.
- **Ask for a size before buying**: send a product link or a size chart. The assistant compares it against the measured data of the well-fitting items in your wardrobe and tells you which size to buy.
- **Daily outfit**: every morning the assistant reminds you in chat: today's weather, what to wear, and why.
- **Business trips / travel**: give the destination and dates, and the assistant suggests a daily outfit and a packing list based on the local weather.

You never need to open this website every day to check reminders. The website is only the board.

## How to add items

There is no entry form on the website. Add items through the Skill in chat:

1. **Send a purchase screenshot**: send an order or product screenshot from Taobao / JD.com / Pinduoduo / Douyin or another platform. The screenshot must show the product name or the order number.
2. **Send a product link**: just paste the product link.
3. **Say it in words**: tell the assistant what you bought and which size.

The assistant follows this flow: find the product page on the platform, read the official size chart, take the row for the size you bought, check the numbers with you, then record the item. Record only measured numbers or numbers from the official size chart. Leave a field blank when no source gives it. Never guess. When the size chart is an image, the assistant reads the numbers out for your confirmation before writing them down.

The "Import JSON" button in the website footer is the data sync port: after adding clothes in chat, ask the assistant to send you the latest wardrobe JSON and import it to see the items on the board.

## What the website does

- **Wardrobe board**: filter by sweater / T-shirt / jacket / shirt / hoodie / pants / shoes. Each item shows a photo, measurements, and fit notes. A quick bar at the top holds body data (foot length, shoe sizes, pants waist, usual top size).
- **JSON import / export** (two buttons in the footer): import wardrobe data to view it, or export a backup and move it to another device.

The website only displays. Everything else lives in the Skill in chat.

## Data format & sync interface

Wardrobe data is one JSON file, in the format of `data/example-wardrobe.json`. The website and the Skill sync through this JSON file. It is the only interface:

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
      "name": "Example knit sweater",
      "category": "sweater",
      "brand": "Example brand",
      "price": "299",
      "priceCurrency": "CNY",
      "fit": "well-fitting",
      "note": "Loose fit, worn often in autumn and winter.",
      "photo": "",
      "measurements": { "length": "69", "chest": "120", "shoulder": "56", "sleeve": "84" }
    }
  ]
}
```

Field notes:

- `profile`: body quick data, foot length (cm), pants waist (cm), Chinese / US shoe sizes, usual top size.
- `items[].category`: sweater / T-shirt / jacket / shirt / hoodie / pants / shoes.
- `items[].measurements`: sizes, always in centimeters. Tops use length `length`, chest `chest`, shoulder `shoulder`, sleeve `sleeve` (shirts also have collar `collar`). Pants use waist `waist`, pants length `pantsLength`, hip `hip`, thigh `thigh`, hem `hem`, rise `rise`, inseam `inseam`. Shoes use foot length `footLength` and Chinese size `sizeCN`, EU `sizeEU`, US `sizeUS`, UK `sizeUK`, JP `sizeJP`.
- `items[].photo`: a photo data URL or an empty string. `priceCurrency` defaults to CNY when omitted. Leave a field as an empty string when no source gives it. Never invent a number.

Syncing:

- **Website to backup**: click "Export JSON" in the footer to download `wardrobe-backup-<date>.json`.
- **Chat to website**: ask the assistant to send you the latest wardrobe JSON, then click "Import JSON" in the footer. You will be prompted to export a backup first. Import replaces all current data.
- The website has no other interface and calls no external service.

## Weather, calendar & mailbox use the Agent's permissions

Weather, calendar, and mailbox are no longer connected by the website. They go through the permissions your own Personal Agent already has:

- Weather uses the weather service the Agent already connects to (such as Caiyun).
- Calendar uses the calendars the Agent already connects to (Google Calendar, Outlook Calendar).
- Mailbox uses the mailboxes the Agent already connects to (Gmail, Outlook).
- Trip recognition works the same way: read the calendar and mailbox when available, and fall back to pasted booking text or screenshot recognition when not.

When using the Skill, you do not need to apply for separate Keys or register OAuth apps for weather, calendar, or mailbox. The Skill uses whatever permissions the Agent already has. When the Agent has not connected something, the assistant tells you to connect it, or switches to a route that needs no permission, such as pasted text or screenshot recognition.

## Settings & calls all go through the Agent

- All settings (city, weather preferences, reminder times, and anything else) go through the Skill and live in your own Personal Agent. They are not stored on the website or in the browser. The website has no settings at all; you set nothing on it. To change a setting, just tell the Agent in chat.
- All calls (checking the weather, reading the calendar, reading the mailbox, giving size advice, giving outfits) are also initiated and executed by your own AI, not by the website and not by a third-party service.
- The website does one thing only: show your wardrobe as a visual board.

## Two ways to display: a board in Muse, a web page elsewhere

- With Muse: the assistant shows the wardrobe as a board (a Muse artifact board card) right in the chat.
- With other AIs (Doubao, DeepSeek, ChatGPT, and others): the assistant gives you the website link, and you open the page to see the same board. The link is the GitHub Pages address (`https://<your-username>.github.io/wardrobe-ai/`).
- Both show the same content (the same wardrobe data, the same card information). Only the carrier differs: Muse has a board card, other AIs use the web page to show the same board.

## Run locally / deploy

```bash
# Open directly
open index.html

# Or start a static server
python3 -m http.server 8080
# Open http://localhost:8080 in your browser
```

GitHub Pages: repo Settings → Pages → Branch `main`, folder `/ (root)`, save, then visit `https://<your-username>.github.io/wardrobe-ai/`.

## Data & privacy

- **Data lives only in your own Personal Agent** (the wardrobe JSON file or storage your Agent can read). The site holds no data. Browser localStorage is only a temporary copy used to display the board when you open the site; switching devices or clearing the cache loses it. The site itself does not save, sync, or back up your data. When the Agent and the site need the board, you import the JSON into the site to view it and leave; data ownership never changes.
- Photos are stored locally as data URLs. localStorage is usually limited to about 5 MB, so a display copy with many photos may not fit; the JSON in your Agent's hands is the source of truth.
- **Do not commit real personal information to a public repo**: the example data (`data/example-wardrobe.json`) is placeholder content. Your own data stays only in your own Personal Agent and your own backup files.
- `.gitignore` already excludes `.env`, backup files ending in `*-private.json` / `*-backup-*.json`, and the local real wardrobe data file. Never put an exported backup file into the repo.

## Directory structure

```
wardrobe-ai/
├── index.html                  # Display page: the wardrobe board
├── css/style.css               # Styles
├── js/
│   ├── store.js                # Display cache: localStorage, import/export
│   └── app.js                  # Main logic: rendering, filters
├── data/example-wardrobe.json  # Example data (placeholder)
├── skills/wardrobe-ai/         # Skill: the interaction logic in chat
│   ├── SKILL.md                # Chat front door: show, add, size advice, outfit reminders, packing
│   └── skill.yaml
├── README.md
├── README.en.md                # English docs
├── LICENSE                     # MIT
└── .gitignore
```

## License

MIT, see [LICENSE](LICENSE).
