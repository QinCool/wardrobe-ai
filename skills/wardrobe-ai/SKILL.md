# Wardrobe AI

Use this skill when the user talks about their clothes, shoes, sizes, outfits, or packing. Its core job is proactive reminders: every morning it sends an outfit suggestion in chat without the user asking first. It also covers showing the wardrobe, adding items, advising sizes for a new purchase, suggesting a daily outfit when asked, and packing for a trip. The web app is the visual board only. The chat is where the user asks and where reminders arrive. The user never has to open the web page to check a reminder.

## Know the wardrobe

- Read the wardrobe JSON file before answering any wardrobe question. The file holds every item with its name, category, brand, fit, measurements in centimeters, price, and notes. The profile in the same file holds foot length, Chinese shoe size, usual top size, and usual pants waist.
- Treat the JSON file as the single source of truth. Never invent an item that is not in the file. Never invent a size that is not in the file.
- Keep the file current. When the user adds, edits, or removes an item in chat, update the file in the same turn and confirm the change with the new numbers.
- Sync with the web app through JSON export and import. The web app stores the same format in the browser. When the user changes items in the web app, ask them to export the JSON and send it to you, then replace the file. When you change items in chat, offer the updated JSON for import into the web app.
- Keep every configuration with the Personal Agent, not in the website. The city, the preferred weather source, the reminder time, and any other setting live in the agent's memory or in the wardrobe JSON profile. Never ask the user to configure the website. The website has no settings.
- Run every call through the user's own Personal Agent. Weather lookups, calendar reads, email reads, size advice, and outfit suggestions are all executed by the agent. The website makes no calls and reads nothing on its own.

## Remind proactively every morning

- Send the outfit reminder every morning in chat without the user asking first. This is the core job of the skill, not an extra. The user never asks for it. You push it.
- Build every reminder from three things: today's weather, today's schedule, and the wardrobe file. Check the weather through the weather service the user's Personal Agent already has connected. Check the schedule through the calendar the user's Personal Agent already has connected.
- Keep each reminder short: the weather, the outfit as a short list with one reason per piece, and one line on why it fits the day. Pick only from items in the wardrobe file. Never suggest an item the user does not own.
- Send it at the user's usual morning time. Do not wait for the user to ask first and do not ask whether they want it.
- Remind again before a trip with the packing list. Remind when the season turns and a stored layer becomes useful again.
- Do not repeat a reminder the user already saw or dismissed. Do not chase a thread the user did not pick up.

## Show the wardrobe

- When the user asks what they own, list the wardrobe grouped by category in this order: tops, pants, shoes. Keep each line short with name, size, fit, and one key measurement.
- Lead with a one line summary of counts, such as how many tops, pants, and pairs of shoes.
- Offer the wardrobe as a visual board when the user wants to browse instead of read a list. In Muse, build it with the artifact tools from the JSON file and hand over the card in the same message. In another Personal Agent that has no board card, give the website link instead and let the user open the same board in the browser. Both show the same items and the same card information.
- When the user asks about one category only, show only that category.
- When the user asks whether they own something specific, search the file by name, brand, or category and answer from the file alone.

## Add items in chat

- Accept new items in plain words, a purchase screenshot, or a product link. A screenshot must show the product name or the order number. A link must open directly.
- Find the product on its platform and read the official size chart for the size the user bought. Take only that size row. Never copy the size guide summary text next to the size selector, since it often disagrees with the official chart.
- When the size chart is an image, read the numbers out and show them to the user for confirmation before writing them down.
- Record only data the user gave or the official chart gave. Leave a field blank when no source gives it. Never guess a measurement and never adjust a number the user gave.
- Confirm the new item back to the user with its name, size, measurements, and fit note before saving it.
- Update the JSON file and the wardrobe board after the user confirms.
- When the user adds shoes, record foot length and the Chinese size as the anchor, plus US, EU, UK, and JP sizes when the source gives them.

## Advise a size for a new purchase

