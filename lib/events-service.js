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

function asKeywords(text) {
  return String(text)
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function toBingNewsRss(query) {
  return `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss`;
}

function toGoogleNewsRss(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`;
}

const MODEL_QUERY_SPECS = [
  { platform: '微信 AI', tag: 'wechat', query: '微信 红包 活动 AI' },
  { platform: '腾讯混元', tag: 'hunyuan', query: '腾讯 混元 红包 活动' },
  { platform: '通义千问', tag: 'qwen', query: '通义千问 红包 活动' },
  { platform: '豆包（字节）', tag: 'doubao', query: '豆包 红包 活动' },
  { platform: '文心一言 / ERNIE', tag: 'wenxin', query: '文心一言 ERNIE 红包 活动' },
  { platform: 'Kimi（Moonshot）', tag: 'kimi', query: 'Kimi Moonshot 红包 活动' },
  { platform: '智谱 GLM', tag: 'glm', query: '智谱 GLM 红包 活动' },
  { platform: 'OpenAI GPT', tag: 'openai', query: 'OpenAI ChatGPT 红包 活动' },
  { platform: 'Claude（Anthropic）', tag: 'claude', query: 'Claude Anthropic 红包 活动' },
  { platform: 'Gemini（Google）', tag: 'gemini', query: 'Google Gemini 红包 活动' },
  { platform: 'Grok（xAI）', tag: 'grok', query: 'Grok xAI 红包 活动' },
  { platform: 'Llama（Meta）', tag: 'llama', query: 'Meta Llama 红包 活动' },
  { platform: 'Mistral', tag: 'mistral', query: 'Mistral AI 红包 活动' },
  { platform: 'DeepSeek', tag: 'deepseek', query: 'DeepSeek 红包 活动' },
  { platform: 'MiniMax', tag: 'minimax', query: 'MiniMax 红包 活动' },
  { platform: '零一万物 Yi', tag: 'yi', query: '零一万物 Yi 红包 活动' }
];

const INFO_QUERY_SPECS = [
  { platform: '小红书', tag: 'xiaohongshu', query: 'site:xiaohongshu.com 红包 活动 AI' },
  { platform: '抖音', tag: 'douyin', query: 'site:douyin.com 红包 活动 AI' },
  { platform: '今日头条', tag: 'toutiao', query: 'site:toutiao.com 红包 活动 AI' },
  { platform: '微博', tag: 'weibo', query: 'site:weibo.com 红包 活动 AI' },
  { platform: '知乎', tag: 'zhihu', query: 'site:zhihu.com 红包 活动 AI' },
  { platform: 'B 站', tag: 'bilibili', query: 'site:bilibili.com 红包 活动 AI' }
];

const GENERAL_QUERY_SPECS = [
  { platform: 'AI 红包综合', tag: 'ai', query: 'AI APP 红包 过年 活动' },
  { platform: '多平台热点', tag: 'multi', query: '小红书 抖音 头条 红包 活动 AI' }
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
      keywords: ['红包', '活动', ...asKeywords(spec.query)]
    });
  }

  for (const spec of INFO_QUERY_SPECS) {
    const keywords = ['红包', '活动', ...asKeywords(spec.query), spec.platform];

    sources.push({
      platform: spec.platform,
      tag: spec.tag,
      query: spec.query,
      url: toBingNewsRss(spec.query),
      sourceName: 'Bing News RSS',
      keywords
    });

    sources.push({
      platform: spec.platform,
      tag: spec.tag,
      query: spec.query,
      url: toGoogleNewsRss(spec.query),
      sourceName: 'Google News RSS',
      keywords
    });
  }

  for (const spec of GENERAL_QUERY_SPECS) {
    sources.push({
      platform: spec.platform,
      tag: spec.tag,
      query: spec.query,
      url: toBingNewsRss(spec.query),
      sourceName: 'Bing News RSS',
      keywords: ['红包', '活动', 'AI', ...asKeywords(spec.query)]
    });
    sources.push({
      platform: spec.platform,
      tag: spec.tag,
      query: spec.query,
      url: toGoogleNewsRss(spec.query),
      sourceName: 'Google News RSS',
      keywords: ['红包', '活动', 'AI', ...asKeywords(spec.query)]
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
    .replace(/&#39;/g, "'");
}

function stripHtml(value = '') {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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
    const content = `${title} ${description}`.toLowerCase();

    const include = source.keywords.some((keyword) => content.includes(String(keyword).toLowerCase()));
    if (!include) continue;

    const publishedAt = pubDateRaw ? new Date(pubDateRaw).toISOString() : null;
    items.push({
      id: `${source.tag}-${Buffer.from(linkRaw || title).toString('base64').slice(0, 20)}`,
      title: title || '未命名活动',
      platform: source.platform,
      tag: source.tag,
      summary: description || '暂无摘要',
      sourceName: source.sourceName,
      sourceUrl: linkRaw || source.url,
      publishedAt
    });
  }

  return items;
}

function uniqueAndSort(items) {
  const map = new Map();
  for (const item of items) {
    const dedupeKey = `${item.title}|${item.sourceUrl}`;
    if (!map.has(dedupeKey)) {
      map.set(dedupeKey, item);
    }
  }

  return [...map.values()].sort((a, b) => {
    const at = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bt = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
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
      title: '请连接网络后刷新，获取最新红包活动',
      platform: '系统提示',
      tag: 'system',
      summary: '当前为离线降级数据。联网后可自动拉取小红书、抖音、头条及主流 AI 平台活动资讯。',
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

  if (allItems.length === 0) {
    return {
      updatedAt: new Date().toISOString(),
      total: 1,
      events: fallbackEvents(),
      errors,
      modelPlatforms: KNOWN_MODEL_PLATFORMS,
      infoPlatforms: KNOWN_INFO_PLATFORMS
    };
  }

  const events = uniqueAndSort(allItems).slice(0, 180);
  return {
    updatedAt: new Date().toISOString(),
    total: events.length,
    events,
    errors,
    modelPlatforms: KNOWN_MODEL_PLATFORMS,
    infoPlatforms: KNOWN_INFO_PLATFORMS
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
