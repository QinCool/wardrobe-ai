// 邮箱找订票确认 + Outlook 日历：Gmail 与 Microsoft Graph，只读 OAuth。
// 邮件内容只在浏览器本地处理，不上传、不进仓库；不改、不删任何邮件。
// Gmail 与 Outlook 日历需要页面跑在 http(s) 上（如 GitHub Pages），直接用 file:// 打开时 OAuth 回调地址无效。
// 订票平台（国内外）大多没有面向个人的公开 API，所以邮箱、粘贴文字、截图是主路子；
// 本应用不直连任何订票平台的账号、不保存账号密码。

const STORE_MAIL = 'wardrobe-mail-v1';

function loadMailSettings() {
  try { return JSON.parse(localStorage.getItem(STORE_MAIL) || '{}'); } catch { return {}; }
}

function saveMailSettings(s) {
  localStorage.setItem(STORE_MAIL, JSON.stringify(s));
}

// 订票确认常发件域名（国内外），用于候选排序；不在列表里的邮件也会列出，只排在后面。
const BOOKING_DOMAINS = [
  'trip.com', 'ctrip.com', 'fliggy.com', 'qunar.com', 'elong.com', '12306.cn',
  'skyscanner', 'expedia.com', 'kayak.com', 'cheapoair.com',
  'booking.com', 'agoda.com', 'hotels.com', 'airbnb.com', 'hostelworld.com',
  'trainline.com', 'amtrak.com', 'eurail.com', 'bahn.de', 'makemytrip.com',
];

function bookingLikelihood(c) {
  const from = (c.from || '').toLowerCase();
  const subj = (c.subject || '').toLowerCase();
  if (BOOKING_DOMAINS.some((d) => from.includes(d))) return 2;
  if (/机票|酒店|行程|flight|hotel|booking|itinerary|confirmation|reservation/.test(subj)) return 1;
  return 0;
}

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function b64urlDecode(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ---------- Gmail（只读，OAuth 授权码 + PKCE） ----------
const GMAIL_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GMAIL_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

async function gmailStartAuth(clientId) {
  const verifier = randomString(64);
  const challenge = await sha256Base64Url(verifier);
  const s = loadMailSettings();
  s.gmailClientId = clientId;
  s.gmailVerifier = verifier;
  saveMailSettings(s);
  const redirect = location.origin + location.pathname;
  const params = new URLSearchParams({
    client_id: clientId, redirect_uri: redirect, response_type: 'code',
    scope: GMAIL_SCOPE, code_challenge: challenge, code_challenge_method: 'S256',
    access_type: 'offline', prompt: 'consent', state: 'gmail',
  });
  location.href = GMAIL_AUTH_URL + '?' + params.toString();
}

async function gmailRefreshToken() {
  const s = loadMailSettings();
  if (!s.gmailRefreshToken || !s.gmailClientId) return '';
  const res = await fetch(GMAIL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: s.gmailClientId, refresh_token: s.gmailRefreshToken, grant_type: 'refresh_token' }),
  });
  if (!res.ok) return '';
  const data = await res.json();
  s.gmailToken = data.access_token;
  s.gmailTokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  saveMailSettings(s);
  return data.access_token;
}

async function gmailAccessToken() {
  const s = loadMailSettings();
  if (s.gmailToken && s.gmailTokenExpiresAt && Date.now() < s.gmailTokenExpiresAt - 60000) return s.gmailToken;
  return gmailRefreshToken();
}

function gmailConnected() {
  const s = loadMailSettings();
  return Boolean(s.gmailToken || s.gmailRefreshToken);
}

function gmailDisconnect() {
  const s = loadMailSettings();
  delete s.gmailToken; delete s.gmailTokenExpiresAt; delete s.gmailRefreshToken;
  saveMailSettings(s);
}

function gmailBodyText(payload) {
  const walk = (part) => {
    if (!part) return '';
    if (part.mimeType === 'text/plain' && part.body && part.body.data) return b64urlDecode(part.body.data);
    if (part.parts) {
      for (const p of part.parts) {
        const t = walk(p);
        if (t) return t;
      }
    }
    return '';
  };
  let text = walk(payload);
  if (!text && payload.body && payload.body.data) text = b64urlDecode(payload.body.data);
  return text || '';
}

