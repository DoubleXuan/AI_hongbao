const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const PUBLIC_DIR = path.join(__dirname, 'public');

const FEED_SOURCES = [
  {
    platform: '微信',
    tag: 'wechat',
    url: 'https://www.bing.com/news/search?q=%E5%BE%AE%E4%BF%A1+%E7%BA%A2%E5%8C%85+%E6%B4%BB%E5%8A%A8&format=rss',
    keywords: ['红包', '活动', '微信']
  },
  {
    platform: '腾讯混元',
    tag: 'hunyuan',
    url: 'https://www.bing.com/news/search?q=%E8%85%BE%E8%AE%AF+%E6%B7%B7%E5%85%83+%E7%BA%A2%E5%8C%85&format=rss',
    keywords: ['红包', '混元', '浑元', '腾讯']
  },
  {
    platform: '通义千问',
    tag: 'qwen',
    url: 'https://www.bing.com/news/search?q=%E9%80%9A%E4%B9%89%E5%8D%83%E9%97%AE+%E7%BA%A2%E5%8C%85+%E6%B4%BB%E5%8A%A8&format=rss',
    keywords: ['红包', '千问', '通义']
  },
  {
    platform: 'AI 红包活动',
    tag: 'ai',
    url: 'https://www.bing.com/news/search?q=AI+APP+%E7%BA%A2%E5%8C%85+%E8%BF%87%E5%B9%B4+%E6%B4%BB%E5%8A%A8&format=rss',
    keywords: ['红包', 'AI', '活动', '过年', '春节']
  }
];

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp'
    };

    res.writeHead(200, { 'Content-Type': contentTypeMap[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

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
    const include = source.keywords.some((k) => content.includes(k.toLowerCase()));
    if (!include) continue;

    items.push({
      id: `${source.tag}-${Buffer.from(linkRaw).toString('base64').slice(0, 16)}`,
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
  const response = await fetch(source.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (AI_hongbao_app)'
    }
  });

  if (!response.ok) {
    throw new Error(`${source.platform} 拉取失败: HTTP ${response.status}`);
  }

  const xml = await response.text();
  return parseRssItems(xml, source);
}

function fallbackEvents() {
  const now = new Date().toISOString();
  return [
    {
      id: 'fallback-1',
      title: '请连接网络后刷新，获取最新红包活动',
      platform: '系统提示',
      tag: 'system',
      summary: '当前为离线降级数据。联网后可自动拉取微信、混元、千问等活动资讯。',
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
      errors
    };
  }

  const events = uniqueAndSort(allItems).slice(0, 80);
  return {
    updatedAt: new Date().toISOString(),
    total: events.length,
    events,
    errors
  };
}

function routeStatic(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname;
  const safePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }
  sendFile(res, safePath);
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  if (parsedUrl.pathname === '/api/events' && req.method === 'GET') {
    try {
      const data = await getEvents();
      sendJson(res, 200, data);
    } catch (err) {
      sendJson(res, 500, {
        updatedAt: new Date().toISOString(),
        total: 1,
        events: fallbackEvents(),
        errors: [err.message || '服务异常']
      });
    }
    return;
  }

  routeStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`AI 红包活动聚合服务已启动: http://${HOST}:${PORT}`);
});
