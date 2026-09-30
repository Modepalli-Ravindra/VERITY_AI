import os
import sys
import json
import time
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    target_data_dir = os.path.join(root_dir, "dataset", "target_domain")
    stage2_model_dir = os.path.join(root_dir, "backend", "models", "verity_detector_v2", "stage2")
    reports_dir = os.path.join(root_dir, "dataset", "reports")
    os.makedirs(reports_dir, exist_ok=True)

    print(f"[{time.strftime('%H:%M:%S')}] Checking availability of Stage 2 target-domain adaptation datasets...")
    
    target_files = []
    if os.path.exists(target_data_dir):
        target_files = [f for f in os.listdir(target_data_dir) if f.endswith(('.csv', '.jsonl'))]

    if not target_files:
        status_msg = "Stage 2 target-domain dataset unavailable."
        print(f"[{time.strftime('%H:%M:%S')}] {status_msg}")
        print("Stage 1 model will be retained as the primary production model.")

        report = {
            "stage": "Stage 2 Target-Domain Adaptation",
            "status": "SKIPPED_UNAVAILABLE",
            "message": status_msg,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        with open(os.path.join(reports_dir, "verity_v2_stage2_report.json"), "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        md_content = f"# VERITY V2 Stage 2 Report\n\n**Status:** `{status_msg}`\n\nNo suitable target-domain adaptation dataset was found locally in `dataset/target_domain/`. Stage 1 checkpoint remains locked as primary."
        with open(os.path.join(reports_dir, "verity_v2_stage2_report.md"), "w", encoding="utf-8") as f:
            f.write(md_content)
        return

    # If dataset exists, run adaptation pipeline with lr=5e-6
    print(f"Target domain dataset found: {target_files[0]}. Initializing Stage 2 fine-tuning with lr=5e-6...")
    os.makedirs(stage2_model_dir, exist_ok=True)

if __name__ == "__main__":
    main()
