const { analyzeEvents } = require('../lib/analysis-service');

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }

  if (typeof req.body === 'string') {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch (_err) {
      return Promise.resolve({});
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (_err) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ message: 'Method Not Allowed' }));
    return;
  }

  try {
    const body = await readJsonBody(req);
    const events = Array.isArray(body?.events) ? body.events : [];
    const note = typeof body?.note === 'string' ? body.note : '';
    const result = await analyzeEvents({ events, note });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(result));
  } catch (err) {
    // Keep 200 so frontend can surface concrete message instead of generic HTTP 500.
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        enabled: false,
        model: null,
        generatedAt: new Date().toISOString(),
        analysis: `分析失败：${err.message || '未知错误'}`
      })
    );
  }
};