// 按关键词搜近 90 天的订票确认邮件，列出候选（发件域名在订票列表里的排前面）
async function searchGmailBookings() {
  const token = await gmailAccessToken();
  if (!token) throw new Error('Gmail 未连接或授权已过期，请重新连接。');
  const q = 'newer_than:90d (机票 OR 酒店 OR 行程单 OR flight OR hotel OR booking OR itinerary OR confirmation)';
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=' + encodeURIComponent(q) + '&maxResults=10', {
    headers: { Authorization: 'Bearer ' + token },
  });
  if (!res.ok) throw new Error('搜索 Gmail 失败（HTTP ' + res.status + '），请重新连接。');
  const data = await res.json();
  const out = [];
  for (const m of (data.messages || [])) {
    const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + m.id + '?format=full', {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (!r.ok) continue;
    const msg = await r.json();
    const headers = {};
    (msg.payload.headers || []).forEach((h) => { headers[h.name.toLowerCase()] = h.value; });
    out.push({
      id: m.id,
      subject: headers.subject || '(无主题)',
      from: headers.from || '',
      date: headers.date || '',
      snippet: msg.snippet || '',
      bodyText: gmailBodyText(msg.payload),
    });
  }
  out.sort((a, b) => bookingLikelihood(b) - bookingLikelihood(a));
  return out;
}

// ---------- Outlook 邮箱 + 日历（Microsoft Graph，只读，OAuth 授权码 + PKCE） ----------
const MS_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MS_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const MS_SCOPE = 'Mail.Read Calendars.Read offline_access';

async function msStartAuth(clientId) {
  const verifier = randomString(64);
  const challenge = await sha256Base64Url(verifier);
  const s = loadMailSettings();
  s.msClientId = clientId;
  s.msVerifier = verifier;
  saveMailSettings(s);
  const redirect = location.origin + location.pathname;
  const params = new URLSearchParams({
    client_id: clientId, redirect_uri: redirect, response_type: 'code',
    scope: MS_SCOPE, code_challenge: challenge, code_challenge_method: 'S256',
    state: 'msmail',
  });
  location.href = MS_AUTH_URL + '?' + params.toString();
}

async function msRefreshToken() {
  const s = loadMailSettings();
  if (!s.msRefreshToken || !s.msClientId) return '';
  const res = await fetch(MS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: s.msClientId, refresh_token: s.msRefreshToken, grant_type: 'refresh_token', scope: MS_SCOPE }),
  });
  if (!res.ok) return '';
  const data = await res.json();
  s.msToken = data.access_token;
  s.msTokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  if (data.refresh_token) s.msRefreshToken = data.refresh_token;
  saveMailSettings(s);
  return data.access_token;
}

async function msAccessToken() {
  const s = loadMailSettings();
  if (s.msToken && s.msTokenExpiresAt && Date.now() < s.msTokenExpiresAt - 60000) return s.msToken;
  return msRefreshToken();
}

function msConnected() {
  const s = loadMailSettings();
  return Boolean(s.msToken || s.msRefreshToken);
}

function msDisconnect() {
  const s = loadMailSettings();
  delete s.msToken; delete s.msTokenExpiresAt; delete s.msRefreshToken;
  saveMailSettings(s);
}

// 搜 Outlook 邮箱里的订票确认邮件（与 Gmail 同样的关键词与候选逻辑）
async function searchOutlookBookings() {
  const token = await msAccessToken();
  if (!token) throw new Error('Outlook 未连接或授权已过期，请重新连接。');
  const search = '"flight" OR "hotel" OR "booking" OR "机票" OR "酒店"';
  const url = 'https://graph.microsoft.com/v1.0/me/messages?$search=' + encodeURIComponent(search) +
    '&$top=10&$select=subject,from,receivedDateTime,bodyPreview,body';
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  if (!res.ok) throw new Error('搜索 Outlook 邮箱失败（HTTP ' + res.status + '），请重新连接。');
  const data = await res.json();
  const out = (data.value || []).map((m) => ({
    id: m.id,
    subject: m.subject || '(无主题)',
    from: (m.from && m.from.emailAddress)
      ? ((m.from.emailAddress.name ? m.from.emailAddress.name + ' ' : '') + '<' + m.from.emailAddress.address + '>')
      : '',
    date: m.receivedDateTime || '',
    snippet: m.bodyPreview || '',
    bodyText: stripHtml((m.body && m.body.content) || ''),
  }));
  out.sort((a, b) => bookingLikelihood(b) - bookingLikelihood(a));
  return out;
}

