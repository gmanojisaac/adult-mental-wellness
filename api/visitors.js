const { createHash } = require('node:crypto');

const visitorSet = 'adult-mental-wellness:all-time-unique-browsers';
const visitorIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function respond(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(data));
}

module.exports = async function visitorsHandler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    respond(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const visitorId = req.headers['x-visitor-id'];
  if (typeof visitorId !== 'string' || !visitorIdPattern.test(visitorId)) {
    respond(res, 400, { error: 'A valid browser ID is required.' });
    return;
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, '');
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) {
    respond(res, 503, { error: 'Visitor counting is not configured.' });
    return;
  }

  const hashedVisitorId = createHash('sha256').update(visitorId).digest('hex');
  try {
    const response = await fetch(`${redisUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['SADD', visitorSet, hashedVisitorId],
        ['SCARD', visitorSet],
      ]),
    });
    const result = await response.json();
    const count = result?.[1]?.result;
    if (!response.ok || !Number.isSafeInteger(count) || count < 0) throw new Error();
    respond(res, 200, { count });
  } catch {
    respond(res, 502, { error: 'Visitor count is temporarily unavailable.' });
  }
};