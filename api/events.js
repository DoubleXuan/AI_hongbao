const {
  getEvents,
  fallbackEvents,
  KNOWN_MODEL_PLATFORMS,
  KNOWN_INFO_PLATFORMS
} = require('../lib/events-service');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ message: 'Method Not Allowed' }));
    return;
  }

  try {
    const data = await getEvents();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        updatedAt: new Date().toISOString(),
        total: 1,
        events: fallbackEvents(),
        errors: [err.message || '服务异常'],
        modelPlatforms: KNOWN_MODEL_PLATFORMS,
        infoPlatforms: KNOWN_INFO_PLATFORMS
      })
    );
  }
};
