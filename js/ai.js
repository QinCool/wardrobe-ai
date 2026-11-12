// AI 设置与调用：支持任意 OpenAI 兼容接口。
// API Key 只存在浏览器 localStorage，绝不上传到仓库、也绝不发给配置的服务商以外的地址。

const STORE_AI = 'wardrobe-ai-settings-v1';

const PROVIDER_PRESETS = {
  custom: { label: '自定义 OpenAI 兼容接口', baseUrl: '', model: '', hint: '填入服务商的 Base URL、Key 和模型名，例如 OpenAI、DeepSeek、通义、智谱等。' },
  deepseek: { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', hint: 'Key 去 platform.deepseek.com 申请。' },
  muse: { label: 'Muse（Meta Model API）', baseUrl: 'https://api.meta.ai/v1', model: 'muse-spark-1.3', hint: 'Key 去 dev.meta.ai 申请（Meta Model API）。注意：Meta 的 Key 开通可能有地区与审核要求，以官方页面为准；若暂无 Key，可先用 DeepSeek 等其他兼容接口。' },
};

function loadAISettings() {
  try {
    return JSON.parse(localStorage.getItem(STORE_AI) || '{}');
  } catch { return {}; }
}

function saveAISettings(s) {
  localStorage.setItem(STORE_AI, JSON.stringify(s));
}

function getAIConfig() {
  const s = loadAISettings();
  const preset = PROVIDER_PRESETS[s.provider] || PROVIDER_PRESETS.custom;
  return {
    provider: s.provider || 'custom',
    baseUrl: (s.baseUrl || preset.baseUrl || '').replace(/\/+$/, ''),
    apiKey: s.apiKey || '',
    model: s.model || preset.model || '',
  };
}

function aiConfigured() {
  const c = getAIConfig();
  return Boolean(c.baseUrl && c.apiKey && c.model);
}

async function chatCompletion(messages, { temperature = 0.3 } = {}) {
  const c = getAIConfig();
  if (!aiConfigured()) throw new Error('请先在「AI 设置」里配置服务商、API Key 和模型。');
  const res = await fetch(c.baseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + c.apiKey,
    },
    body: JSON.stringify({ model: c.model, messages, temperature }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('AI 请求失败（HTTP ' + res.status + '）' + (text ? '：' + text.slice(0, 200) : '，请检查 Key、Base URL 与模型名。'));
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 返回内容为空，请重试。');
  return content;
}

// 测试连接：先调 /models，失败则用一次最短对话验证
async function testAIConnection() {
  const c = getAIConfig();
  if (!c.baseUrl || !c.apiKey) throw new Error('请先填写 Base URL 和 API Key。');
  try {
    const res = await fetch(c.baseUrl + '/models', {
      headers: { 'Authorization': 'Bearer ' + c.apiKey },
    });
    if (res.ok) return '连接成功：/models 有响应。';
  } catch { /* 有的服务商不支持 /models，继续用对话验证 */ }
  const reply = await chatCompletion([{ role: 'user', content: '只回复一个字：好' }], { temperature: 0 });
  return '连接成功，AI 回复：' + reply.trim().slice(0, 50);
}

// 从 AI 返回的文本里抠出第一个 JSON 对象（模型常在 JSON 前后加解释文字）
function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('AI 没有返回可解析的 JSON。原文：' + text.slice(0, 300));
  return JSON.parse(text.slice(start, end + 1));
}
