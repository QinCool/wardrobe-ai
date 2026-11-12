// 主逻辑：衣柜看板渲染、分类筛选、单位切换、JSON 导入导出。
// 本页只做展示：加衣服、尺码建议、每日穿搭、出差行李都在 Personal Agent
// 聊天里由 Skill 完成，不在本页做。

let items = loadItems();
let profile = loadProfile();
let currentFilter = '全部';

const $ = (id) => document.getElementById(id);

// ---------- 单位显示：库里一律存厘米，显示可切英寸 ----------
function unitSuffix() { return profile.unit === 'inch' ? '″' : ''; }
function displayLen(cmValue) {
  if (cmValue === undefined || cmValue === null || cmValue === '') return '';
  return profile.unit === 'inch' ? cmToInch(cmValue) : String(cmValue);
}
function displayLenWithUnit(cmValue) {
  const v = displayLen(cmValue);
  return v === '' ? '' : v + (profile.unit === 'inch' ? '″' : 'cm');
}

// 长度类字段（显示时按单位换算）；鞋码等码数字段不换算
const LENGTH_KEYS = ['length', 'chest', 'shoulder', 'sleeve', 'collar', 'waist', 'pantsLength', 'hip', 'thigh', 'hem', 'rise', 'inseam', 'footLength'];

// ---------- 渲染 ----------
function renderQuickbar() {
  $('quickbar').innerHTML =
    '<span>脚长 <b>' + (profile.footLength ? displayLenWithUnit(profile.footLength) : '—') + '</b></span>' +
    '<span>中国码 <b>' + (profile.sizeCN || '—') + '</b></span>' +
    '<span>美国码 <b>' + (profile.sizeUS || '—') + '</b></span>' +
    '<span>长裤腰围 <b>' + (profile.pantsWaist ? displayLenWithUnit(profile.pantsWaist) : '—') + '</b></span>' +
    '<span>上衣常穿 <b>' + (profile.topSize || '—') + '</b></span>';
}

function itemSizesHTML(item) {
  const fields = SIZE_FIELDS[item.category] || [];
  return fields
    .filter(([label, key]) => item.measurements && item.measurements[key] !== undefined && item.measurements[key] !== '')
    .map(([label, key]) => {
      const raw = item.measurements[key];
      const shown = LENGTH_KEYS.includes(key) ? displayLen(raw) + unitSuffix() : raw;
      return '<span>' + label + ' ' + shown + '</span>';
    })
    .join('');
}

function renderItems() {
  const list = currentFilter === '全部' ? items : items.filter((i) => i.category === currentFilter);
  $('item-count').textContent = '共 ' + items.length + ' 件' + (currentFilter === '全部' ? '' : '，当前分类 ' + list.length + ' 件');
  if (!list.length) {
    $('items').innerHTML = '<p class="hint">这里还是空的。点页脚「导入 JSON」把衣柜数据导进来，或点「载入示例数据」看看模板长什么样。</p>';
    return;
  }
  $('items').innerHTML = list.map((item) => {
    const fitCls = item.fit && item.fit !== '合身' ? ' loose' : '';
    const photo = item.photo
      ? '<img src="' + item.photo + '" alt="">'
      : '<span>暂无照片</span>';
    return '<article class="card item-card">' +
      '<div class="item-photo">' + photo + '</div>' +
      '<div class="item-body">' +
      '<h3>' + escapeHTML(item.name || '未命名单品') + '</h3>' +
      '<div class="meta">' + escapeHTML(item.category || '') +
      (item.brand ? ' · ' + escapeHTML(item.brand) : '') +
      (item.price ? ' · ' + escapeHTML(formatPrice(item.price, item.priceCurrency || 'CNY')) : '') + '</div>' +
      (item.fit ? '<span class="badge' + fitCls + '">' + escapeHTML(item.fit) + '</span>' : '') +
      '<div class="sizes">' + itemSizesHTML(item) + '</div>' +
      (item.note ? '<div class="meta">' + escapeHTML(item.note) + '</div>' : '') +
      '</div></article>';
  }).join('');
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- 初始化 ----------
document.addEventListener('DOMContentLoaded', async () => {
  await seedExampleIfEmpty();
  items = loadItems();
  profile = loadProfile();

  renderQuickbar();
  renderItems();

  // 显示单位切换（cm / inch）：只改显示，库里存的厘米不变
  const unitSel = $('unit-select');
  unitSel.value = profile.unit || 'cm';
  unitSel.onchange = () => {
    profile.unit = unitSel.value;
    saveProfile(profile);
    renderQuickbar();
    renderItems();
  };

  // 分类筛选
  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.onclick = () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('active', b === btn));
      renderItems();
    };
  });

  // 导入导出
  $('export-btn').onclick = () => exportJSON(items, profile);
  $('import-file').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { items: imported, profile: importedProfile } = parseImport(await file.text());
      if (!confirm('将导入 ' + imported.length + ' 件单品，替换当前全部数据，确定吗？（建议先点导出备份）')) return;
      items = imported;
      profile = { ...profile, ...importedProfile };
      saveItems(items);
      saveProfile(profile);
      renderQuickbar();
      renderItems();
      alert('导入完成，共 ' + items.length + ' 件。');
    } catch (err) {
      alert('导入失败：' + err.message);
    }
    e.target.value = '';
  };
  $('load-example-btn').onclick = async () => {
    if (!confirm('将用示例数据替换当前全部数据，确定吗？')) return;
    localStorage.removeItem(STORE_SEEDED);
    await seedExampleIfEmpty();
    items = loadItems();
    profile = loadProfile();
    renderQuickbar();
    renderItems();
  };
});
