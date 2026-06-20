# Security Policy

## Supported versions

| Version | Supported          |
|---------|--------------------|
| 1.1.x   | Yes                |
| 1.0.x   | Critical fixes only|
| < 1.0   | No                 |

## Reporting a vulnerability

Email `security@srivtx.dev` with:
- Description of the vulnerability
- Steps to reproduce
- Impact assessment (what can an attacker do?)

Please do not file a public issue for security bugs.

## Response time

You will get an acknowledgment within 48 hours and a fix or mitigation within 7 days for critical issues.

## Scope

Tomato CSS is a build-time preprocessor. It runs on developer machines and in CI. Security concerns are limited to:
- Arbitrary code execution via malicious `.tom` files (we evaluate nothing; pure string parsing)
- Prototype pollution in the parser (we use plain objects, not user-controlled keys)
- Path traversal via `@import` (we resolve relative to the source file, but do not follow symlinks above the project root)
