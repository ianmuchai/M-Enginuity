const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
process.env.VERCEL = '1';
process.env.VERCEL_ENV = 'preview';
process.env.VERCEL_URL = 'preview.example.vercel.app';
process.env.SITE_URL = 'https://menginuity.co.ke';
const app = require('../server');
test('Vercel preview is no-indexed, sets HTTPS protections and accepts its own form origin', async () => {
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000');
    assert((await response.text()).includes('content="noindex, nofollow"'));
    assert.equal(await (await fetch(base + '/robots.txt')).text(), 'User-agent: *\nDisallow: /\n');
    const form = await fetch(base + '/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://preview.example.vercel.app' }, body: '{}' });
    assert.equal(form.status, 400);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
