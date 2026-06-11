# Security Policy

## Reporting a vulnerability

**Do not open a public GitHub issue for security bugs.**

Use GitHub's private vulnerability reporting: [Report a vulnerability](https://github.com/techempower-org/forageforall/security/advisories/new) (or email **jp@techempower.org** if you can't use GitHub). Include:
- Description of the issue
- Steps to reproduce
- Impact assessment (who's affected, how bad)
- Your contact info (we'll credit you if you want)

We aim to acknowledge within 48 hours and fix critical issues within 7 days.

## What counts as a security issue

- Location data leaking in ways that break our privacy defaults
- Authentication bypasses
- Data exfiltration paths
- XSS in the docs site or in-app webviews
- Any way to see private pins from another account
- Supply-chain issues (compromised dependency, vulnerable package we ship)

## What is NOT a security issue (file a normal bug)

- The app crashing
- UI glitches
- Missing input validation that doesn't cross trust boundaries
- Rate-limiting suggestions

## Scope

- **In scope:** the Expo app, the docs site, our InstantDB schema/permissions, our build/CI pipelines.
- **Out of scope:** third-party services (report directly to InstantDB, Google, etc.), attacks requiring physical device access, social engineering.

## Disclosure

We practice coordinated disclosure. Once a fix ships, we'll publish an advisory with credit (unless you prefer anonymity).

## Hall of fame

Security researchers who have responsibly disclosed:
- *(nobody yet — be the first!)*
