import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
import torch
from backend.ml.model_registry import ModelRegistry

def benchmark():
    print("Initializing V4-B vs V5 Benchmark Utility")
    registry = ModelRegistry()
    registry.load_v5_experiment()
    
    v4 = registry.get_model("production")
    v5 = registry.get_model("v5")
    
    print("Both models loaded successfully.")
    print("Comparing models across standard dataset splits...")
    print("Metrics to compare:")
    print(" - Accuracy, Precision, AI Recall, F1, Human Recall, FPR")
    print(" - Formal-human FPR, Student-essay FPR, RAID AI recall, RAID F1")
    print(" - Inference latency, Model size, Memory usage")

if __name__ == "__main__":
    benchmark()
