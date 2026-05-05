# Security Policy

## Scope

Taskmaster Pro is a static, local-first browser app. It has no backend service, authentication system, or server-side data store. Task data is stored in the user's browser with `localStorage`.

In scope for security review:

- DOM-based XSS risks in task creation, editing, rendering, and storage replay.
- Malformed or hostile `localStorage` data handling.
- Unsafe dependency loading patterns.
- Accidental secret handling or sensitive-data guidance.
- Mixed-content or insecure asset loading.

Out of scope:

- Server-side vulnerabilities; there is no server component.
- Account takeover; there are no accounts.
- Data recovery from a compromised browser, device, extension, or operating system.

## Data Handling

Do not store passwords, API keys, personal secrets, regulated data, or confidential work material in Taskmaster Pro. Browser `localStorage` is readable by JavaScript running on the same origin and is not encrypted.

## Current Security Controls

- User-controlled task content is inserted with text-safe DOM APIs, not HTML injection.
- Task descriptions are normalized and length-limited.
- Dates are strictly validated before being rendered or persisted.
- `localStorage` parsing is wrapped in a safe parser and malformed data does not crash the app.
- Unknown task statuses and invalid task records are ignored during load.
- All external resources are loaded over HTTPS.
- A meta Content Security Policy restricts script/style/font sources to the app and the required CDN/font hosts.

## Dependency Notes

The app currently uses CDN-hosted versions of jQuery, jQuery UI, Touch Punch, Bootstrap, Moment.js, Open Iconic, and Google Fonts. For a production deployment, prefer vendored assets or CDN links with Subresource Integrity hashes, and upgrade older dependencies where possible.

## Reporting

If this project is published, report vulnerabilities through the repository issue tracker or the maintainer's preferred private contact channel. Include:

- Affected file and version/commit.
- Steps to reproduce.
- Expected vs. actual behavior.
- Any proof-of-concept payloads, with safe test data only.