// 读 Outlook 日历未来 daysAhead 天内的日程（只读，与 Google 日历同形状）
async function fetchMsCalEventsRange(daysAhead) {
  const token = await msAccessToken();
  if (!token) throw new Error('Outlook 日历未连接或授权已过期，请重新连接。');
  const now = new Date();
  const end = new Date(now.getTime() + (daysAhead || 60) * 86400000);
  const url = 'https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=' + encodeURIComponent(now.toISOString()) +
    '&endDateTime=' + encodeURIComponent(end.toISOString()) + '&$top=50&$orderby=start/dateTime';
  const res = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  if (!res.ok) throw new Error('读取 Outlook 日历失败（HTTP ' + res.status + '），请重新连接。');
  const data = await res.json();
  return (data.value || []).map((it) => ({
    start: it.start && it.start.dateTime ? new Date(it.start.dateTime) : null,
    end: it.end && it.end.dateTime ? new Date(it.end.dateTime) : null,
    summary: it.subject || '',
    location: (it.location && it.location.displayName) || '',
    description: stripHtml((it.body && it.body.content) || ''),
  }));
}

// 读 Outlook 日历的今日日程（只读）
async function fetchMsCalTodayEvents() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const all = await fetchMsCalEventsRange(1);
  return all.filter((e) => e.start && e.start >= start && e.start < end).sort((a, b) => a.start - b.start);
}

// ---------- 邮箱 OAuth 回调处理（页面加载时调用一次；state 不是 gmail/msmail 时返回 null，交给 Google 日历处理） ----------
async function mailHandleRedirect() {
  const params = new URLSearchParams(location.search);
  const state = params.get('state');
  const code = params.get('code');
  const err = params.get('error');
  if (!code && !err) return null;
  if (state !== 'gmail' && state !== 'msmail') return null;
  const redirect = location.origin + location.pathname;
  if (err) {
    history.replaceState(null, '', location.pathname);
    return { error: '邮箱授权被拒绝或失败：' + err };
  }
  const s = loadMailSettings();
  try {
    if (state === 'gmail') {
      if (!s.gmailClientId || !s.gmailVerifier) return { error: '缺少 Gmail 授权校验信息，请重新点连接。' };
      const res = await fetch(GMAIL_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: s.gmailClientId, code_verifier: s.gmailVerifier, redirect_uri: redirect, grant_type: 'authorization_code' }),
      });
      if (!res.ok) return { error: 'Gmail 换取 token 失败（HTTP ' + res.status + '），请检查 Client ID 与重定向地址是否一致。' };
      const data = await res.json();
      s.gmailToken = data.access_token;
      s.gmailTokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
      if (data.refresh_token) s.gmailRefreshToken = data.refresh_token;
      delete s.gmailVerifier;
    } else {
      if (!s.msClientId || !s.msVerifier) return { error: '缺少 Outlook 授权校验信息，请重新点连接。' };
      const res = await fetch(MS_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: s.msClientId, code_verifier: s.msVerifier, redirect_uri: redirect, grant_type: 'authorization_code' }),
      });
      if (!res.ok) return { error: 'Outlook 换取 token 失败（HTTP ' + res.status + '），请检查 Client ID 与重定向地址是否一致。' };
      const data = await res.json();
      s.msToken = data.access_token;
      s.msTokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
      if (data.refresh_token) s.msRefreshToken = data.refresh_token;
      delete s.msVerifier;
    }
  } finally {
    history.replaceState(null, '', location.pathname);
  }
  saveMailSettings(s);
  return { ok: true, flow: state };
}
