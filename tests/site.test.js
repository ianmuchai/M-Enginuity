const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const nodemailer = require('nodemailer');
process.env.SITE_URL = 'https://menginuity.co.ke';
for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'VERCEL', 'VERCEL_ENV']) delete process.env[key];
const app = require('../server');
let server;
let base;
before(async () => { server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); base = 'http://127.0.0.1:' + server.address().port; });
after(() => new Promise((resolve) => server.close(resolve)));
const routes = ['/', '/about/', '/services/', '/plant-services/', '/machining-workshop/', '/welding-fabrication/', '/trading-services/', '/contacts/'];

test('every public page has canonical SEO metadata, valid business data and one H1', async () => {
  const titles = new Set();
  for (const route of routes) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert(html.includes('rel="canonical" href="https://menginuity.co.ke' + route + '"'));
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    const title = html.match(/<title>(.*?)<\/title>/)[1];
    assert(!titles.has(title)); titles.add(title);
    const data = html.match(/<script type="application\/ld\+json" nonce="([^"]+)">([\s\S]*?)<\/script>/);
    assert.equal(JSON.parse(data[2])['@type'], 'LocalBusiness');
    assert(response.headers.get('content-security-policy').includes("'nonce-" + data[1] + "'"));
    assert(html.includes('property="og:url"'));
  }
});
test('security headers restrict execution, framing and dangerous browser capabilities', async () => {
  const response = await fetch(base);
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const policy = response.headers.get('content-security-policy');
  assert(policy.includes("object-src 'none'"));
  assert(policy.includes("frame-ancestors 'none'"));
  assert(!policy.includes('unsafe-inline'));
});
test('sitemap lists all pages and robots publishes its location', async () => {
  const sitemap = await (await fetch(base + '/sitemap.xml')).text();
  assert.equal((sitemap.match(/<loc>/g) || []).length, routes.length);
  for (const route of routes) assert(sitemap.includes('https://menginuity.co.ke' + route + '</loc>'));
  assert((await (await fetch(base + '/robots.txt')).text()).includes('Sitemap: https://menginuity.co.ke/sitemap.xml'));
});
test('only public assets can be downloaded', async () => {
  for (const route of ['/styles.css?v=14', '/script.js?v=14', '/service-worker.js?v=14', '/manifest.webmanifest', '/icon.svg']) assert.equal((await fetch(base + route)).status, 200);
  for (const route of ['/server.js', '/package.json', '/package-lock.json', '/.env', '/.env.example', '/vercel.json', '/views/home.ejs', '/node_modules/express/package.json', '/public/../server.js']) assert.equal((await fetch(base + route)).status, 404, route);
});
test('health check does not expose mail configuration', async () => {
  assert.deepEqual(await (await fetch(base + '/api/health')).json(), { status: 'ok' });
});
const post = (body, headers = {}) => fetch(base + '/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
test('rejects cross-site submission and unsupported content types', async () => {
  assert.equal((await post({}, { Origin: 'https://attacker.example' })).status, 403);
  assert.equal((await post({}, { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  assert.equal((await post('data', { 'Content-Type': 'text/plain' })).status, 415);
});
test('malformed and excessive JSON produce safe errors without stack traces', async () => {
  for (const [body, code] of [['{', 400], [JSON.stringify({ brief: 'x'.repeat(33000) }), 413]]) {
    const response = await post(body); assert.equal(response.status, code);
    const result = await response.json(); assert(result.error); assert(!JSON.stringify(result).includes('server.js'));
  }
});
test('validates fields, rejects header injection, handles honeypot and fails honestly without SMTP', async () => {
  assert.equal((await post({})).status, 400);
  assert.equal((await post({ name: 'Header\r\nBcc: victim@example.com', email: 'test@example.com', brief: 'Test' })).status, 400);
  assert.equal((await post({ website: 'spam.example' })).status, 200);
  const response = await post({ name: 'Test', email: 'test@example.com', brief: 'Project brief' });
  assert.equal(response.status, 503);
  assert((await response.json()).error.includes('not configured'));
  assert.equal((await post({ name: 'Test', email: 'bad', brief: 'Test' })).status, 400);
});
test('rate limit cannot be bypassed by supplying an untrusted forwarding header locally', async () => {
  const response = await post({}, { 'X-Forwarded-For': '198.51.100.1' });
  assert.equal(response.status, 429);
  assert(response.headers.has('retry-after'));
});
test('patched mailer creates safe plain-text messages with structured reply addresses', async () => {
  const mailer = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix', disableFileAccess: true, disableUrlAccess: true });
  const result = await mailer.sendMail({ from: 'site@example.com', to: 'info@menginuity.co.ke', replyTo: { address: 'customer@example.com' }, subject: 'Website inquiry', text: '<script>untrusted project text</script>' });
  const message = result.message.toString();
  assert(message.includes('Content-Type: text/plain'));
  assert(message.includes('Reply-To: customer@example.com'));
  assert.deepEqual(result.envelope.to, ['info@menginuity.co.ke']);
});
