import os
import json
import csv

def main():
    print("Preparing Formal Human/AI Evaluation Dataset from HC3...")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    hc3_file = os.path.join(script_dir, "hc3", "all.jsonl")
    formal_dir = os.path.join(script_dir, "formal")
    out_file = os.path.join(formal_dir, "formal_subsets.csv")
    
    if not os.path.exists(hc3_file):
        print(f"Error: {hc3_file} not found. Please ensure HC3 is downloaded.")
        return
        
    os.makedirs(formal_dir, exist_ok=True)
    
    formal_sources = {"wiki_csai", "finance", "medicine"}
    samples = []
    
    with open(hc3_file, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            try:
                data = json.loads(line)
            except:
                continue
                
            source = data.get("source", "").strip()
            if source in formal_sources:
                for h in data.get("human_answers", []):
                    h_str = str(h).strip()
                    if h_str and "network error" not in h_str.lower() and len(h_str.split()) > 50:
                        samples.append({"text": h_str, "label": 0})
                        
                for a in data.get("chatgpt_answers", []):
                    a_str = str(a).strip()
                    if a_str and "network error" not in a_str.lower() and len(a_str.split()) > 50:
                        samples.append({"text": a_str, "label": 1})
                        
    with open(out_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "label"])
        writer.writeheader()
        writer.writerows(samples)
        
    print(f"Successfully extracted {len(samples)} formal samples to {out_file}")

if __name__ == "__main__":
    main()
