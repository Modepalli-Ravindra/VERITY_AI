import os
import sys
import time
import subprocess
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

def run_step(step_name: str, cmd: str):
    print(f"\n=======================================================")
    print(f"[{time.strftime('%H:%M:%S')}] PIPELINE STEP: {step_name}")
    print(f"Executing: {cmd}")
    print("=======================================================")
    res = subprocess.run(cmd, shell=True, cwd=str(root_dir))
    if res.returncode != 0:
        print(f"ERROR: Step '{step_name}' failed with return code {res.returncode}")
        sys.exit(res.returncode)
    print(f"SUCCESS: Step '{step_name}' complete!")

def main():
    start_t = time.time()
    print(f"[{time.strftime('%H:%M:%S')}] Initiating VERITY V2 Automated ML Upgrade Pipeline...")

    # Step 1: Stage 1 Training
    run_step("1. Stage 1 Training", "python -u backend/ml/train_v2_stage1.py")

    # Step 2: Stage 1 Validation & Threshold Locking
    run_step("2. Stage 1 Validation & Threshold Selection", "python -u backend/ml/evaluate_v2_validation.py")

    # Step 3: Stage 2 Target-Domain Adaptation Check
    run_step("3. Stage 2 Target-Domain Adaptation Check", "python -u backend/ml/train_v2_stage2.py")

    # Step 4: Final Locked Held-Out RAID Evaluation
    run_step("4. Final Locked Held-Out RAID Test Evaluation", "python -u backend/ml/evaluate_v2_raid.py")

    # Step 5: Ablation Study
    run_step("5. Architectural Ablation Study", "python -u backend/ml/run_v2_ablations.py")

    # Step 6: Short Text Robustness Evaluation
    run_step("6. Short Text Robustness Evaluation", "python -u backend/ml/evaluate_v2_short_text.py")

    # Step 7: Unit Tests Suite (Phase 16)
    run_step("7. Comprehensive Unit Test Verification", "python -m unittest discover -s tests -p \"test_*.py\"")

    # Step 8: Before/After Comparison & Final Decision Report (Phase 17, 18, 19)
    run_step("8. Comparison & Final Report Generation", "python -u backend/ml/create_v2_reports.py")

    elapsed = round(time.time() - start_t, 2)
    print("\n=======================================================")
    print(f"[{time.strftime('%H:%M:%S')}] VERITY V2 FULL PIPELINE COMPLETE! ({elapsed}s)")
    print("=======================================================\n")

if __name__ == "__main__":
    main()
