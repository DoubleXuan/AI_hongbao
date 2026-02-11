const eventListEl = document.getElementById('eventList');
const templateEl = document.getElementById('eventItemTemplate');
const refreshBtn = document.getElementById('refreshBtn');
const autoRefreshBtn = document.getElementById('autoRefreshBtn');
const platformFilterEl = document.getElementById('platformFilter');
const keywordInputEl = document.getElementById('keywordInput');
const lastUpdatedEl = document.getElementById('lastUpdated');
const statusTextEl = document.getElementById('statusText');

let allEvents = [];
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
    renderEvents(filterEvents(allEvents));
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

function rerenderByFilter() {
  renderEvents(filterEvents(allEvents));
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
