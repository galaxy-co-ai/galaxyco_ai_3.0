# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | :white_check_mark: |
| < 3.0   | :x:                |

## Reporting a Vulnerability

We take security seriously at GalaxyCo.ai. If you discover a security vulnerability, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report vulnerabilities through one of these channels:

1. **Email**: security@galaxyco.ai
2. **Private GitHub Issue**: Contact a maintainer to create a confidential issue

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., XSS, SQL injection, authentication bypass)
- Full path to the affected source file(s)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact assessment of the vulnerability
- Any potential mitigations you've identified

### Response Timeline

| Action | Timeline |
|--------|----------|
| Initial acknowledgment | Within 48 hours |
| Initial assessment | Within 5 business days |
| Status update | Every 7 days until resolved |
| Fix release | Depends on severity |

### Severity Levels

| Severity | Description | Target Resolution |
|----------|-------------|-------------------|
| Critical | Remote code execution, data breach | 24-48 hours |
| High | Authentication bypass, privilege escalation | 7 days |
| Medium | Information disclosure, CSRF | 30 days |
| Low | Minor issues, best practice violations | 90 days |

## Security Best Practices

### For Contributors

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Use Zod schemas for runtime validation
3. **Sanitize outputs** - Prevent XSS in rendered content
4. **Use parameterized queries** - Drizzle ORM handles this
5. **Implement proper auth checks** - Verify permissions on every request
6. **Keep dependencies updated** - Run `npm audit` regularly

### Environment Variables

- Never commit `.env.local` or any file containing secrets
- Document all required variables in `.env.example`
- Rotate credentials if accidentally exposed
- Use Vercel environment variables for production

### Authentication & Authorization

- All API routes must verify authentication via Clerk
- Multi-tenant queries must scope to `workspace_id`
- Sensitive operations require additional verification

## Bug Bounty

We currently do not have a formal bug bounty program. However, we deeply appreciate security researchers who responsibly disclose vulnerabilities and will acknowledge your contribution.

## Contact

- Security issues: security@galaxyco.ai
- General inquiries: hello@galaxyco.ai

Thank you for helping keep GalaxyCo.ai secure!
