// 数据层：衣物 + 身体速查数据，全部存在浏览器 localStorage，不走任何服务器。
// 导出/导入用 JSON 文件，方便备份与迁移。

const STORE_ITEMS = 'wardrobe-items-v1';
const STORE_PROFILE = 'wardrobe-profile-v1';
const STORE_SEEDED = 'wardrobe-seeded-v1';

const CATEGORIES = ['毛衣', 'T恤', '外套', '衬衫', '卫衣', '裤子', '鞋子'];

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

const FIT_OPTIONS = ['合身', '略大', '略小', '偏大', '偏小', '未试穿'];

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

// 图片压缩后转 data URL 存本地（不走外链）。超大图先缩到 800px 宽。
function fileToDataURL(file, maxWidth = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('图片格式无法识别'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function uid() {
  return 'item-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}
