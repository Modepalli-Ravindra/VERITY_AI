---
name: systematic-debugging
description: A rigorous, systematic approach to debugging application failures, test failures, and regressions. Use this instead of random patching.
---

# Systematic Debugging Skill

This skill provides a structured methodology for identifying and resolving bugs without causing regressions or applying blind patches.

## Workflow Steps

When a failure occurs, DO NOT immediately patch the code. Follow these steps strictly in order:

1. **Reproduce & Collect Evidence**
   - Gather error logs, stack traces, and console outputs.
   - Verify the exact steps required to trigger the bug.

2. **Isolate the Root Cause**
   - Identify the affected layer (Frontend, API, Database, Network).
   - Trace the data flow from the input to the failure point.
   - Answer: *Why did this happen?* (e.g., unexpected null value, race condition, missing await).

3. **Formulate the Fix**
   - Design the smallest, most targeted correct fix.
   - Ensure the fix addresses the root cause, not just the symptom.

4. **Implement & Verify**
   - Apply the fix.
   - Run targeted tests for the specific component.
   - Run the full regression test suite to ensure no unrelated functionality broke.
   - Verify the fix visually in the UI if applicable.

5. **Document**
   - Briefly explain the root cause and the applied fix to the user.
