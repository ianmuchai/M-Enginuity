require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const path = require('node:path');
const { randomBytes } = require('node:crypto');

const app = express();
const root = __dirname;
const port = Number(process.env.PORT || 8000);
const requestWindowMs = 15 * 60 * 1000;
const requestLimit = 5;
const requestCounts = new Map();
const siteUrl = new URL(process.env.SITE_URL || 'https://menginuity.co.ke').origin;
const preview = Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production');
const allowedOrigins = new Set([siteUrl]);
for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
  if (host) allowedOrigins.add(new URL('https://' + host).origin);
}
if (!process.env.VERCEL) {
  allowedOrigins.add('http://localhost:' + port);
  allowedOrigins.add('http://127.0.0.1:' + port);
}
app.locals.siteUrl = siteUrl;
app.locals.preview = preview;
app.locals.business = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': siteUrl + '/#business',
  name: 'M-Enginuity Tech & Trading Ltd',
  url: siteUrl + '/',
  image: 'https://menginuity.co.ke/wp-content/uploads/2021/07/menginuity-logo.png',
  telephone: ['+254727444301', '+254722318226'],
  email: 'info@menginuity.co.ke',
  address: { '@type': 'PostalAddress', streetAddress: 'Along Namanga Road', addressLocality: 'Athi River', addressCountry: 'KE', postOfficeBoxNumber: '599–00204' },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '17:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '09:00', closes: '14:00' }
  ]
};
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);
const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: process.env.SMTP_SECURE === 'true',
      requireTLS: process.env.SMTP_SECURE !== 'true',
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      disableFileAccess: true,
      disableUrlAccess: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

app.disable('x-powered-by');
if (process.env.VERCEL) app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(root, 'views'));
app.use((request, response, next) => {
  const nonce = randomBytes(18).toString('base64');
  response.locals.cspNonce = nonce;
  response.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'nonce-" + nonce + "'",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' https://menginuity.co.ke",
    "media-src 'self' https://videos.pexels.com",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; '));
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (process.env.VERCEL || request.secure) {
    response.setHeader('Strict-Transport-Security', 'max-age=31536000');
  }
  if (preview) response.setHeader('X-Robots-Tag', 'noindex, nofollow');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  next();
});
app.use(express.json({ limit: '32kb' }));

const services = [
  {
    path: '/plant-services/',
    slug: 'plant-services',
    title: 'Plant Services',
    image: 'https://menginuity.co.ke/wp-content/uploads/2021/07/plant-services-1024x683.jpg',
    imageAlt: 'Industrial plant machinery',
    summary: 'Installation, commissioning, relocation, maintenance and process optimisation.',
    details: [
      'Machinery and plant infrastructure',
      'Decommissioning and maintenance programmes',
      'Installation and commissioning support',
    ],
  },
  {
    path: '/machining-workshop/',
    slug: 'machining-workshop',
    title: 'Machining Workshop',
    image: 'https://menginuity.co.ke/wp-content/uploads/2021/07/machining-workshop-1024x682.jpg',
    imageAlt: 'Machining workshop equipment',
    summary: 'Lathe, milling and hydraulic pressing for mechanical parts.',
    details: [
      'Shafts, bearings, bushes and collars',
      'Spindles, slide guides and surface plates',
      'Workshop machining and repair work',
    ],
  },
  {
    path: '/welding-fabrication/',
    slug: 'welding-fabrication',
    title: 'Welding & Fabrication',
    image: 'https://menginuity.co.ke/wp-content/uploads/2021/07/fabrication-1024x683.jpg',
    imageAlt: 'Metal fabrication in an industrial workshop',
    summary: 'Stainless-steel TIG, aluminium MIG, brazing, fusing and arc welding.',
    details: [
      'Steelwork, tanks, silos and pipe networks',
      'Conveyors, chutes, hoppers and platforms',
      'Custom fabrication for industrial applications',
    ],
  },
  {
    path: '/trading-services/',
    slug: 'trading-services',
    title: 'Trading Services',
    image: 'https://menginuity.co.ke/wp-content/uploads/2021/07/plant-services-1024x683.jpg',
    imageAlt: 'Industrial equipment at a manufacturing plant',
    summary: 'Sourcing plant repair parts, equipment and quality spares.',
    details: [
      'Support for plant maintenance requirements',
      'Parts and equipment sourcing',
      'Quality spares for manufacturing operations',
    ],
  },
];

const pageDefaults = {
  services,
  activePage: '',
  currentPath: '',
};

app.get('/', (request, response) => {
  response.render('home', {
    ...pageDefaults,
    title: 'M-Enginuity Tech & Trading Ltd | Engineering in Kenya',
    description: 'Plant services, machining, welding, fabrication and trading services in Athi River, Kenya.',
    activePage: 'home',
    currentPath: '/',
  });
});

app.get('/index.html', (request, response) => response.redirect(301, '/'));

app.get(['/about', '/about/'], (request, response) => {
  response.render('about', {
    ...pageDefaults,
    title: 'About M-Enginuity | Engineering & Manufacturing Support',
    description: 'Learn about M-Enginuity Tech & Trading Ltd, an engineering and manufacturing support company based in Athi River, Kenya.',
    activePage: 'about',
    currentPath: '/about/',
  });
});

