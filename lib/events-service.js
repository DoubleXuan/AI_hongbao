const KNOWN_MODEL_PLATFORMS = [
  { tag: 'wechat', name: '微信 AI' },
  { tag: 'hunyuan', name: '腾讯混元' },
  { tag: 'qwen', name: '通义千问' },
  { tag: 'doubao', name: '豆包（字节）' },
  { tag: 'wenxin', name: '文心一言 / ERNIE' },
  { tag: 'kimi', name: 'Kimi（Moonshot）' },
  { tag: 'glm', name: '智谱 GLM' },
  { tag: 'openai', name: 'OpenAI GPT' },
  { tag: 'claude', name: 'Claude（Anthropic）' },
  { tag: 'gemini', name: 'Gemini（Google）' },
  { tag: 'grok', name: 'Grok（xAI）' },
  { tag: 'llama', name: 'Llama（Meta）' },
  { tag: 'mistral', name: 'Mistral' },
  { tag: 'deepseek', name: 'DeepSeek' },
  { tag: 'minimax', name: 'MiniMax' },
  { tag: 'yi', name: '零一万物 Yi' }
];

const KNOWN_INFO_PLATFORMS = [
  { tag: 'xiaohongshu', name: '小红书' },
  { tag: 'douyin', name: '抖音' },
  { tag: 'toutiao', name: '今日头条' },
  { tag: 'weibo', name: '微博' },
  { tag: 'zhihu', name: '知乎' },
  { tag: 'bilibili', name: 'B 站' }
];

const CORE_ACTIVITY_KEYWORDS = [
  '红包',
  '口令红包',
  '现金红包',
  '红包雨',
  '福利',
  '补贴',
  '春节',
  '新春',
  '过年'
];

const AI_KEYWORDS = [
  'ai',
  '大模型',
  '智能体',
  'gpt',
  'chatgpt',
  'openai',
  'gemini',
  'claude',
  'deepseek',
  'grok',
  'llama',
  'mistral',
  'minimax',
  '豆包',
  '文心',
  '千问',
  '混元',
  'kimi',
  'glm',
  'yi'
];

function toBingNewsRss(query) {
  return `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss`;
}

