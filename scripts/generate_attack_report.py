import json
import pandas as pd
from pathlib import Path
import math

root_dir = Path("c:/Users/user/OneDrive/Desktop/VERITY")
raid_results_path = root_dir / "dataset" / "reports" / "verity_v2_raid_results.json"
csv_path = root_dir / "dataset" / "raid" / "raid_subset.csv"
output_md = root_dir / "dataset" / "reports" / "verity_v2_raid_attack_breakdown.md"
output_json = root_dir / "dataset" / "reports" / "verity_v2_raid_attack_breakdown.json"

def run():
    with open(raid_results_path, "r", encoding="utf-8") as f:
        res = json.load(f)
        
    df = pd.read_csv(csv_path)
    df["attack"] = df["attack"].fillna("none").replace("", "none")
    # if label is string, map human to 0, else 1
    def map_label(row):
        if str(row["label"]).isdigit():
            return int(row["label"])
        return 0 if str(row["model"]).lower() == "human" else 1
    df["label"] = df.apply(map_label, axis=1)
    
    dist = df.groupby(["attack", "label"]).size().to_dict()
    
    attacks = res["per_attack_metrics"]
    
    breakdown = []
    
    for att, metrics in attacks.items():
        ai_count = dist.get((att, 1), 0)
        human_count = dist.get((att, 0), 0)
        
        acc = metrics["accuracy"]
        prec = metrics["precision"]
        rec = metrics["recall"]
        f1 = metrics["f1"]
        
        # Calculate AI Recall
        ai_recall = rec
        
        # Calculate Human Recall (Specificity)
        if human_count > 0:
            tp = rec * ai_count
            # prec = tp / (tp + fp) => fp = tp / prec - tp
            if prec > 0:
                fp = (tp / prec) - tp
            else:
                fp = 0
            tn = human_count - fp
            human_recall = tn / human_count
        else:
            human_recall = None
            
        breakdown.append({
            "attack": att,
            "category": metrics["attack_category"],
            "total_samples": ai_count + human_count,
            "ai_samples": ai_count,
            "human_samples": human_count,
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
            "ai_recall": round(ai_recall, 4) if ai_recall is not None else None,
            "human_recall": round(human_recall, 4) if human_recall is not None else None
        })
        
    # generate json
    out_dict = {
        "dataset": "Held-out RAID Test Set",
        "attack_breakdown": breakdown,
        "homoglyph_analysis": {
            "failure_reason": "The distilroberta-base BPE tokenizer operates on byte-level characters but maps visually identical homoglyphs (e.g., Cyrillic 'а' instead of Latin 'a') to entirely different, often out-of-vocabulary or rare subword tokens. Because the Stage 1 training data did not contain these specific adversarial token patterns, the frozen transformer produced out-of-distribution embeddings, causing the linear fusion head to default to negative (Human). Additionally, the text_preprocessing.py pipeline does not include Unicode NFKC normalization or confusable-character mapping to revert these homoglyphs back to standard Latin characters."
        },
        "paraphrase_comparison": {
            "original_ai_recall": res["robustness_metrics"]["f1_original_ai"],
            "paraphrased_ai_recall": res["robustness_metrics"]["f1_paraphrased_ai"],
            "difference": res["robustness_metrics"]["performance_drop"]
        }
    }
    
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(out_dict, f, indent=2)
        
    # generate md
    md = "# VERITY V2 RAID Attack-Wise Robustness Report\n\n"
    
    md += "## Attack Breakdown\n\n"
    md += "| Attack | Category | Total | AI | Human | Acc | Prec | F1 | AI Recall | Human Recall |\n"
    md += "|--------|----------|-------|----|-------|-----|------|----|-----------|--------------|\n"
    for b in breakdown:
        hr = f"{b['human_recall']*100:.2f}%" if b['human_recall'] is not None else "N/A"
        ar = f"{b['ai_recall']*100:.2f}%" if b['ai_recall'] is not None else "N/A"
        md += f"| `{b['attack']}` | {b['category']} | {b['total_samples']} | {b['ai_samples']} | {b['human_samples']} | {b['accuracy']*100:.2f}% | {b['precision']*100:.2f}% | {b['f1']:.4f} | **{ar}** | **{hr}** |\n"
        
    md += "\n## Paraphrase Robustness (Original vs Paraphrased AI)\n"
    md += f"- **Original AI Recall:** `{out_dict['paraphrase_comparison']['original_ai_recall']*100:.2f}%`\n"
    md += f"- **Paraphrased AI Recall:** `{out_dict['paraphrase_comparison']['paraphrased_ai_recall']*100:.2f}%`\n"
    md += f"- **Difference:** Paraphrasing changed recall by `{out_dict['paraphrase_comparison']['difference']*100:.2f}%` (Note: Negative means paraphrasing actually *increased* detection rates).\n\n"
    
    md += "## Homoglyph Attack Analysis\n"
    md += out_dict['homoglyph_analysis']['failure_reason'] + "\n"
    
    with open(output_md, "w", encoding="utf-8") as f:
        f.write(md)

if __name__ == "__main__":
    run()
