# Security maintenance

Keep Node.js 24 and dependencies patched. Run the checks and dependency audit before deployment. Never commit mail credentials, browser profiles, environment files or Vercel account state.

Report suspected vulnerabilities privately to `info@menginuity.co.ke`; avoid including credentials or customer data in public issues. Rotate any exposed credentials through their provider and redeploy.

The contact endpoint accepts JSON only, enforces field/body limits, rejects foreign browser origins and email-header control characters, and sends plain-text messages to a server-configured recipient. The server never accepts a client-controlled mail transport, attachment, recipient or file path. Cross-site checks and honeypots supplement abuse prevention; they do not authenticate callers.

Production requires HTTPS, correct SMTP configuration and deployment-wide rate limiting through Vercel Firewall or shared storage. The local in-memory limiter is per function instance. Apply least-privilege project access and preview deployment protection in Vercel. Review provider logs for repeated failures and abuse without recording inquiry contents unnecessarily.

Automated checks validate selected security behavior; they are not a penetration test or a guarantee against every vulnerability.