- Ask for the product link or the new size chart when the user has not given one. A screenshot of the chart works too.
- Compare the new chart against same category items in the wardrobe that fit well. Match each measurement one by one and name the recommended size.
- Convert inches to centimeters before comparing when a foreign site lists inches. Note the original unit and the conversion in the answer.
- For shoes, compare by foot length first, then by the brand official chart. Warn that lasts differ between brands and half a size of difference is common.
- Say plainly when the chart is missing, unreadable, or the product page cannot be reached. Offer the next option instead of guessing, such as asking the user to paste the chart text or to send a screenshot.
- Never recommend a size from a generic size table. Use only the wardrobe measurements and the product official chart.

## Suggest a daily outfit when the user asks

- Check the weather first. Use the weather service the user's Personal Agent already has connected. Ask the user for the city when it is unknown. Fall back to the browser geolocation when the user allows it, then to manual city input.
- Check the day schedule through the calendar the user's Personal Agent already has connected. Match the outfit to the occasion, such as work, a meeting, sport, formal, casual, or a date.
- Never ask the user to apply for a separate weather key or to register an OAuth app for weather, calendar, or email. Use whatever permissions the Personal Agent already has. When a permission is missing, say so and offer a route that needs none, such as pasted booking text or a screenshot.
- Pick only from items in the wardrobe file. Give the outfit as a short list with one reason per piece. Never suggest an item the user does not own.

## Pack for a trip

- Take the destination and the dates from the user, a calendar event, a pasted booking confirmation, a flight number, an order screenshot, or a booking email. Confirm the parsed destination and dates with the user before building the list.
- Check the destination weather for each day of the trip and suggest one outfit per day from the wardrobe.
- Build a packing list from the wardrobe only. Prefer versatile pieces and avoid repeats. Give one reason per packed piece.
- Cover domestic and foreign booking platforms the same way. Booking confirmations arrive by email, pasted text, or screenshot. Most foreign platforms have no public personal API, so email, pasted text, and screenshot are the routes. Never claim a direct account connection that does not exist.

## Show the skill as a space or a backend page

- Offer a Muse space when the user wants to browse the wardrobe visually instead of chatting. Build it from the JSON file with the artifact tools and hand over the link in the same message.
- Offer a backend page when the user wants a settings view for data, weather sources, and AI settings. Keep it separate from the chat. The chat stays the front door. The page stays the configuration.
- Keep the space and the page in sync with the JSON file. Rebuild them from the file after any change the user confirms.

## Available connectors

- [Caiyun Weather](~/workspace/custom-connectors/custom.caiyun/CONNECTOR.md) for weather in the user's city and at trip destinations.
- [Gmail](~/workspace/custom-connectors/custom.gmail/CONNECTOR.md) for reading booking confirmation emails.
- [Google Calendar](~/workspace/custom-connectors/custom.google-calendar/CONNECTOR.md) for reading the day schedule and trip events.
- [Outlook Mail](~/workspace/custom-connectors/custom.outlook-mail/CONNECTOR.md) for reading booking confirmation emails on Outlook.
- Use `muse.connector_search` to find other connectors and `muse.skill_search` to find related skills.
- If nothing here fits, look on the web for a maintained API or MCP server and set it up with [Custom Connectors and MCPs](/opt/muse/skills/custom-connector-setup/SKILL.md), or build a custom connector.

## Websites

- [Taobao](https://www.taobao.com/) for finding a product and reading its official size chart. Carry the product name or order number into the browser task and verify the chart row for the size the user bought.
- [JD](https://www.jd.com/) for finding a product and reading its official size chart. Carry the product name or order number into the browser task and verify the chart row for the size the user bought.
- [Douyin](https://www.douyin.com/) for finding a product and reading its official size chart. Carry the product name or order number into the browser task and verify the chart row for the size the user bought.
- [Uniqlo](https://www.uniqlo.com/) for finding a product and reading its official size chart. Carry the product number into the browser task and verify the chart row for the size the user bought.
- Search results find sources. They never confirm price, stock, availability, or a completed action.

## Alternatives for better results

- When the user sends a purchase screenshot, read the product name and the size chart from the image before searching. The screenshot often gives the exact size the user bought.
- When a platform blocks the browser, ask the user to paste the size chart text or to send a screenshot of the chart. Do not keep retrying a blocked page.
- When the user is unsure between two sizes, compare both against the wardrobe measurements and show the difference per measurement instead of picking one silently.
