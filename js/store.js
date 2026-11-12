// 展示缓存：导入的衣柜 JSON 存在浏览器 localStorage 只为了显示，不走任何服务器；
// 数据以 Agent 手里的衣柜 JSON 文件为准，网站不持有数据。
// 导出/导入用 JSON 文件，方便备份与迁移。

const STORE_ITEMS = 'wardrobe-items-v1';
const STORE_PROFILE = 'wardrobe-profile-v1';
const STORE_SEEDED = 'wardrobe-seeded-v1';

// 每个分类对应的尺码字段（label -> key），单位厘米，鞋子另有码数字段
const SIZE_FIELDS = {
  '毛衣': [['衣长', 'length'], ['胸围', 'chest'], ['肩宽', 'shoulder'], ['袖长', 'sleeve']],
  'T恤': [['衣长', 'length'], ['胸围', 'chest'], ['肩宽', 'shoulder'], ['袖长', 'sleeve']],
  '外套': [['衣长', 'length'], ['胸围', 'chest'], ['肩宽', 'shoulder'], ['袖长', 'sleeve']],
  '衬衫': [['衣长', 'length'], ['胸围', 'chest'], ['肩宽', 'shoulder'], ['袖长', 'sleeve'], ['领围', 'collar']],
  '卫衣': [['衣长', 'length'], ['胸围', 'chest'], ['肩宽', 'shoulder'], ['袖长', 'sleeve']],
  '裤子': [['腰围', 'waist'], ['裤长', 'pantsLength'], ['臀围', 'hip'], ['大腿围', 'thigh'], ['裤脚围', 'hem'], ['上裆长', 'rise'], ['下裆长', 'inseam']],
  '鞋子': [['脚长', 'footLength'], ['中国码', 'sizeCN'], ['EU', 'sizeEU'], ['US', 'sizeUS'], ['UK', 'sizeUK'], ['JP', 'sizeJP']],
};

function loadItems() {
  try {
    return JSON.parse(localStorage.getItem(STORE_ITEMS) || '[]');
  } catch { return []; }
}

function saveItems(items) {
  localStorage.setItem(STORE_ITEMS, JSON.stringify(items));
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(STORE_PROFILE) || '{}');
  } catch { return {}; }
}

function saveProfile(profile) {
  localStorage.setItem(STORE_PROFILE, JSON.stringify(profile));
}

// 首次打开且本地无数据时，载入示例数据（占位数据，非真实用户数据）
async function seedExampleIfEmpty() {
  if (localStorage.getItem(STORE_SEEDED)) return;
  if (loadItems().length > 0) {
    localStorage.setItem(STORE_SEEDED, '1');
    return;
  }
  try {
    const res = await fetch('data/example-wardrobe.json');
    const data = await res.json();
    if (Array.isArray(data.items)) saveItems(data.items);
    if (data.profile) saveProfile(data.profile);
  } catch (e) {
    console.warn('示例数据载入失败', e);
  }
  localStorage.setItem(STORE_SEEDED, '1');
}

// 导出 JSON 文件
function exportJSON(items, profile) {
  const blob = new Blob(
    [JSON.stringify({ app: 'wardrobe-ai', version: 1, exportedAt: new Date().toISOString(), profile, items }, null, 2)],
    { type: 'application/json' }
  );
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'wardrobe-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

// 导入 JSON：返回 { items, profile }，结构不对时抛错
function parseImport(text) {
  const data = JSON.parse(text);
  const items = Array.isArray(data) ? data : data.items;
  if (!Array.isArray(items)) throw new Error('文件里没有找到 items 数组');
  const profile = data.profile && typeof data.profile === 'object' ? data.profile : {};
  return { items, profile };
}
