---
trigger: always_on
description: Master development workflow and engineering guidelines for the Verity project.
---

# Master Development Workflow & Guidelines

This document enforces the Master Engineering Stack rules for Antigravity in this workspace.

## 1. Master Workflow Phases
For any substantial project request, strictly follow these phases:
- **PHASE 1 (DISCOVER)**: Inspect repository, existing architecture, database, environment, tests, and skills.
- **PHASE 2 (PLAN)**: Define requirements, constraints, dependencies, risks, and verification plan. Create/update `task_plan.md`, `findings.md`, and `progress.md` for large tasks.
- **PHASE 3 (ARCHITECT)**: Use the `archify` skill to map components, data flow, API flow, and database relationships. Prefer the simplest architecture.
- **PHASE 4 (IMPLEMENT)**: Modify existing code, reuse patterns, avoid rewrites.
- **PHASE 5 (VERIFY)**: Run unit, integration, and E2E (Playwright) tests. Verify UI and API manually/visually.
- **PHASE 6 (SECURITY REVIEW)**: Trigger the `security-review` skill when touching auth, APIs, uploads, or secrets.
- **PHASE 7 (PERFORMANCE REVIEW)**: Measure frontend, backend, database, and asset performance.
- **PHASE 8 (DOCUMENT)**: Update README, API docs, architecture docs, and changelog.
- **PHASE 9 (FINAL REVIEW)**: Inspect git diff, unused code, secrets, and regressions.

## 2. Domain-Specific Guidelines

### Architecture
- Do not introduce unnecessary microservices.
- Identify failure points and boundaries before major implementations.

### Frontend Engineering
- Reuse existing components from the design system.
- Maintain consistent spacing, typography, and interaction patterns.
- Do not redesign unless explicitly requested.

### Backend Engineering
- Preserve API compatibility.
- Validate all external input.
- Use consistent error responses.

### Database Engineering
- Never randomly modify production data.
- Check backward compatibility before schema changes.
- Always create and verify migrations.

### Files & Storage
- Validate file type, size, and ensure safe naming. Prevent path traversal.

### UI/UX Quality
- Avoid generic AI-generated UI patterns.
- Prefer polished, production-quality interfaces.
- Check hierarchy, spacing, contrast, responsive behavior, and states (loading/empty/error).

### Git & Code Review
- Inspect diffs before committing.
- Remove debug code, unused imports, and secrets.
- Verify formatting and linting.

### File Organization
- Understand current structure first.
- Do not create random files or duplicate functionality.
- Never delete user data without explicit approval.
