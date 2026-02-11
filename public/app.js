const eventListEl = document.getElementById('eventList');
const templateEl = document.getElementById('eventItemTemplate');
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
let autoRefreshTimer = null;
let autoRefreshEnabled = true;
const AUTO_REFRESH_MS = 60 * 1000;

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

  const hasPrevious = [...platformFilterEl.options].some((opt) => opt.value === previousValue);
  platformFilterEl.value = hasPrevious ? previousValue : 'all';
}

function renderModelPlatforms(platforms) {
  modelListEl.innerHTML = '';
  const uniquePlatforms = uniqueByTag(platforms);

  if (uniquePlatforms.length === 0) {
    const fallback = document.createElement('span');
    fallback.className = 'model-chip';
    fallback.textContent = '暂无平台数据';
    modelListEl.appendChild(fallback);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const platform of uniquePlatforms) {
    const chip = document.createElement('span');
    chip.className = 'model-chip';
    chip.textContent = platform.name;
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

function renderEvents(items) {
  eventListEl.innerHTML = '';
  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = '暂无匹配活动，建议更换筛选条件或稍后刷新。';
    eventListEl.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of items) {
    const node = templateEl.content.cloneNode(true);
    node.querySelector('.tag').textContent = item.platform;
    node.querySelector('.time').textContent = formatDate(item.publishedAt);
    node.querySelector('.title').textContent = item.title;
    node.querySelector('.summary').textContent = item.summary;
    const sourceEl = node.querySelector('.source');
    sourceEl.href = item.sourceUrl;
    sourceEl.textContent = `来源：${item.sourceName}`;
    fragment.appendChild(node);
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
    ensurePlatformFilterOptions(modelPlatforms);
    renderModelPlatforms(modelPlatforms);
    rerenderByFilter();
    lastUpdatedEl.textContent = `最近更新时间：${formatDate(data.updatedAt)}`;
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      setStatus(`部分数据源失败（${data.errors.length}个），已展示可用结果`, true);
    } else {
      setStatus(`已加载 ${allEvents.length} 条活动`, false);
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
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