app.get(['/services', '/services/'], (request, response) => {
  response.render('services', {
    ...pageDefaults,
    title: 'Engineering Services | M-Enginuity Kenya',
    description: 'Explore plant services, machining, welding, fabrication and trading services from M-Enginuity.',
    activePage: 'services',
    currentPath: '/services/',
  });
});

services.forEach((service) => {
  app.get([service.path.slice(0, -1), service.path], (request, response) => {
    response.render('service', {
      ...pageDefaults,
      ...service,
      title: `${service.title} | M-Enginuity`,
      description: service.summary,
      activePage: 'services',
      currentPath: service.path,
    });
  });
});

app.get(['/contacts', '/contacts/'], (request, response) => {
  response.render('contacts', {
    ...pageDefaults,
    title: 'Contact M-Enginuity | Request an Engineering Quote',
    description: 'Contact M-Enginuity in Athi River, Kenya, about plant services, machining, fabrication or equipment sourcing.',
    activePage: 'contacts',
    currentPath: '/contacts/',
  });
});

app.get('/robots.txt', (request, response) => {
  response.type('text/plain').send(preview ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ' + siteUrl + '/sitemap.xml\n');
});

app.get('/sitemap.xml', (request, response) => {
  const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  response.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ['/', '/about/', '/services/', ...services.map((service) => service.path), '/contacts/'].map((route) => '<url><loc>' + escapeXml(siteUrl + route) + '</loc></url>').join('') + '</urlset>');
});

app.get('/api/health', (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.json({ status: 'ok' });
});

app.post('/api/inquiries', async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  if (!request.is('application/json')) return response.status(415).json({ error: 'Use application/json.' });
  if (request.get('Sec-Fetch-Site') === 'cross-site' || (request.get('Origin') && !allowedOrigins.has(request.get('Origin')))) {
    return response.status(403).json({ error: 'This origin is not allowed.' });
  }
  const now = Date.now();
  for (const [key, timestamps] of requestCounts) {
    if (!timestamps.some((timestamp) => now - timestamp < requestWindowMs)) requestCounts.delete(key);
  }
  if (requestCounts.size >= 10000 && !requestCounts.has(request.ip)) {
    response.setHeader('Retry-After', '900');
    return response.status(429).json({ error: 'Too many inquiries. Please try again later.' });
  }
  const ip = request.ip;
  const recentRequests = (requestCounts.get(ip) || []).filter(
    (timestamp) => now - timestamp < requestWindowMs
  );

  if (recentRequests.length >= requestLimit) {
    response.setHeader(
      'Retry-After',
      String(Math.ceil(requestWindowMs / 1000))
    );
    return response.status(429).json({
      error: 'Too many inquiries. Please try again later.',
    });
  }

  requestCounts.set(ip, [...recentRequests, now]);

  const body = request.body && typeof request.body === 'object' ? request.body : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email =
    typeof body.email === 'string' ? body.email.trim() : '';
  const brief =
    typeof body.brief === 'string' ? body.brief.trim() : '';
  const website =
    typeof body.website === 'string' ? body.website.trim() : '';

  if (website) {
    return response.status(200).json({ ok: true });
  }

  if (
    !name ||
    name.length > 120 ||
    /[\r\n\x00]/.test(name) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    !brief ||
    brief.length > 5000
  ) {
    return response.status(400).json({
      error: 'Enter a valid name, email address, and project brief.',
    });
  }

  if (!transporter) {
    return response.status(503).json({
      error: 'Email delivery is not configured. Please contact us by phone or email.',
    });
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.INQUIRY_TO || 'info@menginuity.co.ke',
      replyTo: { address: email },
      disableFileAccess: true,
      disableUrlAccess: true,
      subject: `Website inquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nProject brief:\n${brief}`,
    });

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Inquiry email delivery failed:', error.code || error.message);
    return response.status(502).json({
      error: 'We could not send your inquiry right now. Please contact us directly.',
    });
  }
});

// Serve only public assets; keep source and dependencies private.
const publicAssets = new Set(['/styles.css', '/script.js', '/service-worker.js', '/manifest.webmanifest', '/icon.svg', '/images/engineering-collaboration.jpg', '/images/site-engineers.jpg', '/images/project-planning.jpg']);
app.get([...publicAssets], (request, response) => {
  if (['/service-worker.js', '/script.js', '/styles.css'].includes(request.path)) response.setHeader('Cache-Control', 'no-cache');
  response.sendFile(path.join(root, 'public', request.path.slice(1)));
});

app.use((request, response) => {
  response.status(404).send('Not found');
});

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  const status = error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
  const message = status === 413 ? 'Request body is too large.' : status === 400 ? 'Invalid JSON body.' : 'Something went wrong. Please try again later.';
  if (status === 500) console.error('Request failed:', error.code || error.name);
  response.status(status).json({ error: message });
});

module.exports = app;
if (require.main === module && !process.env.VERCEL) {
  app.listen(port, process.env.HOST || '127.0.0.1', () => {
    console.log('M-Enginuity site listening on http://' + (process.env.HOST || '127.0.0.1') + ':' + port);
    if (!smtpConfigured) console.warn('Set SMTP_* environment variables to enable inquiry emails.');
  });
}
