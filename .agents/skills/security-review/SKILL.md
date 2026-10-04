---
name: security-review
description: Perform a comprehensive security review and vulnerability assessment for the current workspace. Use this before major commits or when adding authentication, authorization, user input, file uploads, or APIs.
---

# Security Review Skill

This skill guides the agent through a thorough security review of the application.

## Trigger Conditions
Execute this workflow whenever:
- Adding/modifying authentication or authorization
- Handling user input or file uploads
- Creating new API endpoints
- Handling payments, secrets, or sensitive data
- Explicitly requested by the user

## Workflow Steps

1. **Information Gathering**
   - Identify the framework and technologies used (e.g., React, Express, PostgreSQL).
   - Locate sensitive areas: Auth middleware, database queries, API routes, upload handlers.

2. **Vulnerability Scanning**
   Inspect the code for the following weaknesses:
   - **Authentication/Authorization**: Broken access control, IDOR, missing RBAC, JWT weaknesses.
   - **Injection**: SQL injection, Command injection, NoSQL injection.
   - **XSS/CSRF**: Cross-site scripting in frontend components, missing anti-CSRF tokens.
   - **Data Exposure**: Leaked secrets, passwords, API keys in source code or logs.
   - **File Handling**: Unsafe file uploads, path traversal, missing MIME validation.
   - **Business Logic**: Inconsistent state, race conditions, rate limit bypasses.

3. **Reporting**
   For every discovered issue, generate a report containing:
   - **Severity**: (Low/Medium/High/Critical)
   - **Location**: (File path and line numbers)
   - **Reproduction**: Steps to reproduce in the local environment.
   - **Root Cause**: Why the vulnerability exists.
   - **Impact**: What an attacker could achieve.
   - **Recommended Fix**: Code snippet to resolve the issue.
   - **Regression Test**: How to test that the fix works.

4. **Remediation**
   - Propose the fixes to the user.
   - Wait for approval before applying the fixes.

*Note: Do not perform attacks against external systems. Only analyze the authorized local workspace.*