function toGoogleNewsRss(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`;
}

const MODEL_QUERY_SPECS = [
  { platform: '微信 AI', tag: 'wechat', query: '微信 红包 活动 AI', hints: ['微信'] },
  { platform: '腾讯混元', tag: 'hunyuan', query: '腾讯 混元 红包 活动', hints: ['混元', '腾讯'] },
  { platform: '通义千问', tag: 'qwen', query: '通义千问 红包 活动', hints: ['通义', '千问'] },
  { platform: '豆包（字节）', tag: 'doubao', query: '豆包 红包 活动', hints: ['豆包'] },
  { platform: '文心一言 / ERNIE', tag: 'wenxin', query: '文心一言 ERNIE 红包 活动', hints: ['文心', 'ernie'] },
  { platform: 'Kimi（Moonshot）', tag: 'kimi', query: 'Kimi Moonshot 红包 活动', hints: ['kimi', 'moonshot'] },
  { platform: '智谱 GLM', tag: 'glm', query: '智谱 GLM 红包 活动', hints: ['智谱', 'glm'] },
  { platform: 'OpenAI GPT', tag: 'openai', query: 'OpenAI ChatGPT 红包 活动', hints: ['openai', 'chatgpt', 'gpt'] },
  { platform: 'Claude（Anthropic）', tag: 'claude', query: 'Claude Anthropic 红包 活动', hints: ['claude', 'anthropic'] },
  { platform: 'Gemini（Google）', tag: 'gemini', query: 'Google Gemini 红包 活动', hints: ['gemini', 'google'] },
  { platform: 'Grok（xAI）', tag: 'grok', query: 'Grok xAI 红包 活动', hints: ['grok', 'xai'] },
  { platform: 'Llama（Meta）', tag: 'llama', query: 'Meta Llama 红包 活动', hints: ['llama', 'meta'] },
  { platform: 'Mistral', tag: 'mistral', query: 'Mistral AI 红包 活动', hints: ['mistral'] },
  { platform: 'DeepSeek', tag: 'deepseek', query: 'DeepSeek 红包 活动', hints: ['deepseek'] },
  { platform: 'MiniMax', tag: 'minimax', query: 'MiniMax 红包 活动', hints: ['minimax'] },
  { platform: '零一万物 Yi', tag: 'yi', query: '零一万物 Yi 红包 活动', hints: ['零一万物', 'yi'] }
];

const INFO_QUERY_SPECS = [
  { platform: '小红书', tag: 'xiaohongshu', query: 'site:xiaohongshu.com AI 红包 活动', hints: ['小红书', 'xiaohongshu'] },
  { platform: '抖音', tag: 'douyin', query: 'site:douyin.com AI 红包 活动', hints: ['抖音', 'douyin'] },
  { platform: '今日头条', tag: 'toutiao', query: 'site:toutiao.com AI 红包 活动', hints: ['头条', 'toutiao'] },
  { platform: '微博', tag: 'weibo', query: 'site:weibo.com AI 红包 活动', hints: ['微博', 'weibo'] },
  { platform: '知乎', tag: 'zhihu', query: 'site:zhihu.com AI 红包 活动', hints: ['知乎', 'zhihu'] },
  { platform: 'B 站', tag: 'bilibili', query: 'site:bilibili.com AI 红包 活动', hints: ['bilibili', 'b站'] }
];

const GENERAL_QUERY_SPECS = [
  { platform: 'AI 红包综合', tag: 'ai', query: 'AI APP 红包 过年 活动' },
  { platform: '多平台热点', tag: 'multi', query: '小红书 抖音 头条 AI 红包 活动' }
];

function createSources() {
  const sources = [];

  for (const spec of MODEL_QUERY_SPECS) {
    sources.push({
      platform: spec.platform,
      tag: spec.tag,
      query: spec.query,
      url: toBingNewsRss(spec.query),
      sourceName: 'Bing News RSS',
      platformHints: spec.hints || [],
      requireAiMarker: false
    });
  }

  for (const spec of INFO_QUERY_SPECS) {
    sources.push({
      platform: spec.platform,
      tag: spec.tag,
      query: spec.query,
      url: toBingNewsRss(spec.query),
      sourceName: 'Bing News RSS',
      platformHints: spec.hints || [],
      requireAiMarker: true
    });
    sources.push({
      platform: spec.platform,
      tag: spec.tag,
      query: spec.query,
      url: toGoogleNewsRss(spec.query),
      sourceName: 'Google News RSS',
      platformHints: spec.hints || [],
      requireAiMarker: true
    });
  }

  for (const spec of GENERAL_QUERY_SPECS) {
    sources.push({
      platform: spec.platform,
      tag: spec.tag,
      query: spec.query,
      url: toBingNewsRss(spec.query),
      sourceName: 'Bing News RSS',
      platformHints: [],
      requireAiMarker: true
    });
    sources.push({
      platform: spec.platform,
      tag: spec.tag,
      query: spec.query,
      url: toGoogleNewsRss(spec.query),
      sourceName: 'Google News RSS',
      platformHints: [],
      requireAiMarker: true
    });
  }

  return sources;
}

const FEED_SOURCES = createSources();

function escapeXmlText(value = '') {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/gi, ' ');
}

function stripHtml(value = '') {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(value = '') {
  return normalizeText(value)
    .replace(/\b(实时热点|热搜|最新消息|新闻)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTagContent(block, tag) {
  const cdataMatch = block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
  if (cdataMatch) return cdataMatch[1];
  const normalMatch = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return normalMatch ? normalMatch[1] : '';
}

function getAnyTagContent(block, tags) {
  for (const tag of tags) {
    const content = getTagContent(block, tag);
    if (content) return content;
  }
  return '';
}

function hasAnyKeyword(content, keywords) {
  const lower = normalizeText(content);
  return keywords.some((keyword) => lower.includes(normalizeText(keyword)));
}

function shouldIncludeItem({ title, description, source }) {
  const content = `${title} ${description}`;
  const hasCore = hasAnyKeyword(content, CORE_ACTIVITY_KEYWORDS);
  if (!hasCore) return false;

  const hasPlatformHint =
    !source.platformHints || source.platformHints.length === 0
      ? false
      : hasAnyKeyword(content, source.platformHints);

  const hasAiMarker = hasAnyKeyword(content, AI_KEYWORDS);
  if (source.requireAiMarker) {
    return hasAiMarker && (hasPlatformHint || source.tag === 'ai' || source.tag === 'multi');
  }

  return hasPlatformHint || hasAiMarker;
}

function parsePublishedAt(raw) {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function parseRssItems(xmlText, source) {
  const items = [];
  const matches = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || [];

  for (const itemBlock of matches) {
    const titleRaw = getAnyTagContent(itemBlock, ['title']);
    const linkRaw = getAnyTagContent(itemBlock, ['link']);
    const pubDateRaw = getAnyTagContent(itemBlock, ['pubDate', 'published', 'updated']);
    const descRaw = getAnyTagContent(itemBlock, ['description', 'summary', 'content']);
    const title = stripHtml(escapeXmlText(titleRaw));
    const description = stripHtml(escapeXmlText(descRaw));
    if (!shouldIncludeItem({ title, description, source })) continue;

    items.push({
      id: `${source.tag}-${Buffer.from(linkRaw || title).toString('base64').slice(0, 20)}`,
      title: title || '未命名活动',
      platform: source.platform,
      tag: source.tag,
      summary: description || '暂无摘要',
      sourceName: source.sourceName,
      sourceUrl: linkRaw || source.url,
      publishedAt: parsePublishedAt(pubDateRaw)
    });
  }

  return items;
}

function filterRecentEvents(items, days = 3) {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return items.filter((item) => {
    if (!item.publishedAt) return false;
    const ts = new Date(item.publishedAt).getTime();
    if (Number.isNaN(ts)) return false;
    return ts >= cutoff && ts <= now + 5 * 60 * 1000;
  });
}

function uniqueAndSort(items) {
  const map = new Map();

  for (const item of items) {
    const dedupeKey = `${item.tag}|${normalizeTitle(item.title)}`;
    if (!map.has(dedupeKey)) {
      map.set(dedupeKey, item);
      continue;
    }

    const current = map.get(dedupeKey);
    const currentTs = current.publishedAt ? new Date(current.publishedAt).getTime() : 0;
    const nextTs = item.publishedAt ? new Date(item.publishedAt).getTime() : 0;
    if (nextTs > currentTs) {
      map.set(dedupeKey, item);
    }
  }

  return [...map.values()].sort((a, b) => {
    const at = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bt = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bt - at;
  });
}

function groupEventsByPlatform(items) {
  const grouped = new Map();

  for (const item of items) {
    if (!grouped.has(item.tag)) {
      grouped.set(item.tag, {
        tag: item.tag,
        platform: item.platform,
        latestAt: item.publishedAt,
        count: 0,
        events: []
      });
    }
    const group = grouped.get(item.tag);
    group.count += 1;
    group.events.push(item);

    const latest = group.latestAt ? new Date(group.latestAt).getTime() : 0;
    const current = item.publishedAt ? new Date(item.publishedAt).getTime() : 0;
    if (current > latest) {
      group.latestAt = item.publishedAt;
    }
  }

  return [...grouped.values()]
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

async function fetchSource(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5500);
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (AI_hongbao_app)'
      },
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`${source.platform} 拉取失败: HTTP ${response.status}`);
    }
    const xml = await response.text();
    return parseRssItems(xml, source);
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackEvents() {
  const now = new Date().toISOString();
  return [
    {
      id: 'fallback-1',
      title: '请连接网络后刷新，获取最近 3 天红包活动',
      platform: '系统提示',
      tag: 'system',
      summary: '当前为离线降级数据。联网后会按平台聚合展示最近 3 天活动新闻。',
      sourceName: 'Local Fallback',
      sourceUrl: 'https://www.bing.com/news',
      publishedAt: now
    }
  ];
}

const CACHE_TTL_MS = Number(process.env.EVENTS_CACHE_TTL_MS || 3 * 60 * 1000);
let cacheData = null;
let cacheAt = 0;
let inflightPromise = null;

async function collectEvents() {
  const settled = await Promise.allSettled(FEED_SOURCES.map(fetchSource));
  const allItems = [];
  const errors = [];

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    } else {
      errors.push(result.reason?.message || '未知错误');
    }
  }

  const recent = filterRecentEvents(allItems, 3);
  const events = uniqueAndSort(recent).slice(0, 180);
  const groupedEvents = groupEventsByPlatform(events);

  if (events.length === 0) {
    return {
      updatedAt: new Date().toISOString(),
      total: 1,
      events: fallbackEvents(),
      groupedEvents: [],
      errors,
      modelPlatforms: KNOWN_MODEL_PLATFORMS,
      infoPlatforms: KNOWN_INFO_PLATFORMS,
      windowDays: 3
    };
  }

  return {
    updatedAt: new Date().toISOString(),
    total: events.length,
    events,
    groupedEvents,
    errors,
    modelPlatforms: KNOWN_MODEL_PLATFORMS,
    infoPlatforms: KNOWN_INFO_PLATFORMS,
    windowDays: 3
  };
}

async function getEvents() {
  const now = Date.now();
  if (cacheData && now - cacheAt < CACHE_TTL_MS) {
    return cacheData;
  }
  if (inflightPromise) {
    return inflightPromise;
  }

  inflightPromise = collectEvents()
    .then((result) => {
      cacheData = result;
      cacheAt = Date.now();
      return result;
    })
    .finally(() => {
      inflightPromise = null;
    });

  return inflightPromise;
}

module.exports = {
  KNOWN_MODEL_PLATFORMS,
  KNOWN_INFO_PLATFORMS,
  FEED_SOURCES,
  fallbackEvents,
  getEvents
};
