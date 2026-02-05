# Security Policy for Chronos: Visual Context Manager

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| Older   | :x:                |

## Reporting a Vulnerability

We take the security of Chronos: Visual Context Manager seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:
1. Email to the developer (if available)
2. GitHub Security Advisory (preferred)
3. Direct message to the maintainer

### What to Include

Please include the following information:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Varies based on severity and complexity

## Security Measures

### Code Security
- All code is reviewed before release
- No remote code execution
- Minimal permission requests
- Content Security Policy (CSP) enforced

### Data Security
- All user data stored locally using Chrome's secure storage API
- No data transmission to external servers (unless explicitly required for functionality)
- Encryption for sensitive data when applicable
- No third-party analytics or tracking

### Update Policy
- Regular security audits
- Prompt patching of discovered vulnerabilities
- Transparent communication about security issues

## Best Practices for Users

1. **Keep Updated**: Always use the latest version from the Chrome Web Store
2. **Review Permissions**: Understand what permissions the extension requires
3. **Report Issues**: If you notice suspicious behavior, report it immediately
4. **Verify Source**: Only install from official sources

## Known Security Considerations

### Permissions
This extension requests specific permissions. Each permission is justified in our [Privacy Compliance](PRIVACY_COMPLIANCE.md) documentation.

### Third-Party Dependencies
- We minimize third-party dependencies
- All dependencies are vetted for security
- Regular updates to patch known vulnerabilities

## Disclosure Policy

When we receive a security bug report, we will:
1. Confirm the problem and determine affected versions
2. Audit code to find similar problems
3. Prepare fixes for all supported versions
4. Release patches as soon as possible

## Security Hall of Fame

We appreciate security researchers who responsibly disclose vulnerabilities. Contributors will be acknowledged here (with permission).

---

**Last Updated**: 1.0.0 release

For general questions about security, please contact the development team.
