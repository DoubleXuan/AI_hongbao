const eventListEl = document.getElementById('eventList');
const refreshBtn = document.getElementById('refreshBtn');
const autoRefreshBtn = document.getElementById('autoRefreshBtn');
const platformFilterEl = document.getElementById('platformFilter');
const keywordInputEl = document.getElementById('keywordInput');
const lastUpdatedEl = document.getElementById('lastUpdated');
const statusTextEl = document.getElementById('statusText');
const modelListEl = document.getElementById('modelList');
const analyzeBtn = document.getElementById('analyzeBtn');
const analysisNoteEl = document.getElementById('analysisNote');
const analyzeStatusEl = document.getElementById('analyzeStatus');
const analysisResultEl = document.getElementById('analysisResult');

let allEvents = [];
let modelPlatforms = [];
let infoPlatforms = [];
let windowDays = 3;
let autoRefreshTimer = null;
let autoRefreshEnabled = true;
const AUTO_REFRESH_MS = 60 * 1000;
const MAX_ITEMS_PER_PLATFORM = 6;

function formatDate(dateText) {
  if (!dateText) return '时间未知';
  const d = new Date(dateText);
  if (Number.isNaN(d.getTime())) return '时间未知';
  return d.toLocaleString('zh-CN', { hour12: false });
}

function setStatus(text, isError = false) {
  statusTextEl.textContent = `状态：${text}`;
  statusTextEl.style.color = isError ? '#b12222' : '';
}

function setAnalyzeStatus(text, isError = false) {
  analyzeStatusEl.textContent = `分析状态：${text}`;
  analyzeStatusEl.style.color = isError ? '#b12222' : '';
}

function uniqueByTag(items) {
  const map = new Map();
  for (const item of items) {
    if (!item || !item.tag || !item.name) continue;
    if (!map.has(item.tag)) map.set(item.tag, item);
  }
  return [...map.values()];
}

function ensurePlatformFilterOptions(platforms) {
  const previousValue = platformFilterEl.value;
  const uniquePlatforms = uniqueByTag(platforms);

  platformFilterEl.innerHTML = '';
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = '全部';
  platformFilterEl.appendChild(allOption);

  for (const platform of uniquePlatforms) {
    const option = document.createElement('option');
    option.value = platform.tag;
    option.textContent = platform.name;
    platformFilterEl.appendChild(option);
  }

  const aiOption = document.createElement('option');
  aiOption.value = 'ai';
  aiOption.textContent = 'AI 红包综合';
  platformFilterEl.appendChild(aiOption);

  const multiOption = document.createElement('option');
  multiOption.value = 'multi';
  multiOption.textContent = '多平台热点';
  platformFilterEl.appendChild(multiOption);

  const hasPrevious = [...platformFilterEl.options].some((opt) => opt.value === previousValue);
  platformFilterEl.value = hasPrevious ? previousValue : 'all';
}

function renderModelPlatforms(modelItems, infoItems) {
  modelListEl.innerHTML = '';
  const typedPlatforms = [
    ...uniqueByTag(modelItems).map((item) => ({ ...item, type: '模型' })),
    ...uniqueByTag(infoItems).map((item) => ({ ...item, type: '信息平台' }))
  ];

  if (typedPlatforms.length === 0) {
    const fallback = document.createElement('span');
    fallback.className = 'model-chip';
    fallback.textContent = '暂无平台数据';
    modelListEl.appendChild(fallback);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const platform of typedPlatforms) {
    const chip = document.createElement('span');
    chip.className = 'model-chip';
    chip.textContent = `${platform.name} · ${platform.type}`;
    fragment.appendChild(chip);
  }
  modelListEl.appendChild(fragment);
}

function filterEvents(items) {
  const selectedPlatform = platformFilterEl.value;
  const keyword = keywordInputEl.value.trim().toLowerCase();

  return items.filter((item) => {
    const platformOk = selectedPlatform === 'all' || item.tag === selectedPlatform;
    if (!platformOk) return false;

    if (!keyword) return true;
    const text = `${item.title} ${item.summary} ${item.platform}`.toLowerCase();
    return text.includes(keyword);
  });
}

function groupEventsByPlatform(items) {
  const map = new Map();

  for (const item of items) {
    if (!map.has(item.tag)) {
      map.set(item.tag, {
        tag: item.tag,
        platform: item.platform,
        count: 0,
        latestAt: item.publishedAt,
        events: []
      });
    }
    const group = map.get(item.tag);
    group.count += 1;
    group.events.push(item);

    const latest = group.latestAt ? new Date(group.latestAt).getTime() : 0;
    const current = item.publishedAt ? new Date(item.publishedAt).getTime() : 0;
    if (current > latest) {
      group.latestAt = item.publishedAt;
    }
  }

  return [...map.values()]
    .map((group) => ({
      ...group,
      events: group.events.sort((a, b) => {
        const at = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bt = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bt - at;
      })
    }))
    .sort((a, b) => {
      const at = a.latestAt ? new Date(a.latestAt).getTime() : 0;
      const bt = b.latestAt ? new Date(b.latestAt).getTime() : 0;
      return bt - at;
    });
}

