# Antigravity Skills Inventory

This document tracks the curated Agent Skills environment installed for this workspace.

## 1. Architecture & Design
* **Skill**: `archify`
* **Purpose**: Generates polished, interactive architecture, workflow, sequence, data-flow, and lifecycle diagrams from plain text or codebase context.
* **Source**: `tt-a1i/archify` (GitHub)
* **Scope**: Global / Workspace (`.agents/skills/archify`)
* **Status**: Installed & Active

## 2. Security
* **Skill**: `security-review`
* **Purpose**: Performs comprehensive security reviews, vulnerability scanning (Auth, Injection, XSS, Path Traversal), and generates remediation reports.
* **Source**: Custom Curated (Local)
* **Scope**: Workspace (`.agents/skills/security-review`)
* **Status**: Installed & Active

## 3. Debugging
* **Skill**: `systematic-debugging`
* **Purpose**: Enforces a rigorous, evidence-based debugging methodology to prevent random patching and regression introduction.
* **Source**: Custom Curated (Local)
* **Scope**: Workspace (`.agents/skills/systematic-debugging`)
* **Status**: Installed & Active

## 4. Master Workflow Rules
* **Rule**: `00-master-workflow.md`
* **Purpose**: Enforces the 9-Phase Master Development Workflow (Discover -> Plan -> Architect -> Implement -> Verify -> Security Review -> Performance Review -> Document -> Final Review) and strict domain guidelines for Frontend, Backend, Database, and UI/UX.
* **Source**: Custom Curated (Local)
* **Scope**: Workspace (`.agents/rules/00-master-workflow.md`)
* **Status**: Installed & Active

---

*Note: Rather than blindly installing dozens of overlapping external skills, this stack relies on a curated Master Workflow rule that leverages Antigravity's core capabilities combined with highly focused local skills (Security, Debugging, and Archify) to ensure high-quality, conflict-free engineering.*
