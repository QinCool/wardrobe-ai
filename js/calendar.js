// 日历与行程：.ics 导入、行程文字、Google 日历（只读 OAuth）。
// 日历数据与凭证只存浏览器 localStorage，不上传、不进仓库。
// Google 日历需要页面跑在 http(s) 上（如 GitHub Pages），直接用 file:// 打开时 OAuth 回调地址无效。

const STORE_CAL = 'wardrobe-calendar-v1';

function loadCalSettings() {
try { return JSON.parse(localStorage.getItem(STORE_CAL) || '{}');} catch { return {};}
}

function saveCalSettings(s) {
localStorage.setItem(STORE_CAL, JSON.stringify(s));
}

// ----------.ics 解析 ----------
function parseICS(text) {
const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
// 展开折行：以空格 / Tab 开头的行是上一行的续行
const unfolded = [];
for (const line of lines) {
if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length) unfolded[unfolded.length - 1] += line.slice(1);
else unfolded.push(line);
}
const events = [];
let cur = null;
for (const line of unfolded) {
if (line === 'BEGIN:VEVENT') cur = {};
else if (line === 'END:VEVENT') { if (cur) events.push(cur); cur = null;}
else if (cur) {
const idx = line.indexOf(':');
if (idx === -1) continue;
const key = line.slice(0, idx).split(';')[0];
const val = line.slice(idx + 1);
if (key === 'DTSTART') cur.start = parseICSDate(val);
else if (key === 'DTEND') cur.end = parseICSDate(val);
else if (key === 'SUMMARY') cur.summary = icsUnescape(val);
else if (key === 'LOCATION') cur.location = icsUnescape(val);
else if (key === 'DESCRIPTION') cur.description = icsUnescape(val);
}
}
return events;
}

function parseICSDate(v) {
// 形如 20261112T090000Z / 20261112T090000 / 20261112
const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);
if (!m) return null;
const [, y, mo, d, h = '0', mi = '0', s = '0', z] = m;
const date = z
? new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s))
: new Date(+y, +mo - 1, +d, +h, +mi, +s);
return Number.isNaN(date.getTime())? null: date;
}

function icsUnescape(v) {
return v.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

function todayEvents(events, now = new Date()) {
const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
return events
.filter((e) => e.start && e.start >= start && e.start < end)
.sort((a, b) => a.start - b.start);
}

// ---------- 场合推断 ----------
const OCCASION_KEYWORDS = [
{ re: /(会议|开会|meeting|standup|评审|答辩)/i, occasion: '开会'},
{ re: /(运动|健身|跑步|瑜伽|gym|workout|游泳|打球)/i, occasion: '运动'},
{ re: /(面试|典礼|正式|签约|发布会|婚礼)/i, occasion: '正式'},
{ re: /(约会|date|聚餐|吃饭|看电影)/i, occasion: '约会'},
{ re: /(上班|工作|work|打卡)/i, occasion: '上班'},
];

function inferOccasion(text) {
for (const { re, occasion} of OCCASION_KEYWORDS) if (re.test(text || '')) return occasion;
return '休闲';
}

function formatEventTime(d) {
return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function eventsToText(events) {
return events.map((e) => {
const t = e.start? formatEventTime(e.start): '';
const end = e.end? '–' + formatEventTime(e.end): '';
return (t? t + end + ' ': '') + (e.summary || '未命名日程') +
(e.location? '（' + e.location + '）': '') +
'【' + inferOccasion((e.summary || '') + ' ' + (e.description || '')) + '】';
}).join('\n');
}

// ---------- 出差 / 旅行识别 ----------
// 多日事件（跨 2 个自然日及以上），或标题/地点/备注含出差、旅行等关键词的事件，
// 视为一次出行；地点字段当作目的地城市。已结束的行程跳过，按出发时间排序。
const TRIP_KEYWORDS = /(出差|旅行|旅游|度假|出游|trip|travel|tour)/i;

function detectTrips(events, now = new Date()) {
const trips = [];
for (const e of events) {
if (!e.start) continue;
const end = e.end || new Date(e.start.getTime() + 3600000);
const startDay = new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate());
const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
const spanDays = Math.round((endDay - startDay) / 86400000) + 1;
const text = (e.summary || '') + ' ' + (e.location || '') + ' ' + (e.description || '');
if (spanDays < 2 && !TRIP_KEYWORDS.test(text)) continue;
if (end < now) continue;
trips.push({
title: e.summary || '未命名行程',
start: startDay,
end: endDay,
days: spanDays,
destination: (e.location || '').trim(),
});
}
trips.sort((a, b) => a.start - b.start);
return trips;
}

// ---------- Google 日历（只读，OAuth 授权码 + PKCE，纯前端可跑） ----------
const GCAL_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GCAL_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

function randomString(len) {
const arr = new Uint8Array(len);
crypto.getRandomValues(arr);
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
return Array.from(arr, (b) => chars[b % chars.length]).join('');
}

async function sha256Base64Url(str) {
const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
const bytes = new Uint8Array(buf);
let bin = '';
bytes.forEach((b) => { bin += String.fromCharCode(b);});
return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// 开始授权：生成 PKCE 校验串后跳 Google 授权页
async function gcalStartAuth(clientId) {
const verifier = randomString(64);
const challenge = await sha256Base64Url(verifier);
const s = loadCalSettings();
s.gcalClientId = clientId;
s.gcalVerifier = verifier;
saveCalSettings(s);
const redirect = location.origin + location.pathname;
const params = new URLSearchParams({
client_id: clientId,
redirect_uri: redirect,
response_type: 'code',
scope: GCAL_SCOPE,
code_challenge: challenge,
code_challenge_method: 'S256',
access_type: 'offline',
prompt: 'consent',
});
location.href = GCAL_AUTH_URL + '?' + params.toString();
}

// 处理 OAuth 回调?code=...（页面加载时调用一次）
async function gcalHandleRedirect() {
const params = new URLSearchParams(location.search);
const code = params.get('code');
const err = params.get('error');
if (err) return { error: 'Google 授权被拒绝或失败：' + err};
if (!code) return null;
const s = loadCalSettings();
if (!s.gcalClientId ||!s.gcalVerifier) return { error: '缺少授权校验信息，请重新点连接。'};
const redirect = location.origin + location.pathname;
const res = await fetch(GCAL_TOKEN_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
body: new URLSearchParams({
code,
client_id: s.gcalClientId,
code_verifier: s.gcalVerifier,
redirect_uri: redirect,
grant_type: 'authorization_code',
}),
});
history.replaceState(null, '', location.pathname);
if (!res.ok) return { error: '换取 token 失败（HTTP ' + res.status + '），请检查 Client ID 与重定向地址是否一致。'};
const data = await res.json();
s.gcalToken = data.access_token;
s.gcalTokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
if (data.refresh_token) s.gcalRefreshToken = data.refresh_token;
delete s.gcalVerifier;
saveCalSettings(s);
return { ok: true};
}

async function gcalRefreshToken() {
const s = loadCalSettings();
if (!s.gcalRefreshToken ||!s.gcalClientId) return '';
const res = await fetch(GCAL_TOKEN_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
body: new URLSearchParams({
client_id: s.gcalClientId,
refresh_token: s.gcalRefreshToken,
grant_type: 'refresh_token',
}),
});
if (!res.ok) return '';
const data = await res.json();
s.gcalToken = data.access_token;
s.gcalTokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
saveCalSettings(s);
return data.access_token;
}

