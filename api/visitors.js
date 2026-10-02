const { createHash } = require('node:crypto');

const visitorSet = 'adult-mental-wellness:all-time-unique-browsers';
const countrySet = 'adult-mental-wellness:all-time-countries';
const visitorIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const countryCodePattern = /^[A-Z]{2}$/;

function respond(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(data));
}

module.exports = async function visitorsHandler(req, res) {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'GET, DELETE');
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
  const countryHeader = req.headers['x-vercel-ip-country'];
  const countryCode = typeof countryHeader === 'string' ? countryHeader.toUpperCase() : '';
  const hasCountryCode = countryCodePattern.test(countryCode) && countryCode !== 'XX';
  try {
    const commands = [
      [req.method === 'DELETE' ? 'SREM' : 'SADD', visitorSet, hashedVisitorId],
      ['SCARD', visitorSet],
    ];
    if (req.method === 'GET' && hasCountryCode) commands.push(['SADD', countrySet, countryCode]);
    commands.push(['SCARD', countrySet]);
    const response = await fetch(`${redisUrl}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });
    const result = await response.json();
    const count = result?.[1]?.result;
    const countries = result?.at(-1)?.result;
    if (!response.ok || !Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(countries) || countries < 0) throw new Error();
    respond(res, 200, { count, countries });
  } catch {
    respond(res, 502, { error: 'Visitor count is temporarily unavailable.' });
  }
};