function createPlatformGroupNode(group) {
  const groupNode = document.createElement('li');
  groupNode.className = 'platform-group';

  const head = document.createElement('div');
  head.className = 'platform-head';

  const title = document.createElement('h3');
  title.className = 'platform-title';
  title.textContent = `${group.platform}（${group.count}）`;

  const latest = document.createElement('span');
  latest.className = 'platform-latest';
  latest.textContent = `最近：${formatDate(group.latestAt)}`;

  head.appendChild(title);
  head.appendChild(latest);
  groupNode.appendChild(head);

  const eventItems = document.createElement('div');
  eventItems.className = 'platform-events';

  for (const item of group.events.slice(0, MAX_ITEMS_PER_PLATFORM)) {
    const row = document.createElement('article');
    row.className = 'platform-event';

    const rowTitle = document.createElement('a');
    rowTitle.className = 'platform-event-title';
    rowTitle.href = item.sourceUrl;
    rowTitle.target = '_blank';
    rowTitle.rel = 'noopener noreferrer';
    rowTitle.textContent = item.title;

    const rowMeta = document.createElement('div');
    rowMeta.className = 'platform-event-meta';
    rowMeta.textContent = `${formatDate(item.publishedAt)} · ${item.sourceName}`;

    row.appendChild(rowTitle);
    row.appendChild(rowMeta);
    eventItems.appendChild(row);
  }

  groupNode.appendChild(eventItems);

  if (group.events.length > MAX_ITEMS_PER_PLATFORM) {
    const more = document.createElement('p');
    more.className = 'group-more';
    more.textContent = `仅展示前 ${MAX_ITEMS_PER_PLATFORM} 条，剩余 ${group.events.length - MAX_ITEMS_PER_PLATFORM} 条请按关键词进一步筛选。`;
    groupNode.appendChild(more);
  }

  return groupNode;
}

function renderEvents(items) {
  eventListEl.innerHTML = '';
  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = '最近 3 天暂无匹配活动，建议更换筛选条件或稍后刷新。';
    eventListEl.appendChild(empty);
    return;
  }

  const grouped = groupEventsByPlatform(items);
  const fragment = document.createDocumentFragment();
  for (const group of grouped) {
    fragment.appendChild(createPlatformGroupNode(group));
  }
  eventListEl.appendChild(fragment);
}

function rerenderByFilter() {
  renderEvents(filterEvents(allEvents));
}

async function fetchEvents() {
  setStatus('加载中...');
  refreshBtn.disabled = true;
  try {
    const response = await fetch('/api/events');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();

    allEvents = Array.isArray(data.events) ? data.events : [];
    modelPlatforms = Array.isArray(data.modelPlatforms) ? data.modelPlatforms : modelPlatforms;
    infoPlatforms = Array.isArray(data.infoPlatforms) ? data.infoPlatforms : infoPlatforms;
    windowDays = Number.isFinite(data.windowDays) ? data.windowDays : windowDays;

    ensurePlatformFilterOptions([...modelPlatforms, ...infoPlatforms]);
    renderModelPlatforms(modelPlatforms, infoPlatforms);
    rerenderByFilter();

    lastUpdatedEl.textContent = `最近更新时间：${formatDate(data.updatedAt)}`;
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      setStatus(`近 ${windowDays} 天已加载 ${allEvents.length} 条（部分源失败 ${data.errors.length} 个）`, true);
    } else {
      setStatus(`近 ${windowDays} 天已加载 ${allEvents.length} 条`, false);
    }
  } catch (err) {
    setStatus(`加载失败：${err.message}`, true);
  } finally {
    refreshBtn.disabled = false;
  }
}

async function analyzeCurrentEvents() {
  const filtered = filterEvents(allEvents);
  if (filtered.length === 0) {
    setAnalyzeStatus('无可分析活动', true);
    analysisResultEl.textContent = '当前筛选结果为空，请先调整筛选条件或刷新数据。';
    return;
  }

  analyzeBtn.disabled = true;
  setAnalyzeStatus('分析中...');
  analysisResultEl.textContent = 'AI 正在分析，请稍候...';

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: filtered.slice(0, 20).map((item) => ({
          title: item.title,
          platform: item.platform,
          summary: item.summary,
          sourceUrl: item.sourceUrl,
          publishedAt: item.publishedAt
        })),
        note: analysisNoteEl.value.trim()
      })
    });

    let data = null;
    try {
      data = await response.json();
    } catch (_err) {
      data = null;
    }

    if (!response.ok) {
      const message = data?.analysis || data?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }

    const modelText = data.model ? `（模型：${data.model}）` : '';
    if (data.enabled) {
      setAnalyzeStatus(`已完成${modelText}`, false);
    } else {
      setAnalyzeStatus(`未启用${modelText}`, true);
    }
    analysisResultEl.textContent = data.analysis || '分析结果为空。';
  } catch (err) {
    setAnalyzeStatus(`失败：${err.message}`, true);
    analysisResultEl.textContent = '分析请求失败，请稍后重试。';
  } finally {
    analyzeBtn.disabled = false;
  }
}

function startAutoRefresh() {
  stopAutoRefresh();
  autoRefreshTimer = setInterval(fetchEvents, AUTO_REFRESH_MS);
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}

refreshBtn.addEventListener('click', fetchEvents);
platformFilterEl.addEventListener('change', rerenderByFilter);
keywordInputEl.addEventListener('input', rerenderByFilter);
analyzeBtn.addEventListener('click', analyzeCurrentEvents);

autoRefreshBtn.addEventListener('click', () => {
  autoRefreshEnabled = !autoRefreshEnabled;
  autoRefreshBtn.textContent = `自动刷新: ${autoRefreshEnabled ? '开' : '关'}`;
  if (autoRefreshEnabled) {
    startAutoRefresh();
    fetchEvents();
  } else {
    stopAutoRefresh();
  }
});

fetchEvents();
startAutoRefresh();