// 拿可用的 access_token（过期时自动用 refresh_token 续）
async function gcalAccessToken() {
const s = loadCalSettings();
if (s.gcalToken && s.gcalTokenExpiresAt && Date.now() < s.gcalTokenExpiresAt - 60000) return s.gcalToken;
return gcalRefreshToken();
}

function gcalConnected() {
const s = loadCalSettings();
return Boolean(s.gcalToken || s.gcalRefreshToken);
}

function gcalDisconnect() {
const s = loadCalSettings();
delete s.gcalToken;
delete s.gcalTokenExpiresAt;
delete s.gcalRefreshToken;
saveCalSettings(s);
}

// 读主日历未来 daysAhead 天内的日程（只读，用于识别出差 / 旅行）
async function fetchGCalEventsRange(daysAhead = 60) {
const token = await gcalAccessToken();
if (!token) throw new Error('Google 日历未连接或授权已过期，请重新连接。');
const now = new Date();
const end = new Date(now.getTime() + daysAhead * 86400000);
const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + encodeURIComponent(now.toISOString()) +
'&timeMax=' + encodeURIComponent(end.toISOString()) + '&singleEvents=true&orderBy=startTime&maxResults=50';
const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token}});
if (!res.ok) throw new Error('读取 Google 日历失败（HTTP ' + res.status + '），请重新连接。');
const data = await res.json();
return (data.items || []).map((it) => ({
start: it.start?.dateTime? new Date(it.start.dateTime): (it.start?.date? new Date(it.start.date): null),
end: it.end?.dateTime? new Date(it.end.dateTime): null,
summary: it.summary || '',
location: it.location || '',
description: it.description || '',
}));
}

// 读主日历的今日日程（只读）
async function fetchGCalTodayEvents() {
const token = await gcalAccessToken();
if (!token) throw new Error('Google 日历未连接或授权已过期，请重新连接。');
const now = new Date();
const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).toISOString();
const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + encodeURIComponent(start) +
'&timeMax=' + encodeURIComponent(end) + '&singleEvents=true&orderBy=startTime&maxResults=20';
const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token}});
if (!res.ok) throw new Error('读取 Google 日历失败（HTTP ' + res.status + '），请重新连接。');
const data = await res.json();
return (data.items || []).map((it) => ({
start: it.start?.dateTime? new Date(it.start.dateTime): (it.start?.date? new Date(it.start.date): null),
end: it.end?.dateTime? new Date(it.end.dateTime): null,
summary: it.summary || '',
location: it.location || '',
description: it.description || '',
}));
}
