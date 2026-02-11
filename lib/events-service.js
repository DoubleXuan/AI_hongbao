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

const FEED_SOURCES = [
  {
    platform: '微信 AI',
    tag: 'wechat',
    query: '微信 红包 活动 AI'
  },
  {
    platform: '腾讯混元',
    tag: 'hunyuan',
    query: '腾讯 混元 红包 活动'
  },
  {
    platform: '通义千问',
    tag: 'qwen',
    query: '通义千问 红包 活动'
  },
  {
    platform: '豆包（字节）',
    tag: 'doubao',
    query: '豆包 红包 活动'
  },
  {
    platform: '文心一言 / ERNIE',
    tag: 'wenxin',
    query: '文心一言 红包 活动'
  },
  {
    platform: 'Kimi（Moonshot）',
    tag: 'kimi',
    query: 'Kimi 红包 活动'
  },
  {
    platform: '智谱 GLM',
    tag: 'glm',
    query: '智谱 GLM 红包 活动'
  },
  {
    platform: 'OpenAI GPT',
    tag: 'openai',
    query: 'OpenAI ChatGPT 红包 活动'
  },
  {
    platform: 'Claude（Anthropic）',
    tag: 'claude',
    query: 'Claude Anthropic 红包 活动'
  },
  {
    platform: 'Gemini（Google）',
    tag: 'gemini',
    query: 'Google Gemini 红包 活动'
  },
  {
    platform: 'Grok（xAI）',
    tag: 'grok',
    query: 'Grok xAI 红包 活动'
  },
  {
    platform: 'Llama（Meta）',
    tag: 'llama',
    query: 'Meta Llama 红包 活动'
  },
  {
    platform: 'Mistral',
    tag: 'mistral',
    query: 'Mistral AI 红包 活动'
  },
  {
    platform: 'DeepSeek',
    tag: 'deepseek',
    query: 'DeepSeek 红包 活动'
  },
  {
    platform: 'MiniMax',
    tag: 'minimax',
    query: 'MiniMax 红包 活动'
  },
  {
    platform: '零一万物 Yi',
    tag: 'yi',
    query: '零一万物 Yi 红包 活动'
  },
  {
    platform: 'AI 红包综合',
    tag: 'ai',
    query: 'AI APP 红包 过年 活动'
  }
].map((item) => ({
  ...item,
  url: `https://www.bing.com/news/search?q=${encodeURIComponent(item.query)}&format=rss`,
  keywords: ['红包', '活动', '春节', '过年', ...item.query.split(' ')]
}));

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

function parseRssItems(xmlText, source) {
  const items = [];
  const matches = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || [];

  for (const itemBlock of matches) {
    const titleRaw = getTagContent(itemBlock, 'title');
    const linkRaw = getTagContent(itemBlock, 'link');
    const pubDateRaw = getTagContent(itemBlock, 'pubDate');
    const descRaw = getTagContent(itemBlock, 'description');
    const title = stripHtml(escapeXmlText(titleRaw));
    const description = stripHtml(escapeXmlText(descRaw));
    const content = `${title} ${description}`.toLowerCase();
    const include = source.keywords.some((k) => content.includes(String(k).toLowerCase()));
    if (!include) continue;

    items.push({
      id: `${source.tag}-${Buffer.from(linkRaw || title).toString('base64').slice(0, 20)}`,
      title: title || '未命名活动',
      platform: source.platform,
      tag: source.tag,
      summary: description || '暂无摘要',
      sourceName: 'Bing News RSS',
      sourceUrl: linkRaw || source.url,
      publishedAt: pubDateRaw ? new Date(pubDateRaw).toISOString() : null
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
  const timeout = setTimeout(() => controller.abort(), 6500);
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
      summary: '当前为离线降级数据。联网后可自动拉取微信、混元、千问及更多 AI 平台活动资讯。',
      sourceName: 'Local Fallback',
      sourceUrl: 'https://www.bing.com/news',
      publishedAt: now
    }
  ];
}

async function getEvents() {
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
      modelPlatforms: KNOWN_MODEL_PLATFORMS
    };
  }

  const events = uniqueAndSort(allItems).slice(0, 120);
  return {
    updatedAt: new Date().toISOString(),
    total: events.length,
    events,
    errors,
    modelPlatforms: KNOWN_MODEL_PLATFORMS
  };
}

module.exports = {
  KNOWN_MODEL_PLATFORMS,
  FEED_SOURCES,
  fallbackEvents,
  getEvents
};
