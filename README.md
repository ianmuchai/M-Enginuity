# M-Enginuity website

Responsive Express/EJS website for M-Enginuity Tech & Trading Ltd, with a video carousel, service pages and an email inquiry endpoint.

## Local development

Use Node.js 24. Install dependencies with `npm ci`, copy `.env.example` to `.env`, then run `npm start`. Open `http://localhost:8000`.

Run `npm run check` and `npm test` before shipping changes. `npm audit --omit=dev` checks production dependency advisories.

## Vercel

Import this repository into Vercel and select the `main` production branch. The Express framework is configured in `vercel.json`; `server.js` exports the app, EJS templates are included in the function, and `public/` contains the CDN-served assets. Use Node.js 24. No custom build command or output directory is required.

Configure these environment variables in the Vercel project settings:

| Variable | Value |
| --- | --- |
| `SITE_URL` | Production origin, currently `https://menginuity.co.ke`; use the same origin as the final custom domain. |
| `SMTP_HOST` | Mail provider's SMTP hostname. |
| `SMTP_PORT` | Usually `587` for STARTTLS or `465` for implicit TLS. |
| `SMTP_SECURE` | `true` for port 465; otherwise `false`. |
| `SMTP_USER`, `SMTP_PASS` | Mail credentials; mark sensitive and never commit them. |
| `SMTP_FROM` | Sender address authorized by the mail provider. |
| `INQUIRY_TO` | Defaults to `info@menginuity.co.ke`. |

Configure SPF, DKIM and DMARC with the mail/domain provider. After deploying, confirm all pages, external video playback, the form and actual email delivery. SMTP connectivity and domain DNS cannot be verified by local tests.

Set a Vercel Firewall rate-limit rule for POST `/api/inquiries` before public launch. The application enforces five requests per IP per 15 minutes within each function instance; this memory-based limit is supplemental and does not coordinate across Vercel instances. Use the firewall or a shared rate-limit store for deployment-wide enforcement. Enable deployment protection for preview URLs.

## SEO

Pages include unique titles/descriptions, canonical URLs, Open Graph/Twitter metadata and business structured data. `/sitemap.xml` lists the eight public pages, and `/robots.txt` advertises it. Non-production Vercel environments send `noindex, nofollow` and disallow crawling. Set `SITE_URL` to the real production origin before launch, attach that domain in Vercel, and submit the sitemap to Search Console after launch. Structured data uses the published company contact details; no reviews or ratings are invented.

## Security and assets

Only files in `public/` are public. Source, tests, environment files and dependencies are not served. The app applies a nonce-based Content Security Policy, restricted media/font hosts, safe error responses, inquiry validation, cross-site submission checks, a honeypot and SMTP timeouts. Vercel also applies the security headers in `vercel.json` to CDN-served assets.

The company logo and service imagery load from `menginuity.co.ke`; videos load from Pexels and fonts from Google Fonts. Their availability depends on those hosts. The service worker caches the site shell for offline use, but excludes API requests and external media. Increment asset/cache versions when updating frontend files.
